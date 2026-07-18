import math
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import async_session
from models import Zone, Spot, SavedPlace, Prediction
from schemas import AgentTextRequest, AgentTextResponse, MapCard
from datetime import datetime, timezone, timedelta


DUBAI_OFFSET = timedelta(hours=4)
DUBAI_TZ = timezone(timedelta(hours=4))


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in meters between two points."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def detect_intent(text: str) -> str:
    """Pattern-match user text to determine intent."""
    text_lower = text.lower()

    if ("park" in text_lower or "spot" in text_lower or "space" in text_lower) and \
       any(w in text_lower for w in ["near", "find", "where", "available", "closest", "work", "home", "gym",
                                      "search", "in ", "at ", "around", "close", "look", "get", "show"]):
        return "find_parking"
    # Also catch "search for parking" or "look for parking" without location keywords
    if any(w in text_lower for w in ["search", "find", "look for"]) and \
       ("park" in text_lower or "spot" in text_lower):
        return "find_parking"
    if any(w in text_lower for w in ["predict", "will there be", "forecast", "expect", "busy", "later"]):
        return "predict"
    if any(w in text_lower for w in ["compare", "which"]) and any(w in text_lower for w in ["most", "best", "cheapest"]):
        return "compare"
    if any(w in text_lower for w in ["navigate", "take me", "directions", "route"]):
        return "navigate"
    if "pay" in text_lower:
        return "pay"
    return "general"


def resolve_place_reference(text: str, saved_places: list) -> Tuple[Optional[float], Optional[float], Optional[str]]:
    """Check if text references a saved place."""
    text_lower = text.lower()
    for place in saved_places:
        if place.label.lower() in text_lower:
            return place.lat, place.lng, place.label
        if place.custom_name and place.custom_name.lower() in text_lower:
            return place.lat, place.lng, place.custom_name
    return None, None, None


async def handle_find_parking(request: AgentTextRequest, session: AsyncSession) -> AgentTextResponse:
    """Handle find_parking intent."""
    reasoning = []

    # Get saved places
    result = await session.execute(select(SavedPlace).where(SavedPlace.user_id == "demo_user"))
    saved_places = result.scalars().all()

    # Resolve location reference
    place_lat, place_lng, place_name = resolve_place_reference(request.text, saved_places)

    if place_lat and place_lng:
        target_lat, target_lng = place_lat, place_lng
        reasoning.append(f"Resolved '{place_name}' from saved places → ({target_lat:.4f}, {target_lng:.4f})")
    elif request.lat and request.lng:
        target_lat, target_lng = request.lat, request.lng
        reasoning.append(f"Using provided coordinates → ({target_lat:.4f}, {target_lng:.4f})")
    else:
        return AgentTextResponse(
            text="I need a location to find parking. Try saying 'Find parking near my work' or provide coordinates.",
            reasoning_steps=["No location reference found in text", "No coordinates provided"]
        )

    # Find zones within 500m
    result = await session.execute(select(Zone))
    zones = result.scalars().all()

    zone_scores = []
    for zone in zones:
        spots = zone.spots
        if not spots:
            continue

        # Calculate zone center
        zone_lat = sum(s.lat for s in spots) / len(spots)
        zone_lng = sum(s.lng for s in spots) / len(spots)
        distance = haversine(target_lat, target_lng, zone_lat, zone_lng)

        if distance <= 500:
            free = sum(1 for s in spots if s.status == "free")
            total = len(spots)
            availability = free / total if total > 0 else 0

            # Proximity score (inverse, normalized to 0-1)
            proximity = 1 - (distance / 500)

            # Predicted future (check predictions)
            predicted_future = 0.5  # default
            if zone.predictions:
                now_naive = datetime.now(DUBAI_TZ).replace(tzinfo=None)
                future_preds = [p for p in zone.predictions if p.timestamp and p.timestamp.replace(tzinfo=None) > now_naive]
                if future_preds:
                    next_pred = min(future_preds, key=lambda p: p.timestamp)
                    predicted_future = 1 - (next_pred.predicted_occupancy / 100)

            # Composite score
            score = 0.4 * availability + 0.3 * proximity + 0.3 * predicted_future
            zone_scores.append((zone, score, free, total, distance, availability))
            reasoning.append(f"Zone '{zone.name}': {free}/{total} free, {distance:.0f}m away, score={score:.2f}")

    if not zone_scores:
        reasoning.append("No zones found within 500m radius")
        return AgentTextResponse(
            text="No parking zones found within 500m of your location. Try expanding your search area.",
            reasoning_steps=reasoning
        )

    # Rank by score
    zone_scores.sort(key=lambda x: x[1], reverse=True)
    best_zone, best_score, free, total, distance, _ = zone_scores[0]

    reasoning.append(f"Selected '{best_zone.name}' with highest composite score {best_score:.2f}")

    walking_min = int(distance / 80)  # ~80m/min walking speed

    map_card = MapCard(
        zone_id=best_zone.id,
        zone_name=best_zone.name,
        lat=sum(s.lat for s in best_zone.spots) / len(best_zone.spots),
        lng=sum(s.lng for s in best_zone.spots) / len(best_zone.spots),
        free_spots=free,
        total_spots=total,
        price_per_hour=best_zone.price_per_hour,
        walking_minutes=walking_min
    )

    text = f"I found parking at {best_zone.name} — {free} spots available out of {total}. "
    text += f"It's about {walking_min} min walk from your location. "
    text += f"Rate: AED {best_zone.price_per_hour:.0f}/hr."

    return AgentTextResponse(text=text, reasoning_steps=reasoning, map_card=map_card)


async def handle_predict(request: AgentTextRequest, session: AsyncSession) -> AgentTextResponse:
    """Handle predict intent."""
    reasoning = ["Detected prediction intent"]

    result = await session.execute(select(Zone))
    zones = result.scalars().all()

    if not zones:
        return AgentTextResponse(text="No zones available for prediction.", reasoning_steps=reasoning)

    # Use first zone or nearest
    zone = zones[0]
    if request.lat and request.lng:
        min_dist = float('inf')
        for z in zones:
            if z.spots:
                z_lat = sum(s.lat for s in z.spots) / len(z.spots)
                z_lng = sum(s.lng for s in z.spots) / len(z.spots)
                d = haversine(request.lat, request.lng, z_lat, z_lng)
                if d < min_dist:
                    min_dist = d
                    zone = z

    reasoning.append(f"Selected zone: {zone.name}")

    # Get predictions
    now_naive = datetime.now(DUBAI_TZ).replace(tzinfo=None)
    predictions = [p for p in zone.predictions if p.timestamp and p.timestamp.replace(tzinfo=None) > now_naive]
    predictions.sort(key=lambda p: p.timestamp)

    if predictions:
        next_hour = predictions[0]
        dubai_time = next_hour.timestamp + DUBAI_OFFSET
        reasoning.append(f"Next prediction: {next_hour.predicted_occupancy:.0f}% at {dubai_time.strftime('%H:%M')}")
        text = f"Prediction for {zone.name}: occupancy expected at {next_hour.predicted_occupancy:.0f}% "
        text += f"(confidence: {next_hour.confidence:.0%}). "
        if next_hour.predicted_occupancy < 60:
            text += "Good availability expected!"
        elif next_hour.predicted_occupancy < 80:
            text += "Moderate demand expected — consider arriving early."
        else:
            text += "High demand expected — book in advance if possible."
    else:
        text = f"Current availability at {zone.name}: "
        free = sum(1 for s in zone.spots if s.status == "free")
        text += f"{free}/{zone.total_spots} spots free."

    return AgentTextResponse(text=text, reasoning_steps=reasoning)


async def handle_compare(request: AgentTextRequest, session: AsyncSession) -> AgentTextResponse:
    """Handle compare intent."""
    reasoning = ["Detected compare intent"]

    result = await session.execute(select(Zone))
    zones = result.scalars().all()

    comparisons = []
    for zone in zones:
        free = sum(1 for s in zone.spots if s.status == "free")
        total = len(zone.spots)
        occ_pct = ((total - free) / total * 100) if total > 0 else 0
        comparisons.append((zone.name, free, total, occ_pct, zone.price_per_hour))
        reasoning.append(f"{zone.name}: {free}/{total} free ({occ_pct:.0f}% occupied), AED {zone.price_per_hour}/hr")

    comparisons.sort(key=lambda x: x[1], reverse=True)
    best = comparisons[0]

    text = f"Comparing all zones:\n"
    for name, free, total, occ, price in comparisons:
        text += f"• {name}: {free}/{total} free, AED {price}/hr\n"
    text += f"\nBest availability: {best[0]} with {best[1]} free spots."

    return AgentTextResponse(text=text, reasoning_steps=reasoning)


async def handle_navigate(request: AgentTextRequest, session: AsyncSession) -> AgentTextResponse:
    """Handle navigate intent."""
    return AgentTextResponse(
        text="Navigation started! Opening directions to the nearest available parking zone.",
        reasoning_steps=["Detected navigation intent", "Would integrate with maps API in production"]
    )


async def handle_pay(request: AgentTextRequest, session: AsyncSession) -> AgentTextResponse:
    """Handle pay intent."""
    return AgentTextResponse(
        text="Payment integration is available. Your session will be auto-charged at AED 4/hr when you leave the zone.",
        reasoning_steps=["Detected payment intent", "Demo mode: simulated payment response"]
    )


async def handle_general(request: AgentTextRequest, session: AsyncSession) -> AgentTextResponse:
    """Handle general/unknown intent."""
    return AgentTextResponse(
        text="I'm SpotSense AI — I can help you find parking, predict availability, compare zones, navigate to spots, or handle payments. What would you like to do?",
        reasoning_steps=["No specific intent detected", "Returning general help message"]
    )


async def process_agent_request(request: AgentTextRequest) -> AgentTextResponse:
    """Main agent entry point."""
    intent = detect_intent(request.text)

    async with async_session() as session:
        handlers = {
            "find_parking": handle_find_parking,
            "predict": handle_predict,
            "compare": handle_compare,
            "navigate": handle_navigate,
            "pay": handle_pay,
            "general": handle_general,
        }
        handler = handlers.get(intent, handle_general)
        return await handler(request, session)

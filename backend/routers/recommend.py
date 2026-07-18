import math
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Spot, Zone
from schemas import RecommendRequest, RecommendResponse

router = APIRouter(prefix="/api/recommend", tags=["recommend"])


def haversine_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points using haversine formula."""
    R = 6371000  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


@router.post("/optimal-spot", response_model=RecommendResponse)
async def get_optimal_spot(req: RecommendRequest, db: AsyncSession = Depends(get_db)):
    """Find the optimal free parking spot based on weighted scoring."""
    try:
        # Query all free spots joined with their zone
        result = await db.execute(
            select(Spot, Zone.name)
            .join(Zone, Spot.zone_id == Zone.id)
            .where(Spot.status == "free")
        )
        rows = result.all()

        if not rows:
            raise HTTPException(status_code=404, detail="No free spots available")

        # Determine weights based on whether saved_place is provided
        has_saved_place = req.saved_place_lat is not None and req.saved_place_lng is not None
        if has_saved_place:
            dest_weight = 0.5
            place_weight = 0.3
            time_weight = 0.2
        else:
            dest_weight = 0.7
            place_weight = 0.0
            time_weight = 0.3

        now = datetime.now(timezone.utc)
        best_spot = None
        best_zone_name = None
        best_score = -1.0
        best_distance = 0
        best_time_free = 0

        for spot, zone_name in rows:
            # Distance from spot to destination
            dist_to_dest = haversine_meters(spot.lat, spot.lng, req.destination_lat, req.destination_lng)
            dest_score = 1.0 / (1.0 + dist_to_dest / 100.0)

            # Distance from spot to saved place
            place_score = 0.0
            if has_saved_place:
                dist_to_place = haversine_meters(spot.lat, spot.lng, req.saved_place_lat, req.saved_place_lng)
                place_score = 1.0 / (1.0 + dist_to_place / 100.0)

            # Time spot has been free (since last_changed_at)
            time_free_seconds = 0
            if spot.last_changed_at:
                # Handle both timezone-aware and naive datetimes
                last_changed = spot.last_changed_at
                if last_changed.tzinfo is None:
                    last_changed = last_changed.replace(tzinfo=timezone.utc)
                time_free_seconds = max(0, int((now - last_changed).total_seconds()))
            time_score = min(time_free_seconds / 3600.0, 1.0)

            # Final weighted score
            score = dest_weight * dest_score + place_weight * place_score + time_weight * time_score

            if score > best_score:
                best_score = score
                best_spot = spot
                best_zone_name = zone_name
                best_distance = int(dist_to_dest)
                best_time_free = time_free_seconds

        return RecommendResponse(
            spot_id=best_spot.id,
            spot_lat=best_spot.lat,
            spot_lng=best_spot.lng,
            spot_name=best_spot.id,
            zone_name=best_zone_name,
            walking_distance_meters=best_distance,
            score=round(best_score, 4),
            time_free_seconds=best_time_free,
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

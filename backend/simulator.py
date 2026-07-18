import asyncio
import logging
import random
from typing import Tuple
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update
from database import async_session
from models import Spot, Zone

logger = logging.getLogger(__name__)

# Dubai is UTC+4
DUBAI_OFFSET = timedelta(hours=4)

# Time-of-day occupancy profiles (Dubai local time)
PROFILES = {
    (0, 6): (0.08, 0.15),     # Night: 8-15%
    (7, 10): (0.45, 0.85),    # Morning rush: ramp 45→85%
    (10, 12): (0.70, 0.80),   # Mid-morning: stable 70-80%
    (12, 13): (0.60, 0.70),   # Lunch dip: 60-70%
    (13, 17): (0.72, 0.82),   # Afternoon: 72-82%
    (17, 20): (0.85, 0.92),   # Evening rush: 85-92%
    (20, 24): (0.30, 0.50),   # Evening: winding down
}


def get_target_occupancy() -> Tuple[float, float]:
    """Get target occupancy range based on current Dubai time."""
    now_utc = datetime.now(timezone.utc)
    dubai_time = now_utc + DUBAI_OFFSET
    hour = dubai_time.hour

    for (start, end), (low, high) in PROFILES.items():
        if start <= hour < end:
            return (low, high)
    return (0.08, 0.15)  # fallback to night


async def simulate_tick(changed_spots: list):
    """Run one simulation tick: adjust spot statuses toward target occupancy."""
    async with async_session() as session:
        # Get all zones with spots
        result = await session.execute(select(Zone))
        zones = result.scalars().all()

        target_low, target_high = get_target_occupancy()
        target_mid = (target_low + target_high) / 2

        for zone in zones:
            spots = zone.spots
            if not spots:
                continue

            total = len(spots)
            occupied = sum(1 for s in spots if s.status == "occupied")
            current_occ = occupied / total if total > 0 else 0

            # Calculate how far we are from target
            diff = target_mid - current_occ

            for spot in spots:
                if spot.status in ("reserved", "sensor_offline"):
                    continue

                # Probability of flip proportional to distance from target
                flip_prob = min(abs(diff) * 0.3, 0.15)

                if random.random() < flip_prob:
                    now = datetime.now(timezone.utc)
                    if diff > 0 and spot.status == "free":
                        # Need more occupied spots
                        spot.status = "occupied"
                        spot.occupied_since = now
                        spot.last_changed_at = now
                        changed_spots.append({
                            "id": spot.id,
                            "status": "occupied",
                            "last_changed_at": now.isoformat()
                        })
                    elif diff < 0 and spot.status == "occupied":
                        # Need more free spots
                        spot.status = "free"
                        spot.occupied_since = None
                        spot.last_changed_at = now
                        changed_spots.append({
                            "id": spot.id,
                            "status": "free",
                            "last_changed_at": now.isoformat()
                        })

        await session.commit()


async def run_simulator(broadcast_fn):
    """Main simulator loop - runs every 2 seconds."""
    while True:
        try:
            changed_spots = []
            await simulate_tick(changed_spots)
            if changed_spots and broadcast_fn:
                await broadcast_fn({
                    "type": "spot_update",
                    "spots": changed_spots
                })
        except Exception as e:
            logger.error(f"Simulator error: {e}")
        await asyncio.sleep(2)

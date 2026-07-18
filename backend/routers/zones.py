from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Zone, Spot
from schemas import ZoneOut, ZoneDetailOut, SpotOut
import math

router = APIRouter(prefix="/api/zones", tags=["zones"])


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in meters between two points."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("/nearby", response_model=list[ZoneOut])
async def get_nearby_zones(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: float = Query(default=500),
    db: AsyncSession = Depends(get_db)
):
    """Get zones within radius_m meters of given coordinates."""
    try:
        result = await db.execute(select(Zone))
        zones = result.scalars().all()

        nearby = []
        for zone in zones:
            spots = zone.spots
            if not spots:
                continue
            # Zone center from spots
            zone_lat = sum(s.lat for s in spots) / len(spots)
            zone_lng = sum(s.lng for s in spots) / len(spots)
            distance = haversine(lat, lng, zone_lat, zone_lng)

            if distance <= radius_m:
                free = sum(1 for s in spots if s.status == "free")
                occupied = sum(1 for s in spots if s.status == "occupied")
                reserved = sum(1 for s in spots if s.status == "reserved")
                nearby.append(ZoneOut(
                    id=zone.id,
                    name=zone.name,
                    geojson_polygon=zone.geojson_polygon,
                    pricing_type=zone.pricing_type,
                    price_per_hour=zone.price_per_hour,
                    total_spots=zone.total_spots,
                    created_at=zone.created_at,
                    free_count=free,
                    occupied_count=occupied,
                    reserved_count=reserved,
                ))
        return nearby
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("", response_model=list[ZoneOut])
async def list_zones(db: AsyncSession = Depends(get_db)):
    """List all zones with computed spot counts."""
    try:
        result = await db.execute(select(Zone))
        zones = result.scalars().all()

        output = []
        for zone in zones:
            spots = zone.spots
            free = sum(1 for s in spots if s.status == "free")
            occupied = sum(1 for s in spots if s.status == "occupied")
            reserved = sum(1 for s in spots if s.status == "reserved")
            output.append(ZoneOut(
                id=zone.id,
                name=zone.name,
                geojson_polygon=zone.geojson_polygon,
                pricing_type=zone.pricing_type,
                price_per_hour=zone.price_per_hour,
                total_spots=zone.total_spots,
                created_at=zone.created_at,
                free_count=free,
                occupied_count=occupied,
                reserved_count=reserved,
            ))
        return output
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{zone_id}", response_model=ZoneDetailOut)
async def get_zone(zone_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single zone with all its spots."""
    try:
        result = await db.execute(select(Zone).where(Zone.id == zone_id))
        zone = result.scalar_one_or_none()
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")

        spots = zone.spots
        free = sum(1 for s in spots if s.status == "free")
        occupied = sum(1 for s in spots if s.status == "occupied")
        reserved = sum(1 for s in spots if s.status == "reserved")

        return ZoneDetailOut(
            id=zone.id,
            name=zone.name,
            geojson_polygon=zone.geojson_polygon,
            pricing_type=zone.pricing_type,
            price_per_hour=zone.price_per_hour,
            total_spots=zone.total_spots,
            created_at=zone.created_at,
            free_count=free,
            occupied_count=occupied,
            reserved_count=reserved,
            spots=[SpotOut(
                id=s.id,
                zone_id=s.zone_id,
                lat=s.lat,
                lng=s.lng,
                status=s.status,
                last_changed_at=s.last_changed_at,
                sensor_id=s.sensor_id,
                occupied_since=s.occupied_since,
            ) for s in spots]
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

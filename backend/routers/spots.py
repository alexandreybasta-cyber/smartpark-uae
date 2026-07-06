from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Spot, Sensor
from schemas import SpotDetailOut, SensorOut

router = APIRouter(prefix="/api/spots", tags=["spots"])


@router.get("/{spot_id}", response_model=SpotDetailOut)
async def get_spot(spot_id: str, db: AsyncSession = Depends(get_db)):
    """Get a single spot with sensor data."""
    result = await db.execute(select(Spot).where(Spot.id == spot_id))
    spot = result.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")

    sensor_out = None
    if spot.sensor:
        sensor_out = SensorOut(
            id=spot.sensor.id,
            spot_id=spot.sensor.spot_id,
            firmware_version=spot.sensor.firmware_version,
            battery_mv=spot.sensor.battery_mv,
            signal_rssi=spot.sensor.signal_rssi,
            last_heartbeat=spot.sensor.last_heartbeat,
            status=spot.sensor.status,
        )

    return SpotDetailOut(
        id=spot.id,
        zone_id=spot.zone_id,
        lat=spot.lat,
        lng=spot.lng,
        status=spot.status,
        last_changed_at=spot.last_changed_at,
        sensor_id=spot.sensor_id,
        occupied_since=spot.occupied_since,
        sensor=sensor_out,
    )

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Sensor
from schemas import SensorFleetSummary

router = APIRouter(prefix="/api/sensors", tags=["sensors"])


@router.get("", response_model=SensorFleetSummary)
async def get_sensor_fleet(db: AsyncSession = Depends(get_db)):
    """Get sensor fleet health summary."""
    result = await db.execute(select(Sensor))
    sensors = result.scalars().all()

    total = len(sensors)
    online = sum(1 for s in sensors if s.status == "online")
    offline = sum(1 for s in sensors if s.status == "offline")
    low_battery = sum(1 for s in sensors if s.battery_mv < 3000)

    return SensorFleetSummary(
        total=total,
        online=online,
        offline=offline,
        low_battery=low_battery,
    )

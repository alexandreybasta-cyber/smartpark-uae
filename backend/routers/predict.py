from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import Zone, Prediction
from schemas import PredictionOut
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/predict", tags=["predict"])


@router.get("/{zone_id}", response_model=list[PredictionOut])
async def get_predictions(zone_id: int, db: AsyncSession = Depends(get_db)):
    """Return predicted occupancy for next 12 hours (15-min intervals)."""
    try:
        # Verify zone exists
        result = await db.execute(select(Zone).where(Zone.id == zone_id))
        zone = result.scalar_one_or_none()
        if not zone:
            raise HTTPException(status_code=404, detail="Zone not found")

        # Get predictions from now for next 12 hours
        now = datetime.now(timezone.utc)
        end_time = now + timedelta(hours=12)

        result = await db.execute(
            select(Prediction)
            .where(Prediction.zone_id == zone_id)
            .where(Prediction.timestamp >= now)
            .where(Prediction.timestamp <= end_time)
            .order_by(Prediction.timestamp)
        )
        predictions = result.scalars().all()

        return [PredictionOut(
            timestamp=p.timestamp,
            predicted_occupancy=p.predicted_occupancy,
            confidence=p.confidence,
        ) for p in predictions]
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

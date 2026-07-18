from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import SavedPlace
from schemas import SavedPlaceOut, SavedPlaceCreate

router = APIRouter(prefix="/api/places", tags=["places"])


@router.get("", response_model=list[SavedPlaceOut])
async def list_places(db: AsyncSession = Depends(get_db)):
    """List saved places for demo_user."""
    try:
        result = await db.execute(
            select(SavedPlace).where(SavedPlace.user_id == "demo_user")
        )
        places = result.scalars().all()
        return [SavedPlaceOut.model_validate(p) for p in places]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("", response_model=SavedPlaceOut, status_code=201)
async def create_place(place: SavedPlaceCreate, db: AsyncSession = Depends(get_db)):
    """Create a new saved place."""
    try:
        new_place = SavedPlace(
            user_id="demo_user",
            label=place.label,
            custom_name=place.custom_name,
            lat=place.lat,
            lng=place.lng,
            address=place.address,
        )
        db.add(new_place)
        await db.commit()
        await db.refresh(new_place)
        return SavedPlaceOut.model_validate(new_place)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{place_id}", status_code=204)
async def delete_place(place_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a saved place."""
    try:
        result = await db.execute(
            select(SavedPlace).where(SavedPlace.id == place_id, SavedPlace.user_id == "demo_user")
        )
        place = result.scalar_one_or_none()
        if not place:
            raise HTTPException(status_code=404, detail="Place not found")
        await db.delete(place)
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

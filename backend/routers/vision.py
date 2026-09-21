"""Camera-vision endpoints: manage cameras, draw regions, stream frames.

Also exposes POST /api/vision/ingest so an EXTERNAL detector (for example a
LotVulture Community Edition instance bridged over webhook/MQTT) can push
per-space readings through exactly the same path as the built-in analyzer.
"""
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Camera, CameraRegion, DetectionEvent, Spot
from schemas import (CameraCreate, CameraOut, CameraUpdate, DetectionEventOut,
                     IngestRequest, RegionCreate, RegionOut, RegionUpdate)
from vision.analyzer import parse_polygon
from vision.worker import registry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/vision", tags=["vision"])

MJPEG_BOUNDARY = b"--spotsensevision"


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _region_out(r: CameraRegion) -> RegionOut:
    return RegionOut(
        id=r.id,
        camera_id=r.camera_id,
        spot_id=r.spot_id,
        label=r.label,
        polygon=parse_polygon(r.polygon),
        status=r.status,
        confidence=r.confidence,
        occupy_threshold=r.occupy_threshold,
        free_threshold=r.free_threshold,
        last_updated_at=r.last_updated_at,
    )


def _camera_out(c: Camera) -> CameraOut:
    return CameraOut(
        id=c.id,
        name=c.name,
        source_type=c.source_type,
        source_url=c.source_url,
        webcam_index=c.webcam_index,
        status=c.status,
        error_message=c.error_message,
        fps_target=c.fps_target,
        width=c.width,
        height=c.height,
        last_frame_at=c.last_frame_at,
        frames_analysed=c.frames_analysed or 0,
        created_at=c.created_at,
        regions=[_region_out(r) for r in c.regions],
    )


async def _revert_spot_if_unowned(session: AsyncSession, spot_id):
    """Put a spot back under simulator control if no region claims it."""
    if not spot_id:
        return
    res = await session.execute(
        select(CameraRegion.id).where(CameraRegion.spot_id == spot_id))
    if res.scalars().first() is None:
        spot = await session.get(Spot, spot_id)
        if spot is not None:
            spot.detection_source = "simulated"


async def _claim_spot(session: AsyncSession, spot_id):
    if not spot_id:
        return
    spot = await session.get(Spot, spot_id)
    if spot is not None:
        spot.detection_source = "camera"


# ---------------------------------------------------------------------------
# cameras
# ---------------------------------------------------------------------------
@router.get("/cameras", response_model=List[CameraOut])
async def list_cameras(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Camera).order_by(Camera.id))
    return [_camera_out(c) for c in res.scalars().all()]


@router.post("/cameras", response_model=CameraOut, status_code=201)
async def create_camera(payload: CameraCreate, db: AsyncSession = Depends(get_db)):
    if payload.source_type not in ("rtsp", "file", "webcam", "snapshot"):
        raise HTTPException(status_code=400, detail="source_type must be rtsp|file|webcam|snapshot")
    if payload.source_type in ("rtsp", "file", "snapshot") and not payload.source_url:
        raise HTTPException(status_code=400, detail="source_url is required for this source_type")
    cam = Camera(
        name=payload.name,
        source_type=payload.source_type,
        source_url=payload.source_url,
        webcam_index=payload.webcam_index,
        fps_target=payload.fps_target,
        status="offline",
    )
    db.add(cam)
    await db.commit()
    await db.refresh(cam)
    return _camera_out(cam)


@router.get("/cameras/{camera_id}", response_model=CameraOut)
async def get_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    cam = await db.get(Camera, camera_id)
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    return _camera_out(cam)


@router.put("/cameras/{camera_id}", response_model=CameraOut)
async def update_camera(camera_id: int, payload: CameraUpdate,
                        db: AsyncSession = Depends(get_db)):
    cam = await db.get(Camera, camera_id)
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    for field in ("name", "source_type", "source_url", "webcam_index", "fps_target"):
        val = getattr(payload, field)
        if val is not None:
            setattr(cam, field, val)
    await db.commit()
    await db.refresh(cam)
    return _camera_out(cam)


@router.delete("/cameras/{camera_id}", status_code=204)
async def delete_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    cam = await db.get(Camera, camera_id)
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    if registry:
        await registry.stop(camera_id)
    spot_ids = [r.spot_id for r in cam.regions]
    await db.delete(cam)
    await db.commit()
    for sid in spot_ids:
        await _revert_spot_if_unowned(db, sid)
    await db.commit()
    return Response(status_code=204)


@router.post("/cameras/{camera_id}/start", response_model=CameraOut)
async def start_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    cam = await db.get(Camera, camera_id)
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    if not registry.ready:
        raise HTTPException(status_code=503, detail="Vision registry not initialised")
    registry.start(camera_id)
    return _camera_out(cam)


@router.post("/cameras/{camera_id}/stop", response_model=CameraOut)
async def stop_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    cam = await db.get(Camera, camera_id)
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    if registry:
        await registry.stop(camera_id)
    cam.status = "offline"
    await db.commit()
    return _camera_out(cam)


@router.post("/cameras/{camera_id}/recalibrate", response_model=CameraOut)
async def recalibrate_camera(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Pin the next analysed frame as the empty-lot appearance baseline."""
    cam = await db.get(Camera, camera_id)
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    if not registry.ready or camera_id not in registry.runners:
        raise HTTPException(status_code=409, detail="Camera is not running")
    registry.get(camera_id).request_recalibrate()
    return _camera_out(cam)


# ---------------------------------------------------------------------------
# frames
# ---------------------------------------------------------------------------
@router.get("/cameras/{camera_id}/snapshot.jpg")
async def camera_snapshot(camera_id: int):
    if not registry.ready:
        raise HTTPException(status_code=503, detail="Vision registry not initialised")
    snap = registry.snapshot(camera_id)
    if snap is None:
        raise HTTPException(status_code=404, detail="No frame analysed yet")
    jpeg, _ = snap
    return Response(content=jpeg, media_type="image/jpeg",
                    headers={"Cache-Control": "no-store"})


@router.get("/cameras/{camera_id}/stream.mjpg")
async def camera_stream(camera_id: int):
    """MJPEG stream of the annotated live frame (usable in an <img> tag)."""
    if not registry.ready:
        raise HTTPException(status_code=503, detail="Vision registry not initialised")

    async def gen():
        last_at = 0.0
        while True:
            snap = registry.snapshot(camera_id)
            if snap is not None:
                jpeg, at = snap
                if at != last_at:
                    last_at = at
                    yield (MJPEG_BOUNDARY + b"\r\n"
                           b"Content-Type: image/jpeg\r\n"
                           b"Content-Length: " + str(len(jpeg)).encode() + b"\r\n\r\n"
                           + jpeg + b"\r\n")
            await asyncio.sleep(0.1)

    return StreamingResponse(gen(), media_type="multipart/x-mixed-replace; boundary=spotsensevision")


# ---------------------------------------------------------------------------
# regions
# ---------------------------------------------------------------------------
@router.post("/cameras/{camera_id}/regions", response_model=RegionOut, status_code=201)
async def create_region(camera_id: int, payload: RegionCreate,
                        db: AsyncSession = Depends(get_db)):
    cam = await db.get(Camera, camera_id)
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    if payload.spot_id:
        spot = await db.get(Spot, payload.spot_id)
        if spot is None:
            raise HTTPException(status_code=404, detail="Spot not found")
    region = CameraRegion(
        camera_id=camera_id,
        spot_id=payload.spot_id,
        label=payload.label,
        polygon=json.dumps(payload.polygon),
        occupy_threshold=payload.occupy_threshold,
        free_threshold=payload.free_threshold,
        status="unknown",
    )
    db.add(region)
    await _claim_spot(db, payload.spot_id)
    await db.commit()
    await db.refresh(region)
    return _region_out(region)


@router.put("/regions/{region_id}", response_model=RegionOut)
async def update_region(region_id: int, payload: RegionUpdate,
                        db: AsyncSession = Depends(get_db)):
    region = await db.get(CameraRegion, region_id)
    if region is None:
        raise HTTPException(status_code=404, detail="Region not found")
    old_spot = region.spot_id
    if payload.label is not None:
        region.label = payload.label
    if payload.polygon is not None:
        region.polygon = json.dumps(payload.polygon)
    if payload.occupy_threshold is not None:
        region.occupy_threshold = payload.occupy_threshold
    if payload.free_threshold is not None:
        region.free_threshold = payload.free_threshold
    if payload.spot_id is not None:
        if payload.spot_id:
            spot = await db.get(Spot, payload.spot_id)
            if spot is None:
                raise HTTPException(status_code=404, detail="Spot not found")
        region.spot_id = payload.spot_id or None
        await _claim_spot(db, region.spot_id)
        if old_spot and old_spot != region.spot_id:
            await _revert_spot_if_unowned(db, old_spot)
    await db.commit()
    await db.refresh(region)
    return _region_out(region)


@router.delete("/regions/{region_id}", status_code=204)
async def delete_region(region_id: int, db: AsyncSession = Depends(get_db)):
    region = await db.get(CameraRegion, region_id)
    if region is None:
        raise HTTPException(status_code=404, detail="Region not found")
    spot_id = region.spot_id
    await db.delete(region)
    await db.commit()
    await _revert_spot_if_unowned(db, spot_id)
    await db.commit()
    return Response(status_code=204)


# ---------------------------------------------------------------------------
# audit trail
# ---------------------------------------------------------------------------
@router.get("/cameras/{camera_id}/events", response_model=List[DetectionEventOut])
async def camera_events(camera_id: int, limit: int = 50,
                        db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(DetectionEvent)
        .where(DetectionEvent.camera_id == camera_id)
        .order_by(DetectionEvent.id.desc())
        .limit(min(max(limit, 1), 500)))
    return list(res.scalars().all())


# ---------------------------------------------------------------------------
# external detector ingest (LotVulture-compatible bridge)
# ---------------------------------------------------------------------------
@router.post("/ingest", response_model=List[DetectionEventOut])
async def ingest(payload: IngestRequest, db: AsyncSession = Depends(get_db)):
    """Accept per-space readings from an external detector."""
    if payload.camera_id is not None:
        cam = await db.get(Camera, payload.camera_id)
    elif payload.camera_name:
        res = await db.execute(select(Camera).where(Camera.name == payload.camera_name))
        cam = res.scalars().first()
    else:
        raise HTTPException(status_code=400, detail="camera_id or camera_name required")
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")

    now = datetime.now(timezone.utc)
    events = []
    broadcast_spots = []
    for reading in payload.readings:
        if reading.region_id is not None:
            region = await db.get(CameraRegion, reading.region_id)
        else:
            res = await db.execute(
                select(CameraRegion)
                .where(CameraRegion.camera_id == cam.id)
                .where(CameraRegion.label == reading.label))
            region = res.scalars().first()
        if region is None:
            continue
        new_status = "occupied" if reading.occupied else "free"
        region.confidence = reading.confidence
        region.last_updated_at = now
        if new_status != region.status:
            prev = region.status
            region.status = new_status
            if region.spot_id:
                spot = await db.get(Spot, region.spot_id)
                if spot is not None:
                    spot.status = new_status
                    spot.last_changed_at = now
                    spot.occupied_since = now if new_status == "occupied" else None
                    spot.detection_source = "ingest"
                    broadcast_spots.append({
                        "id": spot.id,
                        "status": new_status,
                        "last_changed_at": now.isoformat(),
                        "detection_source": "ingest",
                    })
            events.append(DetectionEvent(
                camera_id=cam.id, region_id=region.id, spot_id=region.spot_id,
                previous_status=prev, new_status=new_status,
                confidence=reading.confidence, source="ingest"))
    if events:
        db.add_all(events)
    await db.commit()

    if broadcast_spots and registry.ready:
        await registry.broadcast_fn({"type": "spot_update", "spots": broadcast_spots})
    return events

"""Camera-vision endpoints: manage cameras, draw regions, stream frames.

Also exposes POST /api/vision/ingest so an EXTERNAL detector (for example a
LotVulture Community Edition instance bridged over webhook/MQTT) can push
per-space readings through exactly the same path as the built-in analyzer.
"""
import asyncio
import json
import logging
import os
import tempfile
import time
import uuid
from datetime import datetime, timezone
from typing import List

import cv2
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Camera, CameraRegion, DetectionEvent, Spot
from schemas import (CameraCreate, CameraOut, CameraUpdate, DetectionEventOut,
                     IngestRequest, RegionCreate, RegionOut, RegionUpdate)
from vision.analyzer import parse_polygon
from vision.bays import detect_bays
from vision.sources import open_source
from vision.worker import registry

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/vision", tags=["vision"])

MJPEG_BOUNDARY = b"--spotsensevision"

# --- browser media upload -------------------------------------------------
# vision.py lives at backend/routers/vision.py, so this resolves to backend/.
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
MAX_UPLOAD_BYTES = 200 * 1024 * 1024  # 200 MB

# Hysteresis thresholds for AUTO-created regions (detected bays / fallback grid).
# The schema default (0.90) suits texture-rich footage but strands moderate-
# confidence car bays in 'unknown'; empty bays read ~0-0.05 and soft shadows
# <=~0.15, so 0.5 / 0.2 separates occupied from free cleanly on real imagery.
AUTO_OCCUPY_THRESHOLD = 0.5
AUTO_FREE_THRESHOLD = 0.2


def _upload_dir() -> str:
    """A writable directory for uploaded media, with a temp-dir fallback."""
    candidate = os.environ.get("VISION_UPLOAD_DIR") or os.path.join(
        _BACKEND_DIR, "uploads", "vision")
    try:
        os.makedirs(candidate, exist_ok=True)
        if os.access(candidate, os.W_OK):
            return candidate
    except OSError:
        pass
    fallback = os.path.join(tempfile.gettempdir(), "spotsense-vision-uploads")
    os.makedirs(fallback, exist_ok=True)
    return fallback


def _grid_polygons(cols: int, rows: int):
    """Uniform cols x rows grid of normalised polygons -> (label, polygon)."""
    cols = max(1, min(int(cols), 12))
    rows = max(1, min(int(rows), 12))
    out = []
    for r in range(rows):
        for c in range(cols):
            x0, x1 = c / cols, (c + 1) / cols
            y0, y1 = r / rows, (r + 1) / rows
            out.append((f"cell-{r * cols + c + 1}",
                        [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]))
    return out


async def _create_grid_regions(db: AsyncSession, camera_id: int,
                               cols: int, rows: int) -> List[CameraRegion]:
    made = []
    for label, poly in _grid_polygons(cols, rows):
        reg = CameraRegion(camera_id=camera_id, spot_id=None, label=label,
                           polygon=json.dumps(poly), status="unknown",
                           occupy_threshold=AUTO_OCCUPY_THRESHOLD,
                           free_threshold=AUTO_FREE_THRESHOLD)
        db.add(reg)
        made.append(reg)
    await db.commit()
    for reg in made:
        await db.refresh(reg)
    return made


def _first_frame(cam: Camera, tries: int = 8):
    """One representative frame for bay detection (image read or source grab)."""
    if cam.source_type == "snapshot" and cam.source_url:
        frame = cv2.imread(cam.source_url)
        if frame is not None:
            return frame
    src = open_source(cam.source_type, cam.source_url, cam.webcam_index)
    if src is None:
        return None
    try:
        for _ in range(tries):
            frame = src.read()
            if frame is not None:
                return frame
            time.sleep(0.2)
        return None
    finally:
        src.release()


async def _auto_bay_regions(db: AsyncSession, cam: Camera,
                            cols: int, rows: int):
    """Detect REAL parking bays from painted markings; fall back to a grid.

    Returns (regions, mode) with mode 'bays' (per-bay polygons, LotVulture-style)
    or 'grid' (coarse approximate cells when no overhead markings are found).
    """
    frame = await asyncio.to_thread(_first_frame, cam)
    polys = detect_bays(frame) if frame is not None else []
    if polys:
        made = []
        for i, poly in enumerate(polys, 1):
            reg = CameraRegion(camera_id=cam.id, spot_id=None,
                               label=f"bay-{i}", polygon=json.dumps(poly),
                               status="unknown",
                               occupy_threshold=AUTO_OCCUPY_THRESHOLD,
                               free_threshold=AUTO_FREE_THRESHOLD)
            db.add(reg)
            made.append(reg)
        await db.commit()
        for reg in made:
            await db.refresh(reg)
        logger.info("camera %s: auto-detected %d parking bays", cam.id, len(made))
        return made, "bays"
    logger.info("camera %s: no overhead bay markings found; using coarse grid",
                cam.id)
    made = await _create_grid_regions(db, cam.id, cols, rows)
    return made, "grid"


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
# upload from the operator's computer + zero-effort auto-regions
# ---------------------------------------------------------------------------
@router.post("/upload", response_model=CameraOut, status_code=201)
async def upload_media(file: UploadFile = File(...),
                       name: str = Form(None),
                       auto_regions: bool = Form(True),
                       autostart: bool = Form(True),
                       cols: int = Form(4),
                       rows: int = Form(3),
                       db: AsyncSession = Depends(get_db)):
    """Store an uploaded image/video and wire it into the vision pipeline.

    Images become a `snapshot` source (re-read on an interval); videos become a
    looped `file` source. With auto_regions on, the REAL painted parking bays are
    detected and turned into per-bay regions (coarse grid only as a fallback) so
    occupancy is produced immediately without any manual drawing.
    """
    filename = os.path.basename(file.filename or "upload")
    ext = os.path.splitext(filename)[1].lower()
    if ext not in IMAGE_EXTS and ext not in VIDEO_EXTS:
        raise HTTPException(
            status_code=400,
            detail=(f"Unsupported file type '{ext or 'unknown'}'. Upload an image "
                    f"({', '.join(sorted(IMAGE_EXTS))}) or a video "
                    f"({', '.join(sorted(VIDEO_EXTS))})."))

    dest = os.path.join(_upload_dir(), f"{uuid.uuid4().hex}{ext}")
    size = 0
    try:
        with open(dest, "wb") as out:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large (max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB)")
                out.write(chunk)
    except HTTPException:
        if os.path.exists(dest):
            os.remove(dest)
        raise
    except OSError as e:
        if os.path.exists(dest):
            os.remove(dest)
        raise HTTPException(status_code=500, detail=f"Could not store upload: {e}")

    if size == 0:
        if os.path.exists(dest):
            os.remove(dest)
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    is_image = ext in IMAGE_EXTS
    cam = Camera(
        name=(name or filename)[:200],
        source_type="snapshot" if is_image else "file",
        source_url=dest,
        status="offline",
        fps_target=2.0 if is_image else 5.0,
    )
    db.add(cam)
    await db.commit()
    await db.refresh(cam)

    if auto_regions:
        await _auto_bay_regions(db, cam, cols, rows)
        await db.refresh(cam)
    if autostart and registry.ready:
        registry.start(cam.id)
    logger.info("vision upload: camera %s (%s) <- %s [%d bytes]",
                cam.id, cam.source_type, filename, size)
    return _camera_out(cam)


@router.post("/cameras/{camera_id}/auto-regions", response_model=List[RegionOut])
async def auto_regions(camera_id: int, cols: int = 4, rows: int = 3,
                       replace: bool = True, mode: str = "bays",
                       db: AsyncSession = Depends(get_db)):
    """Auto-create detection regions with no manual drawing.

    mode='bays' (default): detect the REAL painted parking bays from a frame and
    create one region per bay (LotVulture-style per-space detection). Falls back
    to a coarse grid when no overhead markings are found.
    mode='grid': force the coarse uniform grid (approximate; only useful for
    views without clean overhead bay markings).
    """
    cam = await db.get(Camera, camera_id)
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    if replace:
        for r in list(cam.regions):
            await db.delete(r)
        await db.commit()
    if mode == "grid":
        regions = await _create_grid_regions(db, camera_id, cols, rows)
    else:
        regions, _ = await _auto_bay_regions(db, cam, cols, rows)
    return [_region_out(r) for r in regions]


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


@router.get("/cameras/{camera_id}/source")
async def camera_source(camera_id: int, db: AsyncSession = Depends(get_db)):
    """Serve the ORIGINAL uploaded media (un-annotated) for snapshot/file sources.

    The snapshot/stream endpoints return the ANALYSED frame with overlays; this
    returns the clean source so the console can preview it and tooling can
    inspect exactly what was uploaded.  Live sources (rtsp/webcam) have no
    stored original and return 404.
    """
    cam = await db.get(Camera, camera_id)
    if cam is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    if cam.source_type not in ("snapshot", "file") or not cam.source_url:
        raise HTTPException(status_code=404, detail="No stored source for this camera")
    if not os.path.exists(cam.source_url):
        raise HTTPException(status_code=404, detail="Source file no longer on server")
    ext = os.path.splitext(cam.source_url)[1].lower()
    media = {
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".webp": "image/webp", ".bmp": "image/bmp",
        ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm",
        ".avi": "video/x-msvideo", ".mkv": "video/x-matroska", ".m4v": "video/mp4",
    }.get(ext, "application/octet-stream")
    return FileResponse(cam.source_url, media_type=media)


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

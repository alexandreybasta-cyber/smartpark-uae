"""Vision worker: runs one analysis loop per active camera.

Each camera gets an asyncio task.  Frame capture and analysis are blocking
(cv2 + numpy) so they run in a thread executor; DB writes and WebSocket
broadcasts stay on the event loop.

On every analysed frame the worker:
  * computes per-region confidence via vision.analyzer.CameraAnalyzer
  * applies dual-threshold hysteresis to get free / occupied
  * when a region's state CHANGES and it is bound to a Spot, writes the new
    status to that Spot (marking detection_source='camera'), records a
    DetectionEvent, and broadcasts the same `spot_update` message the
    simulator uses so the existing map/UI update with zero changes
  * keeps the latest annotated JPEG for the snapshot and MJPEG endpoints

The background simulator skips any Spot whose detection_source is 'camera' or
'ingest', so the two never fight over Spot.status.
"""
import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Dict, Optional

import cv2
from sqlalchemy import select

from database import async_session
from models import Camera, CameraRegion, DetectionEvent, Spot
from vision.analyzer import CameraAnalyzer, otsu_threshold, parse_polygon
from vision.detector import (available as yolo_available, detect_vehicles,
                             draw_vehicles, vehicle_in_region)
from vision.sources import open_source

logger = logging.getLogger(__name__)

# Consecutive empty reads before we reconnect the source.
MAX_EMPTY_READS = 30

# Seconds to wait before retrying a camera that failed to open.
RECONNECT_DELAY = 5.0


class CameraRunner:
    """Analysis loop for a single camera."""

    def __init__(self, camera_id: int, broadcast_fn):
        self.camera_id = camera_id
        self.broadcast_fn = broadcast_fn
        self.analyzer = CameraAnalyzer()
        self._task: Optional[asyncio.Task] = None
        self._stop = asyncio.Event()
        self._recalibrate = False
        self.latest_jpeg: Optional[bytes] = None
        self.latest_at: float = 0.0
        self.latest_statuses: Dict[int, dict] = {}
        self.latest_detections: list = []

    # -- lifecycle ---------------------------------------------------------
    def start(self):
        if self._task is None or self._task.done():
            self._stop.clear()
            self._task = asyncio.create_task(self._run(),
                                             name=f"vision-cam-{self.camera_id}")

    async def stop(self):
        self._stop.set()
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    def request_recalibrate(self):
        """Ask the loop to pin the next frame as the empty-lot reference."""
        self._recalibrate = True

    # -- main loop ---------------------------------------------------------
    async def _run(self):
        source = None
        empty_reads = 0
        try:
            while not self._stop.is_set():
                cam = await self._load_camera()
                if cam is None:
                    return  # camera deleted

                if source is None:
                    await self._set_camera_status("connecting", None)
                    source = await asyncio.to_thread(
                        open_source, cam.source_type, cam.source_url,
                        cam.webcam_index)
                    if source is None:
                        await self._set_camera_status("error",
                                                      "could not open video source")
                        await asyncio.sleep(RECONNECT_DELAY)
                        continue
                    await self._set_camera_status("online", None, source)
                    empty_reads = 0

                frame = await asyncio.to_thread(source.read)
                if frame is None:
                    empty_reads += 1
                    if empty_reads >= MAX_EMPTY_READS:
                        await asyncio.to_thread(source.release)
                        source = None
                    await asyncio.sleep(0.2)
                    continue
                empty_reads = 0

                regions = await self._load_regions()
                if not regions:
                    await self._touch_camera(frame)
                    await asyncio.sleep(1.0 / max(0.1, cam.fps_target))
                    continue

                region_dicts = [{"id": r.id, "label": r.label,
                                 "polygon": parse_polygon(r.polygon)} for r in regions]

                if self._recalibrate:
                    await asyncio.to_thread(self.analyzer.capture_reference,
                                              frame, region_dicts)
                    self._recalibrate = False
                    logger.info("camera %s: empty reference pinned", self.camera_id)

                results = await asyncio.to_thread(self.analyzer.process,
                                                  frame, region_dicts)

                # YOLO vehicle detection.  When the trained detector sees
                # vehicles (ground/indoor views) it drives occupancy by
                # car-in-bay, which is far more robust than appearance cues.
                # When it sees none (overhead/aerial, where COCO-YOLO is blind)
                # we keep the classical appearance confidence.
                detections = await asyncio.to_thread(detect_vehicles, frame)
                self.latest_detections = detections or []
                if detections:
                    fh, fw = frame.shape[:2]
                    by_id = {r["id"]: r for r in region_dicts}
                    for res in results:
                        rd = by_id.get(res["id"])
                        if rd is None:
                            continue
                        occupied = any(vehicle_in_region(d, rd["polygon"], fw, fh)
                                       for d in detections)
                        res["confidence"] = 0.95 if occupied else 0.05
                else:
                    confs = [r["confidence"] for r in results]
                    if len(confs) >= 4:
                        thr = otsu_threshold(confs)
                        for res in results:
                            res["confidence"] = 0.9 if res["confidence"] > thr else 0.1

                await self._apply_results(regions, results)

                statuses = {r.id: {"status": r.status, "confidence": r.confidence}
                            for r in regions}
                self.latest_statuses = statuses
                self.latest_jpeg = await asyncio.to_thread(
                    self._encode_annotated, frame, region_dicts, statuses)
                self.latest_at = time.time()

                await self._touch_camera(frame)
                await asyncio.sleep(1.0 / max(0.1, cam.fps_target))
        except asyncio.CancelledError:
            raise
        except Exception as e:  # noqa: BLE001
            logger.exception("vision worker for camera %s crashed: %s",
                             self.camera_id, e)
            await self._set_camera_status("error", str(e))
        finally:
            if source is not None:
                await asyncio.to_thread(source.release)
            await self._set_camera_status("offline", None)

    def _encode_annotated(self, frame, region_dicts, statuses) -> Optional[bytes]:
        ann = self.analyzer.annotate(frame, region_dicts, statuses)
        ann = draw_vehicles(ann, self.latest_detections)
        ok, buf = cv2.imencode(".jpg", ann, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return buf.tobytes() if ok else None

    # -- DB helpers --------------------------------------------------------
    async def _load_camera(self) -> Optional[Camera]:
        async with async_session() as s:
            return await s.get(Camera, self.camera_id)

    async def _load_regions(self):
        async with async_session() as s:
            res = await s.execute(
                select(CameraRegion).where(CameraRegion.camera_id == self.camera_id))
            return list(res.scalars().all())

    async def _set_camera_status(self, status, error=None, source=None):
        async with async_session() as s:
            cam = await s.get(Camera, self.camera_id)
            if cam is None:
                return
            cam.status = status
            cam.error_message = error
            if source is not None and source.frame_size:
                cam.width, cam.height = source.frame_size
            await s.commit()

    async def _touch_camera(self, frame):
        async with async_session() as s:
            cam = await s.get(Camera, self.camera_id)
            if cam is None:
                return
            cam.last_frame_at = datetime.now(timezone.utc)
            cam.frames_analysed = (cam.frames_analysed or 0) + 1
            if cam.width is None:
                h, w = frame.shape[:2]
                cam.width, cam.height = w, h
            await s.commit()

    async def _apply_results(self, regions, results):
        """Hysteresis -> region state -> spot state -> event -> broadcast."""
        by_id = {r.id: r for r in regions}
        now = datetime.now(timezone.utc)

        # Decide new states in memory first.
        transitions = []   # (region_id, prev, new)
        confidences = {}   # region_id -> confidence
        for res in results:
            region = by_id.get(res["id"])
            if region is None:
                continue
            confidences[res["id"]] = res["confidence"]
            new_status = self.analyzer.trackers[res["id"]].update_status(
                region.status, res["confidence"],
                region.occupy_threshold, region.free_threshold)
            if new_status != region.status and new_status in ("free", "occupied"):
                transitions.append((region.id, region.status, new_status))
                region.status = new_status  # keep in-memory copy current
            region.confidence = res["confidence"]
            region.last_updated_at = now

        async with async_session() as s:
            events = []
            broadcast_spots = []

            # Persist confidence + timestamp for every region.
            for rid, conf in confidences.items():
                db_region = await s.get(CameraRegion, rid)
                if db_region is None:
                    continue
                db_region.confidence = conf
                db_region.last_updated_at = now

            # Apply state transitions to regions, their spots, and audit log.
            for rid, prev, new_status in transitions:
                db_region = await s.get(CameraRegion, rid)
                if db_region is None:
                    continue
                db_region.status = new_status

                if db_region.spot_id:
                    spot = await s.get(Spot, db_region.spot_id)
                    if spot is not None:
                        spot.status = new_status
                        spot.last_changed_at = now
                        spot.occupied_since = now if new_status == "occupied" else None
                        spot.detection_source = "camera"
                        broadcast_spots.append({
                            "id": spot.id,
                            "status": new_status,
                            "last_changed_at": now.isoformat(),
                            "detection_source": "camera",
                        })
                events.append(DetectionEvent(
                    camera_id=self.camera_id,
                    region_id=rid,
                    spot_id=db_region.spot_id,
                    previous_status=prev,
                    new_status=new_status,
                    confidence=confidences.get(rid, 0.0),
                    source="vision",
                ))

            if events:
                s.add_all(events)
            await s.commit()

            if broadcast_spots and self.broadcast_fn:
                await self.broadcast_fn({"type": "spot_update",
                                         "spots": broadcast_spots})


class VisionRegistry:
    """Holds the live CameraRunner for every started camera."""

    def __init__(self, broadcast_fn):
        self.broadcast_fn = broadcast_fn
        self.runners: Dict[int, CameraRunner] = {}

    @property
    def ready(self) -> bool:
        return self.broadcast_fn is not None

    def get(self, camera_id: int) -> CameraRunner:
        if camera_id not in self.runners:
            self.runners[camera_id] = CameraRunner(camera_id, self.broadcast_fn)
        return self.runners[camera_id]

    def start(self, camera_id: int) -> CameraRunner:
        runner = self.get(camera_id)
        runner.start()
        return runner

    async def stop(self, camera_id: int):
        runner = self.runners.pop(camera_id, None)
        if runner:
            await runner.stop()

    async def stop_all(self):
        for cid in list(self.runners):
            await self.stop(cid)

    def snapshot(self, camera_id: int):
        runner = self.runners.get(camera_id)
        if runner is None or runner.latest_jpeg is None:
            return None
        return runner.latest_jpeg, runner.latest_at


# Singleton created at import time so modules that do
# `from vision.worker import registry` hold a live reference; the lifespan
# fills in broadcast_fn via init_registry().  (Rebinding a module global would
# leave those importers stuck with None.)
registry = VisionRegistry(None)


def init_registry(broadcast_fn) -> VisionRegistry:
    registry.broadcast_fn = broadcast_fn
    return registry

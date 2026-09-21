"""Frame sources for the camera-vision occupancy pipeline.

Every source exposes the same tiny interface so the analyzer never cares
whether pixels come from an IP camera (RTSP), a recorded file, a local
webcam, or a periodically re-read snapshot image:

    source.open()          -> bool   (True if the source is usable)
    source.read()          -> ndarray | None   (BGR frame, or None if none yet)
    source.release()       -> None
    source.describe()      -> str    (human-readable origin, for logs/UI)
"""
import logging
import os
import time
import urllib.request

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class FrameSource:
    """Base class. Subclasses implement _open/_read/_release."""

    def __init__(self):
        self._cap = None

    def open(self) -> bool:
        try:
            return self._open()
        except Exception as e:  # noqa: BLE001 - source errors must not kill worker
            logger.error("source open failed: %s", e)
            return False

    def read(self):
        try:
            return self._read()
        except Exception as e:  # noqa: BLE001
            logger.error("source read failed: %s", e)
            return None

    def release(self):
        try:
            self._release()
        except Exception:  # noqa: BLE001
            pass

    @property
    def frame_size(self):
        """(width, height) of the source, or None if unknown."""
        if self._cap is None:
            return None
        w = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        h = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        return (w, h) if w and h else None

    # -- to override --
    def _open(self) -> bool:
        raise NotImplementedError

    def _read(self):
        raise NotImplementedError

    def _release(self):
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def describe(self) -> str:
        return self.__class__.__name__


class RTSPSource(FrameSource):
    """Standard IP security camera over RTSP (what LotVulture consumes too)."""

    def __init__(self, url: str):
        super().__init__()
        self.url = url

    def _open(self) -> bool:
        # Prefer FFmpeg; keep a small buffer so we always analyse fresh frames.
        self._cap = cv2.VideoCapture(self.url, cv2.CAP_FFMPEG)
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        if not self._cap.isOpened():
            self._cap.release()
            self._cap = cv2.VideoCapture(self.url)  # let OpenCV pick a backend
        ok = self._cap.isOpened()
        if not ok:
            self._cap = None
        return ok

    def _read(self):
        if self._cap is None:
            return None
        ok, frame = self._cap.read()
        return frame if ok else None

    def describe(self) -> str:
        return f"rtsp {self.url}"


class FileSource(FrameSource):
    """A recorded video file, looped forever (used for demos and testing)."""

    def __init__(self, path: str, loop: bool = True):
        super().__init__()
        self.path = path
        self.loop = loop

    def _open(self) -> bool:
        if not os.path.exists(self.path):
            logger.error("video file not found: %s", self.path)
            return False
        self._cap = cv2.VideoCapture(self.path)
        ok = self._cap.isOpened()
        if not ok:
            self._cap = None
        return ok

    def _read(self):
        if self._cap is None:
            return None
        ok, frame = self._cap.read()
        if not ok and self.loop:
            self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ok, frame = self._cap.read()
        return frame if ok else None

    def describe(self) -> str:
        return f"file {os.path.basename(self.path)}"


class WebcamSource(FrameSource):
    """A local capture device (built-in FaceTime camera, USB cam, phone cam)."""

    def __init__(self, index: int = 0):
        super().__init__()
        self.index = index

    def _open(self) -> bool:
        # AVFoundation on macOS; needs Camera permission granted to the
        # terminal/app running the backend, otherwise isOpened() is False.
        self._cap = cv2.VideoCapture(self.index, cv2.CAP_AVFOUNDATION)
        if not self._cap.isOpened():
            self._cap.release()
            self._cap = cv2.VideoCapture(self.index)
        ok = self._cap.isOpened()
        if not ok:
            self._cap = None
        return ok

    def _read(self):
        if self._cap is None:
            return None
        ok, frame = self._cap.read()
        return frame if ok else None

    def describe(self) -> str:
        return f"webcam #{self.index}"


class SnapshotSource(FrameSource):
    """A still image (local path or http(s) URL) re-read on an interval.

    Some sites only expose a JPEG snapshot URL rather than a stream; polling
    it is enough for occupancy because spaces change on a minutes timescale.
    """

    def __init__(self, url: str, interval_s: float = 5.0):
        super().__init__()
        self.url = url
        self.interval_s = interval_s
        self._last_fetch = 0.0
        self._last_frame = None

    def _fetch(self):
        if self.url.startswith(("http://", "https://")):
            req = urllib.request.Request(self.url, headers={"User-Agent": "SpotSense-Vision/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                buf = np.frombuffer(resp.read(), np.uint8)
            frame = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        else:
            frame = cv2.imread(self.url)
        return frame

    def _open(self) -> bool:
        frame = self._fetch()
        if frame is None:
            return False
        self._last_frame = frame
        self._last_fetch = time.time()
        return True

    def _read(self):
        if time.time() - self._last_fetch >= self.interval_s:
            try:
                frame = self._fetch()
                if frame is not None:
                    self._last_frame = frame
                    self._last_fetch = time.time()
            except Exception as e:  # noqa: BLE001 - keep serving last good frame
                logger.warning("snapshot refresh failed (%s); reusing last frame", e)
        return self._last_frame

    @property
    def frame_size(self):
        if self._last_frame is None:
            return None
        h, w = self._last_frame.shape[:2]
        return (w, h)

    def describe(self) -> str:
        return f"snapshot {self.url}"


def build_source(source_type: str, source_url=None, webcam_index=None) -> FrameSource:
    """Factory used by the vision worker and the API."""
    st = (source_type or "rtsp").lower()
    if st == "file":
        return FileSource(source_url or "")
    if st == "webcam":
        return WebcamSource(int(webcam_index or 0))
    if st == "snapshot":
        return SnapshotSource(source_url or "")
    return RTSPSource(source_url or "")


def open_source(source_type: str, source_url=None, webcam_index=None):
    """Build a source and open it; returns the source or None on failure."""
    src = build_source(source_type, source_url, webcam_index)
    if src.open():
        return src
    src.release()
    return None

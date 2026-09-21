"""Occupancy detection engine (classical computer vision, no deep learning).

Occupancy is decided from APPEARANCE, not from motion, which is what makes it
correct for cars that have been parked for hours (a motion/background model
absorbs a long-parked car into its background and then cannot see it).

For every drawn bay polygon we measure two appearance cues and compare each
to an "empty asphalt" reference:

1.  STRUCTURE cue (vehicle-scale edge density).
    A vehicle is a large rigid object: its silhouette, windows and highlights
    form big connected edge structures.  Bare asphalt is smooth.  We run Canny,
    dilate to connect contours, then keep only connected components whose
    convex hull ENCLOSES a vehicle-sized fraction of the bay.  That fill test
    discards small moving highlights (bay lamps, headlight glare, rain
    sparkle, passing shadows): their outlines are bright but enclose almost
    nothing.  This is the main false-positive source on night footage.

2.  COLOUR cue (chroma distance).
    The median Lab chroma (a,b only, so it is illumination-invariant) inside
    the bay, compared to the empty-asphalt chroma.  Using the region MEDIAN
    means a small bright lamp inside a bay does not move it.  Catches coloured
    vehicles even on very smooth asphalt.

Empty-asphalt reference is self-calibrating: the bay with the least
vehicle-scale structure in the same frame is taken as the empty exemplar
(most spaces are free at any moment, and using the minimum keeps the
reference valid even when half the lot is full).  An operator can pin an
explicit empty reference frame (recalibrate) for lots that are entirely full,
which then replaces the exemplar.

confidence = max(structure, colour), each normalised to 0..1, passed through
an EMA smoother, then dual-threshold hysteresis with a debounce counter:
flip to occupied only after smoothed confidence stays above occupy_threshold
for DEBOUNCE_FRAMES consecutive frames, and to free only after it stays below
free_threshold.  Between the thresholds the state holds.  This is what stops
flicker from flapping spot state.
"""
import json
import logging
from collections import deque
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Edge-density ratio (vs empty asphalt) that maps to structure confidence 1.
EDGE_RATIO_FULL = 4.0

# Chroma (Lab a,b) distance from empty asphalt mapping to confidence 0 and 1.
CHROMA_D0 = 10.0
CHROMA_D1 = 30.0

# Analysis resolution: downscale every frame to at most this width.
MAX_ANALYSIS_WIDTH = 640

# Canny hysteresis for the structure cue.
CANNY_LOW, CANNY_HIGH = 60, 140

# An edge component must ENCLOSE at least this fraction of its bay (convex
# hull area) to count as part of a vehicle.  A car silhouette encloses a
# car-sized area; a bay lamp, glare spot or passing shadow encloses almost
# nothing even though its outline may be bright.  This is the discriminator
# that rejects small moving highlights on night footage.
MIN_FILL_FRACTION = 0.20

# Minimum number of regions before the self-calibrating ensemble is usable.
MIN_REGIONS_FOR_ENSEMBLE = 3

# Number of recent raw confidences the smoother keeps.  A MEDIAN over this
# window (rather than an exponential average) makes the detector tolerant of
# frames where the vehicle's edges momentarily vanish, which happens on
# low-bitrate / inter-frame-compressed streams (P-frames, packet loss).
SMOOTH_WINDOW = 5

# Consecutive frames beyond a threshold before state flips.
DEBOUNCE_FRAMES = 4


class RegionTracker:
    """Per-region median-smoothed confidence + debounce counters."""

    def __init__(self):
        self._window: deque = deque(maxlen=SMOOTH_WINDOW)
        self._above = 0
        self._below = 0

    def smooth(self, raw: float) -> float:
        """Median over the recent window: tolerant of dropped/garbled frames."""
        self._window.append(raw)
        return float(np.median(list(self._window)))

    def reset(self):
        self._window.clear()
        self._above = 0
        self._below = 0

    def update_status(self, current: str, confidence: float,
                      occupy_threshold: float, free_threshold: float) -> str:
        """Dual-threshold hysteresis with a debounce counter."""
        if confidence >= occupy_threshold:
            self._above += 1
            self._below = 0
        elif confidence <= free_threshold:
            self._below += 1
            self._above = 0
        else:
            self._above = 0
            self._below = 0

        if self._above >= DEBOUNCE_FRAMES:
            self._above = 0
            return "occupied"
        if self._below >= DEBOUNCE_FRAMES:
            self._below = 0
            return "free"
        return current


def _to_small(frame: np.ndarray) -> np.ndarray:
    h, w = frame.shape[:2]
    if w > MAX_ANALYSIS_WIDTH:
        scale = MAX_ANALYSIS_WIDTH / float(w)
        frame = cv2.resize(frame, (MAX_ANALYSIS_WIDTH, max(1, int(h * scale))),
                           interpolation=cv2.INTER_AREA)
    return frame


def polygon_to_px(polygon: List[List[float]], width: int, height: int) -> np.ndarray:
    """Normalised 0..1 polygon -> integer pixel points for this frame size."""
    pts = []
    for x, y in polygon:
        px = int(round(float(x) * (width - 1)))
        py = int(round(float(y) * (height - 1)))
        pts.append([max(0, min(width - 1, px)), max(0, min(height - 1, py))])
    return np.array(pts, dtype=np.int32)


def _region_mask(shape: Tuple[int, int], poly_px: np.ndarray) -> np.ndarray:
    mask = np.zeros(shape, np.uint8)
    cv2.fillPoly(mask, [poly_px], 255)
    return mask


def structure_edges(gray: np.ndarray) -> np.ndarray:
    """Canny edges, dilated so a vehicle's contours form connected blobs."""
    edges = cv2.Canny(gray, CANNY_LOW, CANNY_HIGH)
    return cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)


def _vehicle_scale_edges(binary: np.ndarray, region_area: int) -> np.ndarray:
    """Keep only edge components that enclose a vehicle-sized area.

    A car's outline, windows and highlights form connected edge structures
    whose convex hull covers a large part of the bay.  A lamp, glare spot or
    shadow has a bright outline but encloses almost nothing, so its convex
    hull area is tiny and it is discarded.
    """
    if region_area <= 0:
        return binary
    min_fill = MIN_FILL_FRACTION * region_area
    n, labels, stats, _ = cv2.connectedComponentsWithStats(binary, 8)
    out = np.zeros_like(binary)
    for i in range(1, n):
        ys, xs = np.nonzero(labels == i)
        if len(xs) < 4:
            continue
        pts = np.column_stack((xs, ys)).astype(np.int32).reshape(-1, 1, 2)
        hull = cv2.convexHull(pts)
        if cv2.contourArea(hull) >= min_fill:
            out[labels == i] = 255
    return out


class CameraAnalyzer:
    """Stateful per-camera analyzer: one tracker per region + reference."""

    def __init__(self):
        self.trackers: Dict[int, RegionTracker] = {}
        self.frame_shape: Optional[Tuple[int, int]] = None  # (w, h) at analysis res
        # Optional pinned empty-reference measurements, set by recalibrate():
        # region_id -> {"edge": float, "chroma": ndarray(2)}
        self.reference: Optional[Dict[int, dict]] = None

    def reset(self):
        self.trackers.clear()
        self.reference = None

    def _tracker(self, region_id: int) -> RegionTracker:
        if region_id not in self.trackers:
            self.trackers[region_id] = RegionTracker()
        return self.trackers[region_id]

    # -- reference frame ---------------------------------------------------
    def capture_reference(self, frame: np.ndarray, regions: List[dict]):
        """Pin the current frame as the 'empty lot' appearance baseline."""
        gray = cv2.cvtColor(_to_small(frame), cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        lab = cv2.cvtColor(_to_small(frame), cv2.COLOR_BGR2LAB).astype(np.float32)
        edges = structure_edges(gray)
        h, w = gray.shape
        ref = {}
        for r in regions:
            poly_px = polygon_to_px(r["polygon"], w, h)
            region = _region_mask((h, w), poly_px)
            area = cv2.countNonZero(region)
            e_in = _vehicle_scale_edges(cv2.bitwise_and(edges, region), area)
            pts = lab[region > 0]
            ref[r["id"]] = {
                "edge": cv2.countNonZero(e_in) / float(area) if area else 0.0,
                "chroma": np.median(pts, axis=0)[1:] if len(pts) else np.zeros(2, np.float32),
                "L": float(np.median(pts[:, 0])) if len(pts) else 0.0,
            }
        self.reference = ref
        for t in self.trackers.values():
            t.reset()

    # -- per-frame analysis ------------------------------------------------
    def process(self, frame: np.ndarray, regions: List[dict]) -> List[dict]:
        """Analyse one frame.

        regions: list of dicts with keys id, polygon (normalised), label.
        Returns one dict per region:
            id, edge_density, chroma_dist, structure, colour, raw, confidence
        """
        small = _to_small(frame)
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
        lab = cv2.cvtColor(small, cv2.COLOR_BGR2LAB).astype(np.float32)
        edges = structure_edges(gray)
        h, w = gray.shape
        self.frame_shape = (w, h)

        measured = []
        for r in regions:
            poly_px = polygon_to_px(r["polygon"], w, h)
            region = _region_mask((h, w), poly_px)
            area = cv2.countNonZero(region)
            e_in = _vehicle_scale_edges(cv2.bitwise_and(edges, region), area)
            edge_density = cv2.countNonZero(e_in) / float(area) if area else 0.0
            pts = lab[region > 0]
            chroma = np.median(pts, axis=0)[1:] if len(pts) else np.zeros(2, np.float32)
            light = float(np.median(pts[:, 0])) if len(pts) else 0.0
            measured.append({"r": r, "edge": edge_density, "chroma": chroma,
                             "L": light})

        # Empty-asphalt reference: pinned, or self-calibrating empty exemplar.
        # The exemplar is the bay with the least vehicle-scale structure, i.e.
        # the cleanest empty space in this frame.  Using the MINIMUM (not the
        # median) keeps the reference correct even when half the lot is full;
        # a median would be dragged up to the occupied level and make every
        # bay look empty.  For lots that are entirely full, pin an explicit
        # empty reference frame with recalibrate().
        if self.reference is not None:
            def ref_for(rid):
                return self.reference.get(rid, {"edge": 0.0,
                                                "chroma": np.zeros(2, np.float32)})
        elif len(measured) >= MIN_REGIONS_FOR_ENSEMBLE:
            exemplar = min(measured, key=lambda m: m["edge"])
            edge_ref = exemplar["edge"]
            chroma_ref = exemplar["chroma"]
            light_ref = exemplar["L"]
            def ref_for(rid):
                return {"edge": edge_ref, "chroma": chroma_ref, "L": light_ref}
        else:
            def ref_for(rid):
                return {"edge": 0.0, "chroma": np.zeros(2, np.float32)}

        results = []
        for m in measured:
            ref = ref_for(m["r"]["id"])

            # Structure cue: how many times more vehicle-scale edge structure
            # than empty asphalt.
            base_edge = max(ref["edge"], 1e-4)
            ratio = m["edge"] / base_edge
            structure = float(min(1.0, max(0.0, (ratio - 1.0) / (EDGE_RATIO_FULL - 1.0))))

            # Colour cue: illumination-invariant chroma distance.
            dist = float(np.linalg.norm(m["chroma"] - ref["chroma"]))
            # Shadow guard: a cast shadow is markedly DARKER than the empty
            # reference yet chroma-similar (chroma is illumination-invariant),
            # whereas a vehicle changes chroma and/or is not darker.  Suppress
            # the structure cue so shadow outlines don't read as occupied.
            refL = ref.get("L")
            if refL is not None and (refL - m["L"]) > 25 and dist < CHROMA_D0:
                structure *= 0.25
            colour = float(min(1.0, max(0.0, (dist - CHROMA_D0) / (CHROMA_D1 - CHROMA_D0))))

            raw = float(max(structure, colour))
            tracker = self._tracker(m["r"]["id"])
            results.append({
                "id": m["r"]["id"],
                "edge_density": m["edge"],
                "chroma_dist": dist,
                "structure": structure,
                "colour": colour,
                "raw": raw,
                "confidence": tracker.smooth(raw),
            })
        return results

    # -- visualisation -----------------------------------------------------
    def annotate(self, frame: np.ndarray, regions: List[dict],
                 statuses: Dict[int, dict]) -> np.ndarray:
        """Draw each region polygon coloured by live status + confidence."""
        out = frame.copy()
        h, w = out.shape[:2]
        for r in regions:
            st = statuses.get(r["id"], {})
            status = st.get("status", "unknown")
            conf = st.get("confidence", 0.0)
            color = {
                "free": (160, 229, 0),       # emerald in BGR
                "occupied": (68, 68, 239),   # red in BGR
                "unknown": (120, 120, 120),
            }.get(status, (120, 120, 120))
            poly_px = polygon_to_px(r["polygon"], w, h)
            overlay = out.copy()
            cv2.fillPoly(overlay, [poly_px], color)
            cv2.addWeighted(overlay, 0.28, out, 0.72, 0, out)
            cv2.polylines(out, [poly_px], True, color, 2)

            label = f"{r.get('label') or r['id']} {conf:.0%}"
            x, y = poly_px[0]
            cv2.putText(out, label, (int(x) + 4, int(y) + 16),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        return out


def parse_polygon(raw) -> List[List[float]]:
    """Accept either a JSON string (DB column) or an already-parsed list."""
    if isinstance(raw, str):
        return json.loads(raw)
    return raw

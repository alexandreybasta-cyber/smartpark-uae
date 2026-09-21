"""Parking-bay auto-detection from painted line markings (top-down / aerial).

This replaces the old uniform grid, which was NOT parking-spot detection: it
chopped the frame into arbitrary rectangles (over ceilings, trees, walls) so an
empty bay straddling a cell read "occupied" and a car inside a mostly-empty cell
read "free".  Real products (LotVulture, YOLO parking models) work per BAY.

How it works for an overhead view:
  1. A white top-hat isolates THIN bright paint.  Large bright blobs (white car
     roofs, sunlit pavement) and soft shadows are removed because top-hat only
     keeps structures smaller than the kernel; a shaded tick is still brighter
     than its shaded surround, so bays under tree shadow survive.
  2. A horizontal morphological open keeps only the long bay BACK-LINES (car
     top/bottom edges are too short to survive the long kernel).
  3. A vertical open keeps vertical strokes: the bay divider TICKS, plus
     distractors (car side edges, walls).
  4. For each back-line, keep only vertical strokes that TOUCH it (a divider
     tick starts at the back line; a car's side edge and a wall do not).
  5. Consecutive ticks along a back-line bound one bay; the bay quad spans from
     the back-line out to the ticks' far ends (the painted bay depth).

Returns normalised (0..1) quad polygons, ready to store as CameraRegion rows so
the existing appearance analyzer classifies each real bay occupied/free.

Perspective / indoor views do not have clean overhead markings; for those the
operator should draw bays (the LotVulture model) or use the coarse grid.
"""
import cv2
import numpy as np

# Detection runs at a fixed analysis width so the morphological kernels (which
# are absolute pixels) behave identically on a phone snapshot or a 4K frame.
ANALYSIS_WIDTH = 1000


def paint_mask(gray, thresh=30, ksize=11):
    """Thin bright paint only (white top-hat), shadow- and blob-invariant."""
    k = cv2.getStructuringElement(cv2.MORPH_RECT, (ksize, ksize))
    tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, k)
    _, m = cv2.threshold(tophat, thresh, 255, cv2.THRESH_BINARY)
    return cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))


def _comps(mask):
    n, _lab, stats, cent = cv2.connectedComponentsWithStats(mask, 8)
    return [dict(x=int(s[0]), y=int(s[1]), w=int(s[2]), h=int(s[3]),
                 area=int(s[4]), cx=float(cent[i][0]), cy=float(cent[i][1]))
            for i, s in enumerate(stats[1:], start=1)]


def _norm(quad, w, h):
    return [[max(0.0, min(1.0, x / w)), max(0.0, min(1.0, y / h))] for x, y in quad]


def detect_bays(frame, min_bay_px=22, touch_tol=6, max_bays=80):
    """Detect individual parking bays; returns list of normalised quad polygons."""
    if frame is None:
        return []
    h0, w0 = frame.shape[:2]
    if w0 > ANALYSIS_WIDTH:
        scale = ANALYSIS_WIDTH / float(w0)
        frame = cv2.resize(frame, (ANALYSIS_WIDTH, max(1, int(h0 * scale))),
                           interpolation=cv2.INTER_AREA)
    h, w = frame.shape[:2]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    mask = paint_mask(gray)

    horiz = cv2.morphologyEx(
        mask, cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (max(40, w // 12), 1)))
    vert = cv2.morphologyEx(
        mask, cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(20, h // 18))))

    back_lines = [c for c in _comps(horiz) if c["w"] > 0.25 * w]
    strokes = [c for c in _comps(vert)
               if c["h"] >= max(20, h // 18) and c["h"] <= 0.45 * h and c["w"] <= 10]

    bays = []
    for bl in back_lines:
        back_y = bl["cy"]
        x_lo, x_hi = bl["x"] - 4, bl["x"] + bl["w"] + 4
        ticks = []
        for s in strokes:
            if not (x_lo <= s["cx"] <= x_hi):
                continue
            near_end = min(abs(s["y"] - back_y), abs(s["y"] + s["h"] - back_y))
            if near_end > touch_tol:
                continue  # car side edge / wall: does not touch the back-line
            ticks.append(s)
        if len(ticks) < 2:
            continue
        ticks.sort(key=lambda s: s["cx"])
        offs = []
        for s in ticks:
            e0, e1 = s["y"], s["y"] + s["h"]
            far = e0 if abs(e0 - back_y) > abs(e1 - back_y) else e1
            offs.append(far - back_y)
        dirsign = 1 if sum(offs) >= 0 else -1
        depth = int(np.median([abs(o) for o in offs])) or (h // 4)
        for a, b in zip(ticks, ticks[1:]):
            xa, xb = a["cx"], b["cx"]
            if xb - xa < min_bay_px:
                continue
            y_far = back_y + dirsign * depth
            bays.append(_norm([[xa, back_y], [xb, back_y], [xb, y_far], [xa, y_far]],
                              w, h))
            if len(bays) >= max_bays:
                return bays
    return bays

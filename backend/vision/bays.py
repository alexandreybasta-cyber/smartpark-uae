"""Parking-bay auto-detection from painted line markings (overhead / aerial).

This replaces the old uniform grid, which was NOT parking-spot detection: it
chopped the frame into arbitrary rectangles (over ceilings, trees, walls) so an
empty bay straddling a cell read "occupied" and a car inside a mostly-empty cell
read "free".  Real products (LotVulture, YOLO parking models) work per BAY.

How it works:
  1. A white top-hat isolates THIN bright paint.  Large bright blobs (white car
     bodies/roofs, sunlit pavement) and soft shadows vanish because top-hat only
     keeps structures smaller than the kernel; a shaded tick is still brighter
     than its shaded surround, so bays under tree shadow survive.
  2. Morphological opens split the paint into horizontal and vertical strokes.
     Divider TICKS are short thin strokes; kerbs/walls/back-lines are long and
     are filtered out by length.
  3. Ticks of the dominant orientation are grouped into rows/columns by
     overlapping span (all dividers of one parking row share a span band).
  4. Within a row, consecutive ticks bound one bay; the bay quad spans the
     row's tick band between the two tick centre-lines.  No uniform grid and no
     assumption about where the lot sits in the frame.

Returns normalised (0..1) quad polygons, stored as CameraRegion rows so the
existing appearance analyzer classifies each REAL bay occupied/free.

Perspective / indoor views lack clean overhead markings; for those the operator
draws bays (the LotVulture model) or uses the coarse grid fallback.
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


def _group_by_span(ticks, span_of, center_of, overlap=0.45):
    """Cluster ticks whose [span] intervals overlap -> one row/column group."""
    groups = []
    for t in sorted(ticks, key=center_of):
        s0, s1 = span_of(t)
        placed = False
        for g in groups:
            g0, g1 = g["span"]
            inter = min(s1, g1) - max(s0, g0)
            if inter > overlap * min(s1 - s0, g1 - g0):
                g["ticks"].append(t)
                g["span"] = (min(g0, s0), max(g1, s1))
                placed = True
                break
        if not placed:
            groups.append({"span": (s0, s1), "ticks": [t]})
    return [g for g in groups if len(g["ticks"]) >= 2]


def _thin_strokes(comps, orient, img_dim, min_len, max_len, max_thick=14):
    out = []
    for c in comps:
        length = c["w"] if orient == "h" else c["h"]
        thick = c["h"] if orient == "h" else c["w"]
        if thick > max_thick:
            continue
        if length < min_len or length > max_len:
            continue
        out.append(c)
    return out


def _densify(centers, min_gap):
    """Recover dividers occluded by cars using the row's periodicity: any gap
    much larger than the median spacing is subdivided at the expected pitch."""
    if len(centers) < 2:
        return list(centers)
    gaps = [b - a for a, b in zip(centers, centers[1:])]
    med = sorted(gaps)[len(gaps) // 2]
    if med <= 0:
        return list(centers)
    out = [centers[0]]
    for a, b in zip(centers, centers[1:]):
        g = b - a
        n = int(round(g / med))
        if n > 1 and g > 1.6 * med:
            for k in range(1, n):
                out.append(a + g * k / n)
        out.append(b)
    return [c for c in out if c >= 0]


def _row_centers(ticks, keyfn, min_bay):
    """Densified divider centres for a plausible periodic row, else [].

    Real dividers are evenly pitched; car roof-strips appear only on occupied
    bays (irregular gaps) so they fail the uniformity test and are rejected.
    """
    centers = sorted(keyfn(t) for t in ticks)
    if len(centers) < 4:
        return []
    gaps = [b - a for a, b in zip(centers, centers[1:])]
    mean = float(np.mean(gaps))
    if mean <= 0 or (float(np.std(gaps)) / mean) > 0.6:
        return []
    return _densify(centers, min_bay)




def detect_bays(frame, min_bay_px=16, max_bays=80):
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
        cv2.getStructuringElement(cv2.MORPH_RECT, (max(24, w // 20), 1)))
    vert = cv2.morphologyEx(
        mask, cv2.MORPH_OPEN,
        cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(20, h // 20))))

    hcomps = _comps(horiz)
    vcomps = _comps(vert)

    def bays_at_floor(frac):
        ticks_h = _thin_strokes(hcomps, "h", w,
                                min_len=max(10, int(frac * w)), max_len=0.55 * w)
        ticks_v = _thin_strokes(vcomps, "v", h,
                                min_len=max(10, int(frac * h)), max_len=0.55 * h)
        out = []
        if len(ticks_v) >= len(ticks_h) and ticks_v:
            for g in _group_by_span(ticks_v, lambda c: (c["y"], c["y"] + c["h"]),
                                    lambda c: c["cx"]):
                y0, y1 = g["span"]
                centers = _row_centers(g["ticks"], lambda c: c["cx"], min_bay_px)
                for a, b in zip(centers, centers[1:]):
                    if b - a < min_bay_px:
                        continue
                    out.append(_norm([[a, y0], [b, y0], [b, y1], [a, y1]], w, h))
        elif ticks_h:
            for g in _group_by_span(ticks_h, lambda c: (c["x"], c["x"] + c["w"]),
                                    lambda c: c["cy"]):
                x0, x1 = g["span"]
                centers = _row_centers(g["ticks"], lambda c: c["cy"], min_bay_px)
                for a, b in zip(centers, centers[1:]):
                    if b - a < min_bay_px:
                        continue
                    out.append(_norm([[x0, a], [x1, a], [x1, b], [x0, b]], w, h))
        return out

    # Strict floors keep clean lots free of car roof-strip pollution; loose
    # floors recover dense lots whose painted dividers are small in-frame.
    for frac in (0.15, 0.06, 0.035):
        bays = bays_at_floor(frac)
        if len(bays) >= 3:
            return bays[:max_bays]
    # Angled / perspective views: reliable automatic bay segmentation is not
    # achievable with classical CV here (Hough dividers oscillate between
    # garbage quads and nothing).  Those views use YOLO car boxes plus
    # operator-drawn bays (or the row tool), which is accurate.
    return []

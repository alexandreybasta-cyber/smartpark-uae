"""Fine-tuned parking-bay detector (YOLO-OBB exported to ONNX).

Runs entirely on cv2.dnn like vision/detector.py (no torch/ultralytics on the
server).  The model is trained from the labelled dataset (see routers/vision.py
/dataset + /train endpoints and vision/train_bays.py) and outputs ORIENTED
boxes, which suit angled parking bays far better than axis-aligned boxes.

Ultralytics OBB ONNX output is (1, 4+nc+1, N): [cx, cy, w, h, cls..., angle]
in letterboxed 640x640 pixels, angle in radians.  We map back to the frame and
decode each rotated rect to a 4-corner normalised quad.
"""
import logging
import os
import threading

import cv2
import numpy as np

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "models", "bays.onnx")
INPUT_SIZE = 640
CONF_THRESHOLD = 0.25
NMS_THRESHOLD = 0.5

_net = None
_load_lock = threading.Lock()
_infer_lock = threading.Lock()


def present() -> bool:
    return os.path.exists(MODEL_PATH)


def reload():
    """Drop the cached net so a newly uploaded/trained ONNX is picked up."""
    global _net
    with _load_lock:
        _net = None


def _load_net():
    global _net
    with _load_lock:
        if _net is None and present():
            try:
                _net = cv2.dnn.readNetFromONNX(MODEL_PATH)
                _net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
                logger.info("bay OBB ONNX loaded from %s", MODEL_PATH)
            except cv2.error as e:  # noqa: BLE001
                logger.error("failed to load bay ONNX: %s", e)
                _net = False
    return _net or None


def _letterbox(frame):
    h, w = frame.shape[:2]
    scale = min(INPUT_SIZE / w, INPUT_SIZE / h)
    nw, nh = int(w * scale), int(h * scale)
    resized = cv2.resize(frame, (nw, nh), interpolation=cv2.INTER_LINEAR)
    canvas = np.full((INPUT_SIZE, INPUT_SIZE, 3), 114, np.uint8)
    dx, dy = (INPUT_SIZE - nw) // 2, (INPUT_SIZE - nh) // 2
    canvas[dy:dy + nh, dx:dx + nw] = resized
    return canvas, scale, dx, dy


def detect_bay_quads(frame, conf: float = CONF_THRESHOLD):
    """Return a list of normalised 4-corner quads [[x,y]x4] for detected bays."""
    net = _load_net()
    if net is None or frame is None:
        return []
    h, w = frame.shape[:2]
    canvas, scale, dx, dy = _letterbox(frame)
    blob = cv2.dnn.blobFromImage(canvas, 1 / 255.0, (INPUT_SIZE, INPUT_SIZE),
                                 swapRB=True, crop=False)
    try:
        with _infer_lock:
            net.setInput(blob)
            out = net.forward()
    except cv2.error as e:  # noqa: BLE001
        logger.error("bay ONNX forward failed: %s", e)
        return []
    arr = np.array(out)
    if arr.ndim == 3 and arr.shape[0] == 1:
        arr = arr[0]
    if arr.ndim != 2:
        return []
    if arr.shape[0] < arr.shape[1]:      # (C, N) -> (N, C)
        arr = arr.T
    if arr.shape[1] < 5:
        return []
    # columns: cx, cy, w, h, [cls...], angle
    ncls = arr.shape[1] - 5
    cx, cy, bw, bh = arr[:, 0], arr[:, 1], arr[:, 2], arr[:, 3]
    scores = arr[:, 4:4 + max(1, ncls)].max(axis=1) if ncls >= 1 else np.ones(len(arr))
    angle = arr[:, -1] if arr.shape[1] >= 6 else np.zeros(len(arr))
    keep_idx = np.where(scores >= conf)[0]
    if len(keep_idx) == 0:
        return []
    # axis-aligned enclosing rects for NMS (cv2.dnn has no rotated NMS)
    rects, quads = [], []
    for i in keep_idx:
        cxb, cyb = cx[i], cy[i]
        wbx, hbx = bw[i], bh[i]
        deg = float(np.degrees(angle[i]))
        box = cv2.boxPoints(((float(cxb), float(cyb)), (float(wbx), float(hbx)), deg))
        xs, ys = box[:, 0], box[:, 1]
        x0, x1 = float(xs.min()), float(xs.max())
        y0, y1 = float(ys.min()), float(ys.max())
        rects.append([x0, y0, x1 - x0, y1 - y0])
        # map letterbox px -> frame px -> normalised quad
        quad = []
        for px, py in box:
            fx = (px - dx) / scale
            fy = (py - dy) / scale
            quad.append([max(0.0, min(1.0, fx / w)), max(0.0, min(1.0, fy / h))])
        quads.append(quad)
    try:
        pick = cv2.dnn.NMSBoxes(rects, [float(scores[i]) for i in keep_idx],
                                float(conf), NMS_THRESHOLD)
        idxs = [int(k) for k in np.array(pick).reshape(-1)]
    except cv2.error:  # noqa: BLE001
        idxs = list(range(len(quads)))
    return [quads[k] for k in idxs]


def draw_quads(frame, quads, color=(34, 197, 94)):
    h, w = frame.shape[:2]
    for q in quads:
        pts = np.array([[int(x * w), int(y * h)] for x, y in q], np.int32)
        cv2.polylines(frame, [pts], True, color, 2)
    return frame

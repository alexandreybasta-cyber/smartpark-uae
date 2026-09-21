"""YOLO vehicle detection for occupancy (Ultralytics YOLO11n, run via OpenCV DNN).

The classical appearance analyzer (vision/analyzer.py) is hand-tuned CV and does
not generalise across lots/lighting.  A trained detector is the robust signal:
a bay is OCCUPIED when a vehicle is inside it, FREE when none is, on ANY camera
angle (overhead, angled, indoor).

We run the model through cv2.dnn (OpenCV is already a dependency) against a
committed ONNX export, so the production server needs NO extra packages and no
runtime model download.  YOLO11n was benchmarked against v8n and 26n on real
footage and gave the best recall + confidence floor at nano size.  Export with:

    yolo export model=yolo11n.pt format=onnx imgsz=640

COCO vehicle classes: 2=car, 3=motorcycle, 5=bus, 7=truck.
"""
import logging
import os
import threading

import cv2
import numpy as np

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "models", "yolo11n.onnx")
INPUT_SIZE = 640
CONF_THRESHOLD = 0.30
NMS_THRESHOLD = 0.45
VEHICLE_CLASSES = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}

_net = None
_lock = threading.Lock()
_infer_lock = threading.Lock()


def available() -> bool:
    return os.path.exists(MODEL_PATH)


def _load_net():
    global _net
    with _lock:
        if _net is None and available():
            try:
                _net = cv2.dnn.readNetFromONNX(MODEL_PATH)
                _net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
                logger.info("YOLO ONNX loaded from %s", MODEL_PATH)
            except cv2.error as e:  # noqa: BLE001
                logger.error("failed to load YOLO ONNX: %s", e)
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


def detect_vehicles(frame, conf: float = CONF_THRESHOLD):
    """Return [{'x0','y0','x1','y1','conf','cls','label'}] in frame pixels."""
    net = _load_net()
    if net is None or frame is None:
        return []
    h, w = frame.shape[:2]
    canvas, scale, dx, dy = _letterbox(frame)
    blob = cv2.dnn.blobFromImage(canvas, 1 / 255.0, (INPUT_SIZE, INPUT_SIZE),
                                 swapRB=True, crop=False)
    # cv2.dnn Net is not thread-safe for concurrent forward(); serialise and
    # degrade to no-detections on any dnn fault rather than crashing the worker.
    try:
        with _infer_lock:
            net.setInput(blob)
            out = net.forward()
    except cv2.error as e:  # noqa: BLE001
        logger.error("YOLO forward failed: %s", e)
        return []
    # YOLOv8 output: (1, 4+ncols, nboxes) -> transpose to (nboxes, 4+ncols)
    pred = out[0].T if out.shape[1] < out.shape[2] else out[0]

    boxes, scores, classes = [], [], []
    for row in pred:
        cx, cy, bw, bh = row[0], row[1], row[2], row[3]
        cls_scores = row[4:]
        cid = int(np.argmax(cls_scores))
        score = float(cls_scores[cid])
        if score < conf or cid not in VEHICLE_CLASSES:
            continue
        x0 = (cx - bw / 2 - dx) / scale
        y0 = (cy - bh / 2 - dy) / scale
        x1 = (cx + bw / 2 - dx) / scale
        y1 = (cy + bh / 2 - dy) / scale
        boxes.append([float(x0), float(y0), float(x1 - x0), float(y1 - y0)])
        scores.append(score)
        classes.append(cid)
    if not boxes:
        return []
    idx = cv2.dnn.NMSBoxes(boxes, scores, conf, NMS_THRESHOLD)
    keep = idx.flatten().tolist() if hasattr(idx, "flatten") else list(idx)
    results = []
    for i in keep:
        x0, y0, bw, bh = boxes[i]
        results.append({
            "x0": max(0.0, min(w, x0)), "y0": max(0.0, min(h, y0)),
            "x1": max(0.0, min(w, x0 + bw)), "y1": max(0.0, min(h, y0 + bh)),
            "conf": scores[i], "cls": classes[i],
            "label": VEHICLE_CLASSES[classes[i]],
        })
    return results


def vehicle_in_region(box, polygon_norm, width, height, min_overlap=0.20):
    """True if a vehicle box meaningfully overlaps a normalised region polygon."""
    pts = np.array([[int(round(x * (width - 1))), int(round(y * (height - 1)))]
                    for x, y in polygon_norm], np.int32)
    if len(pts) < 3:
        return False
    mask = np.zeros((height, width), np.uint8)
    cv2.fillPoly(mask, [pts], 255)
    bx0, by0 = int(box["x0"]), int(box["y0"])
    bx1, by1 = int(box["x1"]), int(box["y1"])
    if bx1 <= bx0 or by1 <= by0:
        return False
    box_area = float((bx1 - bx0) * (by1 - by0))
    sub = mask[max(0, by0):min(height, by1), max(0, bx0):min(width, bx1)]
    inter = float(cv2.countNonZero(sub))
    return (inter / box_area) >= min_overlap if box_area else False


def draw_vehicles(frame, detections):
    """Overlay YOLO vehicle boxes (orange) on the annotated frame."""
    for d in detections:
        p0 = (int(d["x0"]), int(d["y0"]))
        p1 = (int(d["x1"]), int(d["y1"]))
        cv2.rectangle(frame, p0, p1, (0, 140, 255), 2)
        cv2.putText(frame, f"{d['label']} {d['conf']:.0%}",
                    (p0[0], max(12, p0[1] - 5)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 140, 255), 1, cv2.LINE_AA)
    return frame

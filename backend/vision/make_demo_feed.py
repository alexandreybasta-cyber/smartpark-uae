"""Render a simulated overhead parking-camera feed for demos and testing.

Real security cameras are not always available during development, so this
generates a static-camera overhead lot video with a KNOWN occupancy schedule
(cars arrive and depart), a flickering bay lamp, sensor noise and slow
lighting drift.  It exercises exactly the path a real RTSP/file camera takes
(FileSource -> CameraAnalyzer) and ships with a regions+truth JSON so the
detector can be scored against ground truth:

    python -m vision.make_demo_feed
    python -m vision.selftest <out.mp4> vision/demo_feed_regions.json
"""
import json
import os

import cv2
import numpy as np

W, H, NB = 640, 360, 6
FPS = 12
TOTAL = 240

# (start_frame, end_frame) occupied; None end = rest of video; None start = never
SCHED = {0: (0, 90), 1: (60, None), 2: (0, None),
         3: (None, None), 4: (40, 160), 5: (140, None)}
CAR_COLORS = [(40, 40, 180), (200, 200, 205), (30, 30, 35),
              (60, 120, 200), (80, 80, 85), (180, 60, 40)]

OUT_VIDEO = os.path.join(os.path.dirname(__file__), "..", "..", "video",
                         "vision-demo-feed.mp4")
OUT_JSON = os.path.join(os.path.dirname(__file__), "demo_feed_regions.json")


def bay_rect(i):
    x0 = 60 + i * 90
    return (x0, 120, x0 + 70, 300)


def truth(b, f):
    s, e = SCHED[b]
    if s is None:
        return "free"
    e = e if e is not None else TOTAL
    return "occupied" if s <= f < e else "free"


def make_frame(f):
    rng = np.random.default_rng(1000 + f)
    base = np.full((H, W, 3), (95, 95, 100), np.uint8)
    base = np.clip(base.astype(int) + int(12 * np.sin(f / 25.0)), 0, 255).astype(np.uint8)
    for i in range(NB + 1):
        x = 60 + i * 90 - 10
        cv2.line(base, (x, 115), (x, 305), (230, 230, 230), 3)
    cv2.line(base, (50, 115), (60 + NB * 90, 115), (230, 230, 230), 3)
    cv2.line(base, (50, 305), (60 + NB * 90, 305), (230, 230, 230), 3)
    for b in range(NB):
        if truth(b, f) == "occupied":
            x0, y0, x1, y1 = bay_rect(b)
            cv2.rectangle(base, (x0 + 8, y0 + 25), (x1 - 8, y1 - 25), CAR_COLORS[b], -1)
            cv2.rectangle(base, (x0 + 14, y0 + 55), (x1 - 14, y0 + 95), (25, 25, 30), -1)
            cv2.rectangle(base, (x0 + 14, y1 - 90), (x1 - 14, y1 - 55), (25, 25, 30), -1)
    if f % 6 < 3:  # flickering lamp inside an EMPTY bay (bay 3)
        cv2.circle(base, (60 + 3 * 90 + 35, 150), 6, (255, 255, 255), -1)
    noise = rng.normal(0, 3, (H, W, 1)).astype(int)
    return np.clip(base.astype(int) + noise, 0, 255).astype(np.uint8)


def main():
    out_video = os.path.normpath(OUT_VIDEO)
    os.makedirs(os.path.dirname(out_video), exist_ok=True)
    vw = cv2.VideoWriter(out_video, cv2.VideoWriter_fourcc(*"mp4v"), FPS, (W, H))
    for f in range(TOTAL):
        vw.write(make_frame(f))
    vw.release()

    regions = []
    truth_map = {}
    for b in range(NB):
        x0, y0, x1, y1 = bay_rect(b)
        regions.append({
            "id": b + 1,
            "label": f"bay-{b + 1}",
            "polygon": [[x0 / W, y0 / H], [x1 / W, y0 / H],
                        [x1 / W, y1 / H], [x0 / W, y1 / H]],
        })
        truth_map[str(b + 1)] = truth(b, TOTAL - 1)
    with open(OUT_JSON, "w") as fh:
        json.dump({"regions": regions, "truth": truth_map}, fh, indent=2)

    print(f"wrote {out_video} ({TOTAL} frames @ {FPS}fps)")
    print(f"wrote {OUT_JSON}")


if __name__ == "__main__":
    main()

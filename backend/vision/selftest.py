"""Self-test harness for the vision occupancy engine.

Run:  python -m vision.selftest                 (synthetic ground truth)
      python -m vision.selftest <video> <regions.json>   (real footage)

The synthetic case builds an overhead parking-lot video in memory with a
KNOWN occupancy schedule (cars arrive and depart, a lamp flickers inside an
empty bay to try to cause false positives, lighting drifts to simulate
clouds) and measures per-frame and per-bay agreement.  This is the objective
check that the detector is correct, independent of any demo footage.

regions.json format for real footage:
    [{"id":1,"label":"bay-1","polygon":[[x,y],[x,y],[x,y],[x,y]]}, ...]
with polygon in normalised 0..1 frame coordinates, plus optional
    "truth": {"1":"occupied", ...}   to score against.
"""
import json
import sys

import cv2
import numpy as np

from vision.analyzer import CameraAnalyzer

W, H, NB = 640, 360, 6
TOTAL = 120
SCHED = {0: (0, 60), 1: (40, None), 2: (0, None),
         3: (None, None), 4: (30, 90), 5: (70, None)}
CAR_COLORS = [(40, 40, 180), (200, 200, 205), (30, 30, 35),
              (60, 120, 200), (80, 80, 85), (180, 60, 40)]


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


def synthetic_regions():
    out = []
    for b in range(NB):
        x0, y0, x1, y1 = bay_rect(b)
        out.append({"id": b + 1, "label": f"bay{b}",
                    "polygon": [[x0 / W, y0 / H], [x1 / W, y0 / H],
                                [x1 / W, y1 / H], [x0 / W, y1 / H]]})
    return out


def run_synthetic():
    regions = synthetic_regions()
    an = CameraAnalyzer()
    statuses = {r["id"]: "unknown" for r in regions}
    agree = tot = 0
    per = {r["id"]: [0, 0] for r in regions}
    for f in range(TOTAL):
        res = an.process(make_frame(f), regions)
        for r in res:
            rid = r["id"]
            tr = truth(rid - 1, f)
            statuses[rid] = an.trackers[rid].update_status(
                statuses[rid], r["confidence"], 0.90, 0.15)
            if f >= 4:
                tot += 1
                ok = statuses[rid] == tr
                agree += ok
                per[rid][0] += ok
                per[rid][1] += 1
    print(f"per-frame agreement (post-warmup): {agree}/{tot} = {agree / tot:.1%}")
    all_ok = True
    for b in range(NB):
        rid = b + 1
        ok, n = per[rid]
        end_ok = statuses[rid] == truth(b, TOTAL - 1)
        all_ok &= end_ok
        print(f"  bay{b}: final={statuses[rid]:9s} truth@end={truth(b, TOTAL - 1):9s} "
              f"frameAcc={ok / n:.1%} {'OK' if end_ok else 'MISMATCH'}")
    return all_ok


def run_video(path, regions_path):
    with open(regions_path) as fh:
        spec = json.load(fh)
    regions = spec["regions"] if isinstance(spec, dict) else spec
    truth_map = (spec.get("truth") or {}) if isinstance(spec, dict) else {}
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        print(f"cannot open {path}")
        return False
    an = CameraAnalyzer()
    statuses = {r["id"]: "unknown" for r in regions}
    confs = {r["id"]: [] for r in regions}
    n = 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        n += 1
        for r in an.process(fr, regions):
            confs[r["id"]].append(r["confidence"])
            statuses[r["id"]] = an.trackers[r["id"]].update_status(
                statuses[r["id"]], r["confidence"], 0.90, 0.15)
    cap.release()
    print(f"frames: {n}")
    correct = scored = 0
    for r in regions:
        cs = confs[r["id"]]
        mean = sum(cs) / len(cs) if cs else 0.0
        line = f"  {r.get('label') or r['id']}: meanConf={mean:.3f} final={statuses[r['id']]}"
        t = truth_map.get(str(r["id"]))
        if t:
            scored += 1
            okv = statuses[r["id"]] == t
            correct += okv
            line += f" truth={t} {'PASS' if okv else 'FAIL'}"
        print(line)
    if scored:
        print(f"accuracy {correct}/{scored}")
    return True


if __name__ == "__main__":
    if len(sys.argv) >= 3:
        sys.exit(0 if run_video(sys.argv[1], sys.argv[2]) else 1)
    print("=== synthetic ground-truth (overhead cam, known schedule) ===")
    sys.exit(0 if run_synthetic() else 1)

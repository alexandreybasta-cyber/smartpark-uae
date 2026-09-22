"""Fine-tune a YOLO11-OBB parking-bay detector from the labelled dataset.

Run by the backend (POST /api/vision/train/start) inside backend/train-venv
(the only environment with torch+ultralytics).  Converts the JSONL quad labels
to YOLO OBB format (class + 8 normalised corner values), trains yolo11n-obb,
exports ONNX and installs it as vision/models/bays.onnx so Auto-detect bays
becomes zero-config.  Progress is written to a status JSON the API polls.
"""
import argparse
import json
import os
import shutil
import sys
import time
import traceback


def _quad4(poly):
    pts = [list(p) for p in poly]
    if len(pts) == 4:
        return pts
    if not pts:
        return None
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]


class Status:
    def __init__(self, path):
        self.path = path

    def write(self, **kw):
        d = {}
        if os.path.exists(self.path):
            try:
                with open(self.path) as fh:
                    d = json.load(fh)
            except Exception:
                d = {}
        d.update(kw)
        d["ts"] = time.time()
        tmp = self.path + ".tmp"
        with open(tmp, "w") as fh:
            json.dump(d, fh)
        os.replace(tmp, self.path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--status", required=True)
    ap.add_argument("--epochs", type=int, default=40)
    ap.add_argument("--imgsz", type=int, default=640)
    args = ap.parse_args()
    # absolutize before any os.chdir(work) below
    args.dataset = os.path.abspath(args.dataset)
    args.out = os.path.abspath(args.out)
    args.status = os.path.abspath(args.status)

    st = Status(args.status)
    log = ["prepare: reading dataset"]
    st.write(running=True, pid=os.getpid(), epoch=0, epochs=args.epochs,
             stage="prepare", log=log, error=None)
    try:
        import torch  # noqa: F401
        import ultralytics
        from ultralytics import YOLO
        st.write(torch=torch.__version__, ultralytics=ultralytics.__version__)

        jsonl = os.path.join(args.dataset, "labels.jsonl")
        imgs_dir = os.path.join(args.dataset, "imgs")
        recs = []
        if os.path.exists(jsonl):
            with open(jsonl) as fh:
                for line in fh:
                    line = line.strip()
                    if line:
                        try:
                            recs.append(json.loads(line))
                        except json.JSONDecodeError:
                            continue
        recs = [r for r in recs
                if r.get("polygons") and os.path.exists(os.path.join(imgs_dir, r["image"]))]
        if not recs:
            raise RuntimeError("dataset is empty - label some bays in /camera first")
        log.append(f"prepare: {len(recs)} examples")

        work = os.path.join(os.path.dirname(args.status), "trainwork")
        for sub in ("images/train", "images/val", "labels/train", "labels/val"):
            os.makedirs(os.path.join(work, sub), exist_ok=True)
        # ultralytics resolves data.yaml "path: ." against the CWD, so run from
        # inside the work dir (also keeps downloaded weights/runs contained).
        os.chdir(work)
        for i, r in enumerate(recs):
            split = "val" if (len(recs) >= 4 and i % 4 == 3) else "train"
            ext = os.path.splitext(r["image"])[1] or ".png"
            shutil.copyfile(os.path.join(imgs_dir, r["image"]),
                            os.path.join(work, "images", split, r["id"] + ext))
            lines = []
            for poly in r["polygons"]:
                q = _quad4(poly)
                if not q:
                    continue
                lines.append("0 " + " ".join(f"{v:.6f}" for pt in q for v in pt))
            with open(os.path.join(work, "labels", split, r["id"] + ".txt"), "w") as fh:
                fh.write("\n".join(lines) + "\n")
        # ultralytics needs a non-empty val split; mirror train if too small
        val_labels = os.path.join(work, "labels", "val")
        if not os.listdir(val_labels):
            tr = os.path.join(work, "labels", "train")
            tri = os.path.join(work, "images", "train")
            vi = os.path.join(work, "images", "val")
            for name in os.listdir(tr):
                shutil.copyfile(os.path.join(tr, name), os.path.join(val_labels, name))
            for name in os.listdir(tri):
                shutil.copyfile(os.path.join(tri, name), os.path.join(vi, name))
        with open(os.path.join(work, "data.yaml"), "w") as fh:
            fh.write("path: .\ntrain: images/train\nval: images/val\nnames:\n  0: bay\n")
        log.append("prepare: dataset written; loading yolo11n-obb")
        st.write(stage="train", log=log)

        model = YOLO("yolo11n-obb.pt")

        def on_epoch(trainer):
            log.append(f"epoch {trainer.epoch + 1}/{args.epochs} done")
            st.write(epoch=int(trainer.epoch) + 1, stage="train", log=log[-80:])

        model.add_callback("on_train_epoch_end", on_epoch)
        model.train(data="data.yaml", epochs=args.epochs,
                    imgsz=args.imgsz, batch=4, device="cpu", workers=0,
                    project=".", name="run", exist_ok=True, verbose=False,
                    plots=False)
        best = None
        sd = getattr(getattr(model, "trainer", None), "save_dir", None)
        cands = []
        if sd:
            cands += [os.path.join(sd, "weights", "best.pt"),
                      os.path.join(sd, "weights", "last.pt")]
        cands += [os.path.join(work, "runs", "obb", "run", "weights", "best.pt"),
                  os.path.join(work, "runs", "obb", "run", "weights", "last.pt"),
                  os.path.join(work, "run", "weights", "best.pt"),
                  os.path.join(work, "run", "weights", "last.pt")]
        for c in cands:
            if os.path.exists(c):
                best = c
                break
        if best is None:
            raise RuntimeError("training finished but no weights found")
        log.append("train: complete; exporting ONNX")
        st.write(stage="export", log=log)
        exp = YOLO(best)
        exp.export(format="onnx", imgsz=args.imgsz, simplify=True)
        onnx = best.replace(".pt", ".onnx")
        os.makedirs(os.path.dirname(args.out), exist_ok=True)
        shutil.copyfile(onnx, args.out)
        log.append(f"export: installed {args.out}")
        st.write(running=False, stage="done", epoch=args.epochs, log=log)
        print("TRAIN DONE")
    except Exception as e:  # noqa: BLE001
        log.append("ERROR: " + str(e))
        log.append(traceback.format_exc()[-800:])
        st.write(running=False, stage="error", error=str(e), log=log[-80:])
        print("TRAIN FAILED:", e, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

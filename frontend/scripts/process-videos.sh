#!/bin/bash
# Processes raw AI-generated clips in public/videos/raw/ into web-ready
# assets in public/videos/: muted H.264 mp4 + VP9 webm + a poster jpg.
# Usage: ./scripts/process-videos.sh [max_width]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAW_DIR="$SCRIPT_DIR/../public/videos/raw"
OUT_DIR="$SCRIPT_DIR/../public/videos"
MAX_WIDTH="${1:-1280}"

shopt -s nullglob
files=("$RAW_DIR"/*.mp4 "$RAW_DIR"/*.mov "$RAW_DIR"/*.webm)

if [ ${#files[@]} -eq 0 ]; then
  echo "No clips found in $RAW_DIR — drop your generated videos there first."
  exit 0
fi

for src in "${files[@]}"; do
  name="$(basename "${src%.*}")"
  echo "=== $name ==="

  # Even dimensions required for yuv420p; cap width, preserve aspect.
  SCALE="scale='min(${MAX_WIDTH},iw)':-2"

  # H.264 mp4 — muted, faststart for progressive web playback.
  ffmpeg -y -i "$src" \
    -vf "$SCALE" -an \
    -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart \
    "$OUT_DIR/$name.mp4"

  # VP9 webm — smaller, for browsers that prefer it.
  ffmpeg -y -i "$src" \
    -vf "$SCALE" -an \
    -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 \
    "$OUT_DIR/$name.webm"

  # Poster frame at 0.2s (skips any AI-generation fade-in artifact at frame 0).
  ffmpeg -y -i "$src" -ss 00:00:00.2 -vframes 1 -vf "$SCALE" \
    -q:v 3 "$OUT_DIR/$name-poster.jpg"

  echo "-> $OUT_DIR/$name.mp4, $name.webm, $name-poster.jpg"
done

echo "Done. Original size vs output:"
du -sh "$RAW_DIR"/* "$OUT_DIR"/*.mp4 2>/dev/null || true

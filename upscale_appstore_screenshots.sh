#!/bin/bash
# Upscale screenshots to 1260x2736 for App Store (iPhone 6.9" Display)
# Uses macOS native sips — no third-party dependencies

SRC_DIR="/Users/temp/Documents/QODER/SmartPark AI/Screenshot From APP"
OUT_DIR="${SRC_DIR}/appstore_1260x2736"

mkdir -p "$OUT_DIR"

TARGET_W=1260
TARGET_H=2736

# Associative array: source filename -> output filename
declare -A FILES
FILES=(
  ["Map - 1 Main Screen.JPG"]="screenshot_01_map_main_screen"
  ["Map - 2 After pressing Generate.JPG"]="screenshot_02_map_generate_spots"
  ["Map - 3 after clicking on a parking lot.JPG"]="screenshot_03_map_spot_detail"
  ["Map - 4 Waze redirection.JPG"]="screenshot_04_map_waze_navigation"
  ["Maps itinerary to the parking spot after notification.PNG.JPG"]="screenshot_05_maps_itinerary"
  ["Saved Places 1.PNG.JPG"]="screenshot_06_saved_places_list"
  ["Saved Places 2 - Creation.PNG.JPG"]="screenshot_07_saved_places_creation"
  ["Saved Places 2 - Selecting One.PNG.JPG"]="screenshot_08_saved_places_selecting"
  ["Saved Places 3 - Redireting to gps.JPG"]="screenshot_09_saved_places_gps_redirect"
  ["Saved Places 4 - After clicking on spotsense notification for a free parking spot.JPG"]="screenshot_10_saved_places_notification"
  ["Agent.JPG"]="screenshot_11_agent_view"
  ["Agent 2 - Burj kHALIFA.JPG"]="screenshot_12_agent_burj_khalifa"
  ["Enforcement 1 - Map.JPG"]="screenshot_13_enforcement_map"
  ["Enforcement 2 - Violation.JPG"]="screenshot_14_enforcement_violation"
  ["Insights 0 - default.PNG.JPG"]="screenshot_15_insights_default"
  ["Insights 1.PNG.JPG"]="screenshot_16_insights_view_1"
  ["Insights 2.PNG.JPG"]="screenshot_17_insights_view_2"
  ["Settings.PNG.JPG"]="screenshot_18_settings"
)

echo "========================================"
echo " App Store Screenshot Upscaler (sips)"
echo " Target: ${TARGET_W} x ${TARGET_H}"
echo "========================================"
echo ""

SUCCESS=0
FAIL=0

for src_name in "${!FILES[@]}"; do
  out_name="${FILES[$src_name]}"
  src_path="${SRC_DIR}/${src_name}"
  tmp_path="${OUT_DIR}/${out_name}.tmp"
  out_path="${OUT_DIR}/${out_name}.png"

  if [[ ! -f "$src_path" ]]; then
    echo "MISSING: $src_name"
    ((FAIL++))
    continue
  fi

  # Step 1: Copy source to temp file (sips works in-place or needs writable copy)
  cp "$src_path" "$tmp_path"

  # Step 2: Resize to exact target dimensions using sips
  # sips -z takes height then width
  sips -z "$TARGET_H" "$TARGET_W" "$tmp_path" --out "$out_path" -s format png >/dev/null 2>&1

  # Clean up temp
  rm -f "$tmp_path"

  # Step 3: Verify output dimensions
  out_w=$(sips -g pixelWidth "$out_path" 2>/dev/null | awk '/pixelWidth/ {print $2}')
  out_h=$(sips -g pixelHeight "$out_path" 2>/dev/null | awk '/pixelHeight/ {print $2}')

  if [[ "$out_w" == "$TARGET_W" && "$out_h" == "$TARGET_H" ]]; then
    size_kb=$(du -k "$out_path" | cut -f1)
    printf "  OK  %s  (%s x %s, %sKB)\n" "$out_name.png" "$out_w" "$out_h" "$size_kb"
    ((SUCCESS++))
  else
    echo "  FAIL  $out_name.png  (got ${out_w} x ${out_h})"
    ((FAIL++))
  fi
done

echo ""
echo "========================================"
echo " Done: $SUCCESS succeeded, $FAIL failed"
echo " Output: $OUT_DIR"
echo "========================================"

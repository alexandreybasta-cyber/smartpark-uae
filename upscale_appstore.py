from PIL import Image
import os

SRC_DIR = "/Users/temp/Documents/QODER/SmartPark AI/Screenshot From APP"
OUT_DIR = os.path.join(SRC_DIR, "appstore_1260x2736")
os.makedirs(OUT_DIR, exist_ok=True)

TARGET_W, TARGET_H = 1260, 2736

files = {
    "Map - 1 Main Screen.JPG": "screenshot_01_map_main_screen",
    "Map - 2 After pressing Generate.JPG": "screenshot_02_map_generate_spots",
    "Map - 3 after clicking on a parking lot.JPG": "screenshot_03_map_spot_detail",
    "Map - 4 Waze redirection.JPG": "screenshot_04_map_waze_navigation",
    "Maps itinerary to the parking spot after notification.PNG.JPG": "screenshot_05_maps_itinerary",
    "Saved Places 1.PNG.JPG": "screenshot_06_saved_places_list",
    "Saved Places 2 - Creation.PNG.JPG": "screenshot_07_saved_places_creation",
    "Saved Places 2 - Selecting One.PNG.JPG": "screenshot_08_saved_places_selecting",
    "Saved Places 3 - Redireting to gps.JPG": "screenshot_09_saved_places_gps_redirect",
    "Saved Places 4 - After clicking on spotsense notification for a free parking spot.JPG": "screenshot_10_saved_places_notification",
    "Agent.JPG": "screenshot_11_agent_view",
    "Agent 2 - Burj kHALIFA.JPG": "screenshot_12_agent_burj_khalifa",
    "Enforcement 1 - Map.JPG": "screenshot_13_enforcement_map",
    "Enforcement 2 - Violation.JPG": "screenshot_14_enforcement_violation",
    "Insights 0 - default.PNG.JPG": "screenshot_15_insights_default",
    "Insights 1.PNG.JPG": "screenshot_16_insights_view_1",
    "Insights 2.PNG.JPG": "screenshot_17_insights_view_2",
    "Settings.PNG.JPG": "screenshot_18_settings",
}

success = 0
fail = 0

for src_name, out_name in files.items():
    src_path = os.path.join(SRC_DIR, src_name)
    out_path = os.path.join(OUT_DIR, f"{out_name}.png")
    
    if not os.path.exists(src_path):
        print(f"  MISSING: {src_name}")
        fail += 1
        continue
    
    img = Image.open(src_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    img_resized = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)
    img_resized.save(out_path, "PNG")
    
    # Verify
    verify = Image.open(out_path)
    w, h = verify.size
    size_kb = os.path.getsize(out_path) // 1024
    
    if w == TARGET_W and h == TARGET_H:
        print(f"  OK  | {w}x{h} | {size_kb}KB | {out_name}.png")
        success += 1
    else:
        print(f"  FAIL | {w}x{h} | {out_name}.png")
        fail += 1

print(f"\nDone: {success} succeeded, {fail} failed")
print(f"Output folder: {OUT_DIR}")
print(f"Total files: {len([f for f in os.listdir(OUT_DIR) if f.endswith('.png')])}")

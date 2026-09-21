"""Generate SpotSense Architecture Diagram as PNG using Pillow."""

from PIL import Image, ImageDraw, ImageFont
import os

# ── Canvas ──────────────────────────────────────────────────────────────────
W, H = 1600, 1000
BG = "#FFFFFF"
BLUE = "#0A84FF"
BLUE_LIGHT = "#E8F2FF"
GRAY = "#6B7280"
GRAY_LIGHT = "#F3F4F6"
GRAY_BORDER = "#D1D5DB"
DARK = "#1F2937"
WHITE = "#FFFFFF"
GREEN = "#10B981"
GREEN_LIGHT = "#ECFDF5"
ORANGE = "#F59E0B"
ORANGE_LIGHT = "#FFFBEB"
PURPLE = "#8B5CF6"
PURPLE_LIGHT = "#F5F3FF"
RED = "#EF4444"
RED_LIGHT = "#FEF2F2"

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img, "RGBA")

# ── Fonts ───────────────────────────────────────────────────────────────────
FONT_CACHE = os.path.join(os.path.dirname(__file__), ".fontcache")

def load_font(size, bold=False):
    name = "inter-700.ttf" if bold else "inter-500.ttf"
    path = os.path.join(FONT_CACHE, name)
    if os.path.exists(path):
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()

font_title = load_font(28, bold=True)
font_box_title = load_font(16, bold=True)
font_box_sub = load_font(13)
font_label = load_font(12)
font_section = load_font(14, bold=True)
font_small = load_font(11)

# ── Helpers ─────────────────────────────────────────────────────────────────

def rounded_rect(x, y, w, h, r=12, fill=None, outline=None, width=1):
    draw.rounded_rectangle([x, y, x+w, y+h], radius=r, fill=fill, outline=outline, width=width)

def text_centered(text, x, y, w, font, fill=DARK):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((x + (w - tw) / 2, y), text, font=font, fill=fill)

def arrow(x1, y1, x2, y2, color=GRAY, width=2, dashed=False):
    if dashed:
        # Draw dashed line
        import math
        dx = x2 - x1
        dy = y2 - y1
        length = math.sqrt(dx*dx + dy*dy)
        dash_len = 8
        gap_len = 5
        steps = int(length / (dash_len + gap_len))
        for i in range(steps):
            t1 = i * (dash_len + gap_len) / length
            t2 = (i * (dash_len + gap_len) + dash_len) / length
            sx = x1 + dx * t1
            sy = y1 + dy * t1
            ex = x1 + dx * t2
            ey = y1 + dy * t2
            draw.line([(sx, sy), (ex, ey)], fill=color, width=width)
    else:
        draw.line([(x1, y1), (x2, y2)], fill=color, width=width)
    # Arrowhead
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_len = 10
    arrow_angle = math.pi / 6
    ax1 = x2 - arrow_len * math.cos(angle - arrow_angle)
    ay1 = y2 - arrow_len * math.sin(angle - arrow_angle)
    ax2 = x2 - arrow_len * math.cos(angle + arrow_angle)
    ay2 = y2 - arrow_len * math.sin(angle + arrow_angle)
    draw.polygon([(x2, y2), (ax1, ay1), (ax2, ay2)], fill=color)

def label_on_arrow(text, x1, y1, x2, y2, font=font_label, color=GRAY, bg=WHITE):
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = 4
    draw.rectangle([mx - tw/2 - pad, my - th/2 - pad, mx + tw/2 + pad, my + th/2 + pad], fill=bg)
    draw.text((mx - tw/2, my - th/2), text, font=font, fill=color)

def box_with_header(title, subtitle, x, y, w, h, accent_color, bg_color):
    rounded_rect(x, y, w, h, r=10, fill=bg_color, outline=accent_color, width=2)
    # Header bar
    draw.rectangle([x+2, y+2, x+w-2, y+36], fill=accent_color)
    # Round top corners overlay
    draw.rounded_rectangle([x, y, x+w, y+38], radius=10, fill=accent_color)
    draw.rectangle([x, y+20, x+w, y+38], fill=accent_color)
    text_centered(title, x, y+8, w, font_box_title, WHITE)
    if subtitle:
        text_centered(subtitle, x, y+42, w, font_box_sub, DARK)

# ── Title ───────────────────────────────────────────────────────────────────
text_centered("SpotSense  ·  System Architecture", 0, 18, W, font_title, DARK)
text_centered("Real-Time Parking Intelligence Platform", 0, 52, W, font_box_sub, GRAY)

# ── Section backgrounds ─────────────────────────────────────────────────────
# Edge layer
rounded_rect(30, 85, 280, 400, r=14, fill="#F9FAFB", outline=GRAY_BORDER, width=1)
draw.text((50, 95), "EDGE LAYER", font=font_section, fill=GRAY)

# Cloud layer  
rounded_rect(30, 500, 280, 190, r=14, fill="#FFF7ED", outline="#FDBA74", width=1)
draw.text((50, 510), "CLOUD IoT", font=font_section, fill=ORANGE)

# Backend
rounded_rect(370, 85, 280, 605, r=14, fill="#F0F9FF", outline="#7DD3FC", width=1)
draw.text((390, 95), "BACKEND SERVER", font=font_section, fill="#0284C7")

# Frontend
rounded_rect(710, 85, 260, 240, r=14, fill=GRAY_LIGHT, outline=GRAY_BORDER, width=1)
draw.text((730, 95), "FRONTEND", font=font_section, fill=GRAY)

# iOS
rounded_rect(710, 350, 260, 340, r=14, fill=BLUE_LIGHT, outline=BLUE, width=1)
draw.text((730, 360), "iOS APP", font=font_section, fill=BLUE)

# AI Cloud
rounded_rect(1040, 350, 280, 190, r=14, fill=RED_LIGHT, outline="#FCA5A5", width=1)
draw.text((1060, 360), "AI CLOUD", font=font_section, fill=RED)

# Camera
rounded_rect(1040, 560, 280, 130, r=14, fill=PURPLE_LIGHT, outline="#C4B5FD", width=1)
draw.text((1060, 570), "VISION", font=font_section, fill=PURPLE)

# ── Edge Sensors ────────────────────────────────────────────────────────────
box_with_header("LD2410 mmWave", "24GHz Radar Sensor", 55, 130, 230, 80, "#374151", WHITE)
box_with_header("ESP32 MCU", "Wi-Fi + BLE Controller", 55, 230, 230, 80, "#374151", WHITE)
box_with_header("Firmware", "Detection + MQTT Pub", 55, 330, 230, 80, "#374151", WHITE)

# Sensor arrows (vertical)
arrow(170, 210, 170, 230, color="#374151", width=2)
arrow(170, 310, 170, 330, color="#374151", width=2)

# ── Cloud IoT ───────────────────────────────────────────────────────────────
box_with_header("Alibaba Cloud IoT", "Device Shadow + Rules Engine", 55, 540, 230, 80, ORANGE, WHITE)
box_with_header("MQTT Broker", "Topic: /sensors/#", 55, 635, 230, 45, ORANGE, WHITE)

# ── Backend ─────────────────────────────────────────────────────────────────
box_with_header("FastAPI Server", "Python 3.11 + Uvicorn", 395, 130, 230, 80, "#0284C7", WHITE)
box_with_header("SQLite DB", "Spots · Zones · Sensors", 395, 240, 230, 80, "#0284C7", WHITE)
box_with_header("MQTT Subscriber", "Real-time Ingestion", 395, 350, 230, 80, "#0284C7", WHITE)
box_with_header("WebSocket Hub", "Live Spot Updates", 395, 460, 230, 80, "#0284C7", WHITE)
box_with_header("REST API", "/api/spots · /api/zones", 395, 570, 230, 80, "#0284C7", WHITE)

# Backend internal arrows
arrow(510, 210, 510, 240, color="#0284C7", width=1)
arrow(510, 320, 510, 350, color="#0284C7", width=1)
arrow(510, 430, 510, 460, color="#0284C7", width=1)
arrow(510, 540, 510, 570, color="#0284C7", width=1)

# ── Frontend ────────────────────────────────────────────────────────────────
box_with_header("Next.js 14", "React + TypeScript", 735, 130, 210, 80, "#374151", WHITE)
box_with_header("Leaflet Map", "OpenStreetMap Tiles", 735, 230, 210, 80, "#374151", WHITE)

arrow(840, 210, 840, 230, color="#374151", width=1)

# ── iOS App ─────────────────────────────────────────────────────────────────
box_with_header("SwiftUI Views", "MapKit + Navigation", 735, 400, 210, 80, BLUE, WHITE)
box_with_header("Location Services", "CoreLocation + Geofence", 735, 500, 210, 80, BLUE, WHITE)
box_with_header("Camera Module", "ALPR / ANPR Plate Scan", 735, 600, 210, 80, BLUE, WHITE)

# iOS internal arrows
arrow(840, 480, 840, 500, color=BLUE, width=1)
arrow(840, 580, 840, 600, color=BLUE, width=1)

# ── AI Cloud (DashScope) ───────────────────────────────────────────────────
# Highlight box with glow effect
rounded_rect(1060, 390, 240, 60, r=10, fill="#FEE2E2", outline=RED, width=3)
text_centered("DashScope API", 1060, 398, 240, font_box_title, RED)
text_centered("Alibaba Cloud", 1060, 420, 240, font_box_sub, DARK)

box_with_header("Qwen Cloud", "qwen-plus LLM", 1060, 465, 240, 60, RED, WHITE)

# AI highlight star/emphasis
rounded_rect(1100, 378, 200, 20, r=4, fill=RED)
text_centered("★ HACKATHON KEY PROOF ★", 1100, 380, 200, font_small, WHITE)

# ── Vision ──────────────────────────────────────────────────────────────────
box_with_header("ALPR / ANPR", "License Plate Recognition", 1060, 600, 240, 80, PURPLE, WHITE)

# ── Cross-component arrows ─────────────────────────────────────────────────

# Edge -> Backend (MQTT)
arrow(285, 370, 395, 370, color="#374151", width=2)
label_on_arrow("MQTT", 285, 370, 395, 370, color="#374151")

# Edge -> Cloud IoT
arrow(170, 410, 170, 540, color=ORANGE, width=2, dashed=True)
label_on_arrow("IoT Sync", 170, 440, 170, 540, color=ORANGE)

# Cloud IoT MQTT -> Backend
arrow(285, 657, 395, 390, color=ORANGE, width=2)
label_on_arrow("MQTT", 310, 600, 370, 480, color=ORANGE)

# Backend WebSocket -> Frontend
arrow(625, 500, 735, 270, color="#0284C7", width=2)
label_on_arrow("WebSocket", 640, 420, 720, 310, color="#0284C7")

# Backend REST -> iOS
arrow(625, 610, 735, 540, color=BLUE, width=2)
label_on_arrow("REST API", 640, 600, 720, 560, color=BLUE)

# iOS -> DashScope (KEY CONNECTION - thick + highlighted)
arrow(945, 440, 1060, 420, color=RED, width=4)
label_on_arrow("API Call", 955, 415, 1045, 405, color=RED, font=font_box_sub)

# iOS -> Camera
arrow(945, 640, 1060, 640, color=PURPLE, width=2)
label_on_arrow("Vision", 945, 640, 1060, 640, color=PURPLE)

# ── Legend ──────────────────────────────────────────────────────────────────
ly = 720
rounded_rect(1040, 720, 280, 170, r=10, fill=GRAY_LIGHT, outline=GRAY_BORDER, width=1)
draw.text((1060, 730), "LEGEND", font=font_section, fill=DARK)

items = [
    ("#374151", "Edge Hardware"),
    ("#0284C7", "Backend Services"),
    (BLUE, "iOS Application"),
    (RED, "AI / DashScope (Qwen)"),
    (PURPLE, "Computer Vision"),
    (ORANGE, "Cloud IoT Platform"),
]
for i, (color, label) in enumerate(items):
    iy = 755 + i * 22
    draw.rectangle([1065, iy, 1080, iy+12], fill=color)
    draw.text((1090, iy-1), label, font=font_small, fill=DARK)

# ── Data flow labels at bottom ──────────────────────────────────────────────
draw.text((50, 720), "Data Flow:", font=font_section, fill=DARK)
draw.text((50, 745), "1. mmWave sensors detect vehicle presence via ESP32 firmware", font=font_small, fill=GRAY)
draw.text((50, 765), "2. MQTT publishes occupancy data to backend + Alibaba Cloud IoT", font=font_small, fill=GRAY)
draw.text((50, 785), "3. FastAPI processes and stores in SQLite, pushes via WebSocket/REST", font=font_small, fill=GRAY)
draw.text((50, 805), "4. iOS app queries spots, invokes Qwen AI agent for recommendations", font=font_small, fill=GRAY)
draw.text((50, 825), "5. ALPR camera captures plate data for enforcement tracking", font=font_small, fill=GRAY)

# ── Footer ──────────────────────────────────────────────────────────────────
draw.line([(50, 870), (W-50, 870)], fill=GRAY_BORDER, width=1)
draw.text((50, 885), "SpotSense — Smart Parking Intelligence", font=font_small, fill=GRAY)
draw.text((50, 905), "Alibaba Cloud Hackathon Submission", font=font_small, fill=GRAY)

# Watermark-style tech tags
tags = ["FastAPI", "SQLite", "MQTT", "Next.js", "SwiftUI", "Qwen-plus", "DashScope", "Leaflet", "ESP32", "LD2410"]
tx = 500
for tag in tags:
    bbox = draw.textbbox((0,0), tag, font=font_small)
    tw = bbox[2] - bbox[0]
    rounded_rect(tx, 888, tw+16, 22, r=4, fill=BLUE_LIGHT, outline=BLUE, width=1)
    draw.text((tx+8, 891), tag, font=font_small, fill=BLUE)
    tx += tw + 26

# ── Save ────────────────────────────────────────────────────────────────────
out = os.path.join(os.path.dirname(__file__), "spotsense-architecture.png")
img.save(out, "PNG", dpi=(150, 150))
print(f"Saved: {out}  ({img.size[0]}x{img.size[1]})")

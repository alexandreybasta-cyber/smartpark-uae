#!/usr/bin/env python3
"""
SpotSense hackathon thumbnail generator.
Brand palette pulled from Website/spotsense/css/style.css:
  bg #0a0b0c · ink #e8eaec · ink-dim #8a8f94 · line #1c2024
  cyan #7fe8ff · red #e84a3f · amber #d9a13b
Fonts: Inter (sans) + JetBrains Mono (mono) from the site's vendor/fonts.
Renders at 2x then downsamples with LANCZOS for crisp anti-aliasing.
"""
import os
import random
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = "/Users/temp/Documents/QODER/SmartPark AI"
VENDOR = os.path.join(ROOT, "Website/spotsense/vendor/fonts")
FONTCACHE = os.path.join(ROOT, ".fontcache")
os.makedirs(FONTCACHE, exist_ok=True)

# ---------- fonts: woff2 -> ttf ----------
def woff2_to_ttf(src, dst):
    if not os.path.exists(dst):
        f = TTFont(os.path.join(VENDOR, src))
        f.flavor = None
        f.save(dst)
    return dst

INTER_700 = woff2_to_ttf("inter-700.woff2", os.path.join(FONTCACHE, "inter-700.ttf"))
INTER_600 = woff2_to_ttf("inter-600.woff2", os.path.join(FONTCACHE, "inter-600.ttf"))
INTER_500 = woff2_to_ttf("inter-500.woff2", os.path.join(FONTCACHE, "inter-500.ttf"))
INTER_400 = woff2_to_ttf("inter-400.woff2", os.path.join(FONTCACHE, "inter-400.ttf"))
JB_500 = woff2_to_ttf("jbmono-500.woff2", os.path.join(FONTCACHE, "jbmono-500.ttf"))

def F(path, size):
    return ImageFont.truetype(path, size)

# ---------- palette ----------
BG      = (10, 11, 12)
BG2     = (14, 16, 18)
ASPHALT = (17, 19, 22)
ASPHALT2= (21, 24, 28)
INK     = (232, 234, 236)
INK_DIM = (138, 143, 148)
INK_FNT = (58, 63, 68)
LINE    = (28, 32, 36)
CYAN    = (127, 232, 255)
RED     = (232, 74, 63)
GREEN   = (52, 224, 161)

S = 2  # supersample
W, H = 1200 * S, 800 * S

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img, "RGBA")

def rgba(c, a):
    return (c[0], c[1], c[2], a)

# ============================================================
# 1. TOP-DOWN PARKING LOT (hero visual, fills the canvas)
# ============================================================
lot = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ld = ImageDraw.Draw(lot, "RGBA")

# faint asphalt base panels for depth
ld.rectangle([0, 0, W, H], fill=rgba(BG2, 255))

bw, bh = 150 * S, 132 * S   # bay width / height
gap = 6 * S
lane = 96 * S               # drive lane height
col_step = bw + gap

# vertical blocks: each block = 2 back-to-back bay rows + a lane
block_top_ys = []
y = 150 * S
for _ in range(3):
    block_top_ys.append(y)
    y += bh * 2 + lane

# build bay list
bays = []  # (x, y, facing)  facing: 'down' top row, 'up' bottom row
x0 = -40 * S
ncols = (W - x0) // col_step + 2
for bt in block_top_ys:
    for c in range(ncols):
        bx = x0 + c * col_step
        bays.append((bx, bt, "down"))
        bays.append((bx, bt + bh, "up"))

# decide free spots: exactly 11 free, rest occupied
rng = random.Random(2026)
# only consider bays visibly on-canvas for the free set so dots are seen
onscreen = [i for i, (bx, by, f) in enumerate(bays) if 40 * S < bx < W - 60 * S]
free_idx = set(rng.sample(onscreen, 11))

CAR_TONES = [(38, 42, 47), (46, 50, 56), (30, 34, 39), (52, 57, 63), (34, 40, 47)]

def draw_bay(x, y, facing, occupied):
    # bay divider lines (sides + head)
    ld.rectangle([x, y, x + bw, y + bh], fill=rgba(ASPHALT, 255))
    ld.line([x, y + 6 * S, x, y + bh - 6 * S], fill=rgba(LINE, 255), width=max(1, 1 * S))
    ld.line([x + bw, y + 6 * S, x + bw, y + bh - 6 * S], fill=rgba(LINE, 255), width=max(1, 1 * S))
    head_y = y if facing == "down" else y + bh
    ld.line([x + 3 * S, head_y, x + bw - 3 * S, head_y], fill=rgba(INK_FNT, 200), width=max(1, 1 * S))

    # sensor dot at the head of the bay
    sx = x + bw // 2
    sy = (y + 20 * S) if facing == "down" else (y + bh - 20 * S)
    dot = GREEN if not occupied else RED
    # glow
    for r, a in [(20 * S, 26), (13 * S, 46), (8 * S, 90)]:
        ld.ellipse([sx - r, sy - r, sx + r, sy + r], fill=rgba(dot, a))
    ld.ellipse([sx - 5 * S, sy - 5 * S, sx + 5 * S, sy + 5 * S], fill=rgba(dot, 255))
    ld.ellipse([sx - 2 * S, sy - 2 * S, sx + 1 * S, sy + 1 * S], fill=rgba((255, 255, 255), 200))

    if occupied:
        # car body
        pad_x = 20 * S
        pad_y = 26 * S
        cx0, cy0 = x + pad_x, y + pad_y
        cx1, cy1 = x + bw - pad_x, y + bh - pad_y
        tone = CAR_TONES[(x // col_step + y) % len(CAR_TONES)]
        ld.rounded_rectangle([cx0, cy0, cx1, cy1], radius=14 * S, fill=rgba(tone, 255))
        # roof / cabin (offset toward tail)
        rh = (cy1 - cy0)
        if facing == "down":
            roof = [cx0 + 8 * S, cy0 + rh * 0.30, cx1 - 8 * S, cy0 + rh * 0.72]
        else:
            roof = [cx0 + 8 * S, cy0 + rh * 0.28, cx1 - 8 * S, cy0 + rh * 0.70]
        rt = tuple(min(255, v + 14) for v in tone)
        ld.rounded_rectangle(roof, radius=9 * S, fill=rgba(rt, 255))
        # windshield highlight
        ws = tuple(min(255, v + 26) for v in tone)
        wy = roof[1] if facing == "down" else roof[3] - 8 * S
        ld.line([cx0 + 12 * S, wy, cx1 - 12 * S, wy], fill=rgba(ws, 180), width=max(1, 2 * S))
        # subtle top edge highlight
        ld.line([cx0 + 10 * S, cy0 + 2 * S, cx1 - 10 * S, cy0 + 2 * S], fill=rgba((90, 96, 104), 90), width=max(1, 1 * S))

for i, (bx, by, facing) in enumerate(bays):
    draw_bay(bx, by, facing, occupied=(i not in free_idx))

# drive-lane dashed center lines (amber-ish faint)
for bt in block_top_ys:
    ly = bt + bh * 2 + lane // 2
    dash = 26 * S
    xx = 0
    while xx < W:
        ld.line([xx, ly, xx + dash, ly], fill=rgba(INK_FNT, 150), width=max(1, 2 * S))
        xx += dash * 2

img.paste(lot, (0, 0), lot)

# ============================================================
# 2. LEGIBILITY GRADIENTS (dark left + bottom + top)
# ============================================================
ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(ov, "RGBA")
# left -> right fade
grad_w = int(W * 0.72)
for gx in range(grad_w):
    a = int(248 * (1 - gx / grad_w) ** 1.25)
    od.line([gx, 0, gx, H], fill=rgba(BG, a))
# bottom fade
grad_h = int(H * 0.34)
for gy in range(grad_h):
    a = int(230 * (gy / grad_h) ** 1.6)
    od.line([0, H - grad_h + gy, W, H - grad_h + gy], fill=rgba(BG, a))
# top fade
grad_t = int(H * 0.20)
for gy in range(grad_t):
    a = int(190 * (1 - gy / grad_t) ** 1.3)
    od.line([0, gy, W, gy], fill=rgba(BG, a))
img = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
d = ImageDraw.Draw(img, "RGBA")

# ============================================================
# 3. helper: spaced text (letter-spacing)
# ============================================================
def spaced_text(draw, xy, text, font, fill, tracking):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        w = draw.textlength(ch, font=font)
        x += w + tracking
    return x

def text_w(draw, text, font, tracking=0):
    return sum(draw.textlength(c, font=font) + tracking for c in text) - (tracking if text else 0)

MX = 96 * S  # left margin

# ============================================================
# 4. TOP HUD caption (mono, cyan) — "monitored feed" treatment
# ============================================================
hud_font = F(JB_500, 20 * S)
hy = 60 * S
# live dot
d.ellipse([MX, hy + 4 * S, MX + 12 * S, hy + 16 * S], fill=rgba(GREEN, 255))
for r, a in [(12 * S, 40), (8 * S, 80)]:
    cx, cy = MX + 6 * S, hy + 10 * S
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=rgba(GREEN, a))
d.ellipse([MX, hy + 4 * S, MX + 12 * S, hy + 16 * S], fill=rgba(GREEN, 255))
spaced_text(d, (MX + 26 * S, hy), "LIVE  ·  TOP-DOWN SENSOR FEED", hud_font,
            rgba(CYAN, 220), 3 * S)

# ============================================================
# 5. WORDMARK "SpotSense" (Inter 700, two-tone Spot/Sense)
# ============================================================
title_font = F(INTER_700, 150 * S)
ty = 250 * S
tx = MX
tx = d.textlength("Spot", font=title_font)
d.text((MX, ty), "Spot", font=title_font, fill=INK)
d.text((MX + tx, ty), "Sense", font=title_font, fill=CYAN)
# accent underline
uw = d.textlength("SpotSense", font=title_font)
d.rounded_rectangle([MX, ty + 178 * S, MX + int(uw * 0.34), ty + 186 * S],
                    radius=4 * S, fill=rgba(CYAN, 255))

# ============================================================
# 6. TAGLINE
# ============================================================
tag_font = F(INTER_500, 52 * S)
d.text((MX, ty + 220 * S), "Never Circle the Lot Again", font=tag_font, fill=rgba(INK, 235))

sub_font = F(INTER_400, 30 * S)
d.text((MX, ty + 296 * S),
       "Edge-AI parking sensors that find your spot in real time.",
       font=sub_font, fill=rgba(INK_DIM, 255))

# ============================================================
# 7. "11 spots free" cyan badge
# ============================================================
badge_font = F(INTER_600, 40 * S)
label = "11 spots free"
by0 = ty + 372 * S
pad_h, pad_v = 30 * S, 20 * S
dot_gap = 30 * S
lw = d.textlength(label, font=badge_font)
bw_badge = pad_h + dot_gap + lw + pad_h
bx1 = MX + bw_badge
by1 = by0 + 40 * S + pad_v * 2 - 40 * S + badge_font.size + 4 * S
badge_h = badge_font.size + pad_v * 2
d.rounded_rectangle([MX, by0, MX + bw_badge, by0 + badge_h], radius=badge_h // 2,
                    fill=rgba(CYAN, 30), outline=rgba(CYAN, 170), width=max(1, 2 * S))
# green live dot inside badge
gx, gy = MX + pad_h + 5 * S, by0 + badge_h // 2
for r, a in [(14 * S, 40), (9 * S, 90)]:
    d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=rgba(GREEN, a))
d.ellipse([gx - 6 * S, gy - 6 * S, gx + 6 * S, gy + 6 * S], fill=rgba(GREEN, 255))
d.text((MX + pad_h + dot_gap, by0 + pad_v - 2 * S), label, font=badge_font, fill=rgba(CYAN, 255))

# ============================================================
# 8. FOOTER badge "EdgeAgent · Qwen Cloud 2026"
# ============================================================
foot_font = F(JB_500, 24 * S)
fy = H - 62 * S
spaced_text(d, (MX, fy), "EDGEAGENT  ·  QWEN CLOUD 2026", foot_font,
            rgba(CYAN, 200), 4 * S)

# ============================================================
# 9. thin frame hairline (monitored-feed border)
# ============================================================
d.rectangle([0, 0, W - 1, H - 1], outline=rgba(LINE, 255), width=max(1, 2 * S))
inset = 14 * S
d.rectangle([inset, inset, W - inset, H - inset], outline=rgba(LINE, 180), width=1)

# ============================================================
# downsample + save
# ============================================================
final = img.resize((1200, 800), Image.LANCZOS)
out = os.path.join(ROOT, "spotsense-thumbnail.png")
final.save(out, "PNG", optimize=True)
size_mb = os.path.getsize(out) / (1024 * 1024)
print(f"SAVED: {out}")
print(f"SIZE: {size_mb:.2f} MB  ({os.path.getsize(out)} bytes)")
print(f"DIMS: {final.size}  free_spots=11")

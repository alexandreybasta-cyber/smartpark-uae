# SmartPark UAE — Qoder Build Spec

## 0. Reference Assets

- **Visual prototype** (single-file HTML, dark theme, design system): `smartpark-uae.html` in this folder — open it to see the exact design language, color palette, animations, and interaction patterns to replicate.
- **Design tokens** extracted below in §10.

---

## 1. What We're Building

**SmartPark** is an IoT + agentic AI platform that shows **real-time individual parking spot availability** on Dubai streets. It fills the gap that Parkin leaves open: Parkin tells you which *zone* exists and lets you pay, but it never tells you which *specific spot* is free. SmartPark does.

### Why this works on Dubai streets

Every paid parking spot in Dubai is a painted rectangle on the asphalt. One spot = one sensor. No complex geometry, no cameras, no computer vision. A small light-powered ToF sensor sits inside each painted bay, detects presence, and reports status over a Thread mesh. The data flows to Alibaba Cloud, where agentic AI processes it and serves it to drivers via a mobile app and voice assistant.

### The Parkin Gap (key selling angle)

| What Parkin shows today | What SmartPark adds |
|---|---|
| Zone boundaries (colored areas on map) | Individual spot dots — green/red/amber |
| Zone pricing + payment | Real-time "3 spots free on Street 4A" |
| Zone-level "likely busy" indicator | Exact count: "7/24 spots free" |
| No voice interaction | "Hey, is there parking near my work?" |
| No predictive guidance | "Zone 124 fills up by 9:15 — park on Street 3B instead" |

SmartPark is not a Parkin competitor — it's a **Parkin enhancer**. It could be a feature inside Parkin, or a standalone app that uses Parkin's payment API.

---

## 2. Mobile Experience (Phone-First)

The app is designed **mobile-first**. The desktop website is a marketing/demo page. The actual product is a phone experience.

### Mobile App Flow

```
┌─────────────────────────────────────┐
│  [1] OPEN APP                       │
│  → Auto-detects GPS location        │
│  → Shows map with nearby zones      │
│  → Spots appear as colored dots     │
│  → Green = free, Red = taken        │
│  → Amber = reserved/leaving soon    │
│                                     │
│  [2] TAP A ZONE                     │
│  → Zooms into street view           │
│  → Shows individual spots on map    │
│  → Bottom sheet: "Zone 124 —        │
│    7/24 free · Nearest: Spot 124-08 │
│    (~40m, 1 min walk)"              │
│                                     │
│  [3] TAP A GREEN SPOT               │
│  → "Navigate to Spot 124-08"        │
│  → Opens in Apple Maps / Google     │
│    Maps / Parkin for payment         │
│  → Shows walking distance + ETA     │
│                                     │
│  [4] VOICE BUTTON (always visible)  │
│  → Floating mic button bottom-right │
│  → Tap or long-press to speak       │
│  → "Is there a free spot near my    │
│    work?"                           │
│  → Agent resolves "work" from saved │
│    places, checks zones within 500m,│
│    returns best options              │
│                                     │
│  [5] SAVED PLACES (like Maps)       │
│  → Home, Work, Gym, etc.            │
│  → "Park near Work" / "Park near    │
│    Dubai Mall"                      │
│  → Agent understands the location,  │
│    searches surrounding zones,      │
│    ranks by distance + availability │
└─────────────────────────────────────┘
```

### Key Mobile Screens

1. **Map View** (home) — full-screen map with colored dots on streets. Current location pin. Saved place markers. Floating search bar + mic button at top. Bottom sheet with nearest zone summary.

2. **Zone Detail** — street-level view showing the actual block with numbered spots. Each spot is a circle on the map overlay. Bottom sheet shows zone stats, prediction graph (next 2h), and a "Navigate" CTA for the best free spot.

3. **Spot Navigation** — after tapping a free spot: mini card with spot ID, distance, walking ETA, "Navigate" button (opens Maps), "Pay with Parkin" button (opens Parkin deep link).

4. **Voice Interface** — full-screen overlay with waveform visualization. Transcription appears in real-time. Agent response shown as a card (map snippet + text + action buttons). Can be dismissed with swipe down.

5. **Saved Places** — settings screen to add/edit Home, Work, Gym, etc. Uses native iOS/Android place picker or manual address entry. These feed into the voice agent's context.

---

## 3. Voice Agent — Conversational Parking Intelligence

This is the most important agentic feature. The voice agent is not a chatbot — it's a **context-aware parking co-pilot** that understands locations, time patterns, and zone data.

### How it works

```
User speaks: "Is there a free parking spot near my work?"
    │
    ├─→ [STT] Whisper / Paraformer v2 transcribes audio
    │
    ├─→ [NLU] Qwen-Max extracts:
    │     • Intent: find_parking
    │     • Location reference: "my work"
    │     • Implied constraint: nearest available
    │
    ├─→ [CONTEXT] Agent resolves "work":
    │     • Checks saved places → work = Dubai Internet City, Building 3
    │     • Geocodes to lat/lng
    │
    ├─→ [SEARCH] Agent queries zones within 500m radius:
    │     • Zone 312 (Street 2A): 4/18 free, 80m
    │     • Zone 314 (Street 2C): 11/24 free, 150m
    │     • Zone 315 (Street 3A): 2/16 free, 220m
    │
    ├─→ [RANK] Agent ranks by composite score:
    │     (availability × 0.4) + (proximity × 0.3) + (prediction × 0.3)
    │     Winner: Zone 314 — best balance of spots + distance
    │
    └─→ [RESPONSE] Agent speaks + shows card:
          "Yes — Zone 314 on Street 2C has 11 free spots,
           about 150 meters from your office. The closest
           free spot is number 314-09. Want me to navigate
           you there?"
```

### Voice Agent Capabilities

| Query Type | Example | What Agent Does |
|---|---|---|
| Location-based | "Parking near my work" | Resolves saved place → searches zones → ranks |
| Current location | "Any free spots around here?" | Uses GPS → shows nearest 3 zones |
| Predictive | "Will there be parking at 9am tomorrow?" | Runs prediction model for that zone + time |
| Comparative | "Which street has the most free spots?" | Aggregates across visible zones → sorts |
| Navigation | "Take me to the nearest one" | Opens maps with spot coordinates |
| Payment | "Pay for spot 124-08" | Deep-links to Parkin payment with zone + spot ID |
| Pattern | "Where do I usually park on Mondays?" | Checks historical parking data for user |

### Voice UX Details

- **Always-on mic button**: floating bottom-right, pulsing gently when zones are updating
- **Wake word** (optional): "Hey SmartPark" for hands-free (e.g., while driving into a zone)
- **Waveform visualization**: animated audio waveform during recording, morphs into response card
- **Spoken + visual response**: agent speaks the answer AND shows a map card with action buttons
- **Follow-up context**: "How about the next closest?" works without repeating the full query
- **Arabic support**: Qwen handles Arabic NLU — "وين في موقف فاضي قريب من الشغل؟"

---

## 4. Sensor Hardware (for documentation/demo purposes)

Each Dubai street parking bay is a painted rectangle, roughly 2.5m × 5m. The sensor sits at the head of the bay, ground-mounted or curb-mounted.

```
┌──────────────────────────────────────┐
│           PAINTED BAY LINE           │
│                                      │
│  ┌─────┐                             │
│  │SENSOR│   ← ToF pointing into bay  │
│  │+PV  │     Detects car presence    │
│  └──┬──┘                             │
│     │ Thread mesh                    │
│     ↓                                │
│  ┌─────────────┐                     │
│  │ ZONE GATEWAY │  ← 1 per block    │
│  │ (RPi + antenna)                  │
│  └──────┬──────┘                     │
│         │ MQTT / HTTPS               │
│         ↓                            │
│  ┌──────────────┐                    │
│  │ ALIBABA CLOUD│                    │
│  │ IoT Platform │                    │
│  └──────────────┘                    │
│                                      │
│           PAINTED BAY LINE           │
└──────────────────────────────────────┘
```

### Sensor Specs (for demo copy)

- **MCU**: ESP32-C6 (Thread/Zigbee native, RISC-V, 160MHz)
- **Detection**: VL53L1X Time-of-Flight, 4m range, ±3cm accuracy
- **Power**: Indoor PV cell (harvests sunlight on street) + supercapacitor buffer
- **Radio**: Thread mesh (IEEE 802.15.4), self-healing, 100m range between nodes
- **Sleep**: Deep sleep between detections, event-driven wake on ToF threshold change
- **BOM**: $11.40 at 1K qty (ESP32-C6 $2.20, VL53L1X $3.50, PV cell $2.80, supercap $1.40, PCB+passives $1.50)
- **Firmware**: MicroPython or ESP-IDF, edge agent runs a simple state machine (free/occupied/transitioning), sends update only on state change
- **Weather**: IP67 enclosure, -10°C to +65°C (handles Dubai summer)

---

## 5. Data Model

```
Zone
├── id: string (e.g., "312")
├── name: string (e.g., "Street 2A — DIC")
├── geojson_polygon: GeoJSON (zone boundary)
├── pricing_type: enum [A, B, C, D]  (RTA zone types)
├── price_per_hour: number
├── total_spots: number
└── created_at: timestamp

Spot
├── id: string (e.g., "312-08")
├── zone_id: FK → Zone
├── lat: number
├── lng: number
├── status: enum [free, occupied, reserved, sensor_offline]
├── last_changed_at: timestamp
├── sensor_id: string (device MAC or mesh address)
└── occupied_since: timestamp | null

Sensor
├── id: string (device identifier)
├── spot_id: FK → Spot
├── firmware_version: string
├── battery_mv: number (supercap voltage)
├── signal_rssi: number
├── last_heartbeat: timestamp
└── status: enum [online, offline, degraded]

SavedPlace (per user)
├── id: string
├── user_id: FK → User
├── label: enum [home, work, gym, custom]
├── custom_name: string | null
├── lat: number
├── lng: number
└── address: string

Prediction
├── zone_id: FK → Zone
├── timestamp: timestamp (future, 15-min intervals)
├── predicted_occupancy: number (0-100%)
├── confidence: number (0-1)
└── generated_at: timestamp

ParkEvent (for user history)
├── id: string
├── user_id: FK → User
├── spot_id: FK → Spot
├── parked_at: timestamp
├── left_at: timestamp | null
└── duration_minutes: number
```

---

## 6. Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                       │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ Mobile App   │  │ Web Dashboard│  │ Parkin API  ││
│  │ (React Native│  │ (Next.js 16) │  │ Integration ││
│  │  or PWA)     │  │              │  │             ││
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘│
│         │                  │                  │       │
└─────────┼──────────────────┼──────────────────┼───────┘
          │ WebSocket + REST │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────┐
│                  ALIBABA CLOUD                        │
│                                                       │
│  ┌─────────────────────────────────────────────┐     │
│  │              API GATEWAY (Kong / Nginx)       │     │
│  └─────────────────────┬───────────────────────┘     │
│                         │                             │
│  ┌──────────┐  ┌───────┴──────┐  ┌──────────────┐   │
│  │ IoT      │  │  Backend API │  │ Agent Engine │   │
│  │ Platform │  │  (FastAPI)   │  │ (LangGraph)  │   │
│  │          │  │              │  │              │   │
│  │ Device   │  │ /zones       │  │ Voice STT    │   │
│  │ Registry │  │ /spots       │  │ NLU (Qwen)   │   │
│  │ Shadow   │  │ /predict     │  │ Place resolve│   │
│  │ OTA      │  │ /parkin-sync │  │ Zone search  │   │
│  └────┬─────┘  └──────┬───────┘  │ Ranking      │   │
│       │               │          │ Navigation   │   │
│       │               │          └──────┬───────┘   │
│       │               │                 │           │
│       ▼               ▼                 ▼           │
│  ┌─────────────────────────────────────────────┐     │
│  │          DATA LAYER                          │     │
│  │                                               │     │
│  │  PolarDB (PostgreSQL)  ← real-time state     │     │
│  │  Redis               ← pub/sub spot updates  │     │
│  │  AnalyticDB-PG        ← historical + vector  │     │
│  │  OSS                  ← firmware binaries    │     │
│  └─────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘
          ▲
          │ MQTT over TLS
          │
┌─────────┴─────────────────────────────────────────────┐
│                  EDGE LAYER                             │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ Sensor 1 │◄──►│ Sensor 2 │◄──►│ Sensor N │  ←Thread│
│  └────┬─────┘    └──────────┘    └──────────┘   mesh  │
│       │                                               │
│       ▼                                               │
│  ┌──────────────┐                                     │
│  │ Zone Gateway │  Raspberry Pi + Thread border router│
│  │ (per block)  │  Runs zone coordinator agent        │
│  └──────────────┘                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Pages & Components to Build

### 7.1 Marketing / Demo Website (Desktop)

This is the public-facing page for the hackathon demo video.

**Route: `/`**

1. **Hero Section** — "Never Circle the Lot Again." Animated background (grid + gradient, copy from `smartpark-uae.html`). Key stats: sensors deployed, latency, search time reduction, zero grid power.

2. **The Parkin Gap** — Side-by-side comparison. Left: screenshot/mockup of Parkin showing zone-level data only. Right: SmartPark showing individual spot dots on the same street. Caption: "Parkin shows zones. SmartPark shows spots."

3. **Street Demo** (interactive) — NOT a mall layout. Show a real Dubai street grid:
   - Top-down map view of 2-3 intersecting streets
   - Each street has numbered parking bays along both sides
   - Bays are colored dots: green/red/amber
   - Simulated real-time updates (cars arriving/leaving every 2s)
   - Click a green dot → bottom sheet slides up with spot details
   - Include a "Simulate rush hour" button that fills spots progressively
   - Show a mini-map in corner with user's "saved places" markers (Work, Home)

4. **Voice Agent Demo** — Interactive voice widget:
   - Mic button that users can click
   - Uses browser `SpeechRecognition` API (or simulated if not available)
   - Shows waveform animation while "listening"
   - Agent responds with pre-built answers (same as the HTML prototype but voice-enabled)
   - Show the agent's reasoning chain: "Resolving 'work' → Dubai Internet City → Searching zones within 500m → Zone 314 has 11 spots → Ranking..."

5. **Sensor Hardware** — Visual breakdown of the $11.40 BOM. Exploded diagram or card layout.

6. **Architecture Diagram** — Animated flow from sensor → mesh → gateway → cloud → phone.

7. **Prediction Chart** — Chart.js showing predicted vs actual occupancy over 12h.

### 7.2 Mobile App Prototype (Phone-sized view on desktop)

For the demo, show a phone mockup frame on the desktop page that demonstrates the mobile experience.

**Implementation**: An iframe or a phone-shaped container (iPhone frame CSS) showing the mobile app UI.

**Mobile screens to build**:

1. **Map Home** — Full-screen map (use Mapbox GL JS or Leaflet with a Dubai tile layer). Colored dots on streets. Current location pulse. Floating search bar: "Park near..." with mic icon. Bottom card: nearest zone summary.

2. **Zone Detail** — Tap a zone → zoom in. Street-level view with individual spots as circles. Bottom sheet: zone stats, mini prediction chart, "Navigate" button.

3. **Voice Overlay** — Tap mic → full-screen overlay with waveform. Real-time transcription. Response card with map snippet + action buttons. Swipe down to dismiss.

4. **Saved Places** — Simple list: Home, Work, Gym, + Add New. Each with address and a "Find parking near here" button.

### 7.3 Backend API

**Framework**: FastAPI (Python 3.11+)

**Endpoints**:

```
GET  /api/zones                    → List all zones (with geojson + stats)
GET  /api/zones/{id}               → Single zone with all spots
GET  /api/zones/nearby?lat=&lng=&radius=  → Zones within radius
GET  /api/spots/{id}               → Single spot status
GET  /api/predict/{zone_id}        → Predicted occupancy next 12h
POST /api/agent/voice              → Send audio → get agent response
POST /api/agent/text               → Send text → get agent response
GET  /api/places                   → User's saved places
POST /api/places                   → Add a saved place
DELETE /api/places/{id}            → Remove a saved place
GET  /api/sensors                  → Sensor fleet health (dashboard)
WS   /ws/spots                     → Real-time spot status updates
```

### 7.4 Simulation Engine (for demo without real hardware)

Since there's no physical hardware for the hackathon, build a **realistic simulator**:

```python
# simulator.py — runs as a background task
import asyncio, random
from datetime import datetime

class ParkingSimulator:
    """Simulates sensor updates for a realistic Dubai street zone."""

    def __init__(self, zones):
        self.zones = zones
        # Morning rush: 7-10am fills up. Lunch dip: 12-1pm frees some.
        # Evening rush: 5-8pm fills up. Night: mostly free.
        self.hour_profiles = {
            0: 0.15, 1: 0.10, 2: 0.08, 3: 0.08, 4: 0.10, 5: 0.15,
            6: 0.25, 7: 0.45, 8: 0.70, 9: 0.85, 10: 0.80, 11: 0.75,
            12: 0.65, 13: 0.70, 14: 0.75, 15: 0.78, 16: 0.80,
            17: 0.88, 18: 0.92, 19: 0.85, 20: 0.70, 21: 0.50,
            22: 0.35, 23: 0.20
        }

    async def run(self):
        while True:
            hour = datetime.now().hour
            target_occupancy = self.hour_profiles[hour]
            for zone in self.zones:
                for spot in zone.spots:
                    current = 1 if spot.status == 'occupied' else 0
                    # Probabilistic transition toward target
                    if current == 0 and random.random() < target_occupancy * 0.1:
                        spot.status = 'occupied'
                        spot.occupied_since = datetime.now()
                    elif current == 1 and random.random() < (1 - target_occupancy) * 0.15:
                        spot.status = 'free'
                        spot.occupied_since = None
                    await self.publish_update(spot)
            await asyncio.sleep(2)  # tick every 2 seconds
```

---

## 8. The Agentic Layer (LangGraph)

This is the core AI. Four agents orchestrated via LangGraph:

```
┌─────────────────────────────────────────────┐
│              LANGGRAPH ORCHESTRATOR           │
│                                               │
│  User Input (voice/text)                      │
│       │                                       │
│       ▼                                       │
│  ┌──────────┐    ┌──────────────┐            │
│  │ NLU Agent│───►│ Place Resolver│            │
│  │ (Qwen-Max│    │ "work" →     │            │
│  │  extract │    │ lat/lng from │            │
│  │  intent +│    │ saved places │            │
│  │  entities│    └──────┬───────┘            │
│  └──────────┘           │                     │
│                         ▼                     │
│  ┌──────────────────────────────────┐        │
│  │ Zone Search Agent                │        │
│  │ • Query zones within 500m        │        │
│  │ • Get real-time spot counts      │        │
│  │ • Get prediction data            │        │
│  └──────────────┬───────────────────┘        │
│                 │                             │
│                 ▼                             │
│  ┌──────────────────────────────────┐        │
│  │ Ranking Agent                    │        │
│  │ • Score = 0.4×avail +            │        │
│  │           0.3×proximity +        │        │
│  │           0.3×prediction         │        │
│  │ • Select best spot per zone      │        │
│  │ • Generate navigation-ready      │        │
│  │   response with map coordinates  │        │
│  └──────────────┬───────────────────┘        │
│                 │                             │
│                 ▼                             │
│  ┌──────────────────────────────────┐        │
│  │ Response Generator               │        │
│  │ • Natural language answer        │        │
│  │ • Map card data (spots, coords)  │        │
│  │ • Action buttons (navigate, pay) │        │
│  │ • TTS audio (CosyVoice / Edge)  │        │
│  └──────────────────────────────────┘        │
└─────────────────────────────────────────────┘
```

### Agent Prompts (for Qwen-Max)

**NLU Agent system prompt**:
```
You are the SmartPark NLU agent. Extract intent and entities from user queries about parking.

Intents: find_parking, navigate, pay, predict, compare, history
Entities: location_ref (saved place name or address), zone_id, spot_id, time_ref

Saved places context:
{user_saved_places}

Current GPS location: {lat}, {lng}
Current time: {iso_timestamp}

Return JSON: { "intent": "...", "entities": {...}, "resolved_location": { "lat": ..., "lng": ..., "label": "..." } }
```

**Ranking Agent system prompt**:
```
You are the SmartPark ranking agent. Given zone search results, rank them and recommend the best parking option.

Scoring formula:
- availability_score = free_spots / total_spots
- proximity_score = 1 - (distance_m / max_distance_m)
- prediction_score = 1 - predicted_occupancy_in_30min

composite = 0.4 * availability + 0.3 * proximity + 0.3 * prediction

Return: ranked list with explanation, best spot ID, walking distance, and a natural language summary.
```

---

## 9. Tech Stack Summary

| Layer | Technology | Notes |
|---|---|---|
| Frontend (web) | Next.js 16, React 19, Tailwind CSS 4, Mapbox GL JS | Marketing site + demo |
| Frontend (mobile) | React Native or PWA | Phone-first product |
| Map | Mapbox GL JS (web) / Mapbox Mobile SDK | Dubai street tiles, custom markers |
| Backend | FastAPI, Python 3.11+ | REST + WebSocket |
| AI/LLM | Qwen-Max (NLU + ranking), Paraformer v2 (STT), CosyVoice (TTS) | Via DashScope API |
| Agent Framework | LangGraph | 4-agent orchestration |
| Database | PolarDB (PostgreSQL) | Real-time spot state |
| Cache/Pubsub | Redis | WebSocket fan-out for live updates |
| Analytics | AnalyticDB-PG | Historical patterns + vector search |
| IoT | Alibaba Cloud IoT Platform | Device registry, shadow, OTA |
| Storage | Alibaba Cloud OSS | Firmware binaries, audio recordings |
| Deployment | Alibaba Cloud ECS + Docker | Single container for hackathon |
| Voice (browser) | Web Speech API (`SpeechRecognition`) | Fallback for demo |

---

## 10. Design System (from prototype)

```css
/* Colors */
--bg-0: #04060b;          /* Deepest background */
--bg-1: #0a0e1a;          /* Main background */
--bg-2: #0f1629;          /* Card surfaces */
--bg-3: #151d33;          /* Elevated elements */
--cyan: #00e5a0;          /* Primary accent (free spots, CTAs) */
--blue: #3b82f6;          /* Secondary (info, links) */
--amber: #f59e0b;         /* Warning (reserved, moderate) */
--red: #ef4444;           /* Error (occupied, full) */
--purple: #a855f7;        /* AI/Prediction accent */
--text-1: #f1f5f9;        /* Primary text */
--text-2: #94a3b8;        /* Secondary text */
--text-3: #64748b;        /* Tertiary/muted text */

/* Typography */
Font: Inter (400, 500, 600, 700, 800, 900)
Mono: JetBrains Mono (400, 500)

/* Spots on map */
Free spot:     fill #00e5a0 at 20% opacity, stroke #00e5a0 at 40%
Occupied spot: fill #ef4444 at 10% opacity, stroke #ef4444 at 20%
Reserved:      fill #f59e0b at 10% opacity, stroke #f59e0b at 20%
Hover glow:    box-shadow 0 0 16px at 20% of spot color

/* Border radius */
Cards: 16px    Inputs: 10px    Badges: 20px    Small: 6px

/* Animations */
Spot change: scale 1→1.15→1 over 0.5s
Pulse dot: opacity 1→0.4→1 over 2s
Message in: translateY(8px)→0 + opacity 0→1 over 0.3s
```

---

## 11. Phased Implementation — Prompts for Qoder

### Phase 1: Project Setup + Data Layer
```
Set up the SmartPark UAE project. Create a Next.js 16 project with the following structure:

/src
  /app              — Next.js app router pages
  /components       — React components
  /lib              — Utilities, API client, types
  /data             — Static seed data (zones, spots)
/public             — Static assets

Tech: Next.js 16, React 19, TypeScript, Tailwind CSS 4.

Design system: dark theme with these tokens:
- bg: #04060b / #0a0e1a / #0f1629 / #151d33
- accent: #00e5a0 (primary), #3b82f6 (info), #f59e0b (warn), #ef4444 (error), #a855f7 (AI)
- font: Inter, JetBrains Mono
- border-radius: cards 16px, inputs 10px, badges 20px

Create a seed data file /data/dubai-streets.ts with 3 realistic Dubai street zones:
- Zone 312: "Street 2A — Dubai Internet City" — 18 spots along one side
- Zone 314: "Street 2C — Dubai Internet City" — 24 spots along both sides
- Zone 315: "Street 3A — near DIC Metro" — 16 spots

Each spot needs: id, zone_id, lat, lng (use real DIC coordinates around 25.0920, 55.1600), status (free/occupied/reserved), last_changed_at.
Distribute initial status: ~35% free, ~55% occupied, ~10% reserved.

Also create TypeScript interfaces for Zone, Spot, SavedPlace, AgentResponse.
```

### Phase 2: Street Map + Spot Visualization
```
Build the interactive street parking map component.

Use Mapbox GL JS (free tier, use a public style URL or a dark map style).
If Mapbox requires a token, use a fallback: Leaflet.js with a dark tile provider
(Stadia Maps dark or CartoDB dark).

Create <StreetMap /> component:
- Full-screen map centered on Dubai Internet City (25.092, 55.160)
- Render each spot as a circle marker (radius 8px) colored by status:
  free=#00e5a0, occupied=#ef4444, reserved=#f59e0b
- On hover: show tooltip with spot ID + zone name
- On click: select spot, show bottom sheet with details
- Show zone boundaries as semi-transparent polygons
- Current location: pulsing blue dot
- Saved places: star markers with labels (Work, Home)
- Add a "Simulate" toggle that runs the spot status randomizer every 2 seconds
  (weighted by time-of-day: morning rush fills up, midday dips, evening fills again)

Bottom sheet component <SpotDetail />:
- Spot ID, zone name, status
- Walking distance from current location
- "Navigate" button → opens maps:// URL
- "Pay with Parkin" button → mock Parkin deep link

Include a floating search bar at top: "Park near..." with a mic icon button.
```

### Phase 3: Voice Agent Interface
```
Build the voice-enabled parking agent interface.

Create <VoiceAgent /> component — a floating overlay that can be toggled with a mic button.

States:
1. IDLE — mic button visible, pulsing gently
2. LISTENING — full-screen overlay with animated waveform, real-time transcription
3. THINKING — waveform morphs into loading dots, show "agent reasoning" steps
4. RESPONDING — card appears with text + map snippet + action buttons

Implementation:
- Use Web Speech API (SpeechRecognition) for STT in the browser
- If SpeechRecognition unavailable, show a text input fallback
- For the demo, use pre-built response matching (intent → response template)
- Show the agent's reasoning chain visually:
  "Resolving 'work' → Dubai Internet City"
  "Searching zones within 500m..."
  "Zone 314: 11/24 free (150m)"
  "Zone 312: 4/18 free (80m)"
  "Ranking → Zone 314 recommended"
  Then speak the final answer.

Pre-built responses for demo:
- "parking near my work" → resolve "work" from saved places, show best zone
- "any free spots around here?" → use GPS, show nearest 3 zones
- "when is peak hour?" → show time-of-day prediction chart
- "which street has the most spots?" → compare visible zones
- "navigate to the nearest one" → open maps URL
- "where do I usually park on mondays?" → show mock history

Use SpeechSynthesis API for TTS response (or Edge TTS if building a backend).

The overlay should be dismissable with swipe down or ESC key.
```

### Phase 4: Saved Places + Location Awareness
```
Build the saved places feature.

Create <SavedPlaces /> component — a slide-up panel or separate route.

Default saved places (pre-seeded for demo):
- Home: Dubai Marina, Marina Pinnacle Tower (25.0800, 55.1400)
- Work: Dubai Internet City, Building 3 (25.0920, 55.1600)
- Gym: Dubai Media City, Fitness First (25.0950, 55.1550)

Features:
- List view with label, address, and "Find parking near here" button
- Add new place: opens a search/picker (can use a text input + geocoding, or a mock picker)
- Edit/delete existing places
- Each place shows a small indicator: "X free spots nearby" (computed from zone data)

Integration with voice agent:
- When user says "parking near my work", the agent checks saved places for label="work"
- Resolves to lat/lng, searches zones within 500m radius
- Returns ranked results with walking distances

The map should show saved place markers with small icons (house, briefcase, dumbbell).
```

### Phase 5: Prediction + Analytics
```
Build the prediction and analytics components.

1. <PredictionChart /> — Chart.js line chart showing:
   - X-axis: next 12 hours in 1-hour intervals
   - Y-axis: predicted occupancy %
   - Two lines: "Actual" (solid cyan, only for past hours) and "Predicted" (dashed purple)
   - Use realistic data based on the time-of-day profile from the simulator
   - Shade the "peak" zone (>80%) in red

2. <ZoneComparison /> — horizontal bar chart or card grid:
   - All visible zones ranked by availability
   - Each shows: zone name, free/total, occupancy %, trend arrow (up/down)
   - Color-coded: green >50% free, amber 20-50%, red <20%

3. <ParkinIntegration /> — a mock panel showing:
   - "This zone in Parkin: Zone 312 — AED 4/hr"
   - SmartPark adds: "7/18 spots free · Nearest: Spot 312-05 (~30m)"
   - "Pay with Parkin" button (mock)

Include a "Predict next 2 hours" card that shows:
   Current occupancy → predicted in 30min → 1h → 2h
   With confidence scores
```

### Phase 6: Full Landing Page Assembly
```
Assemble the full marketing/demo landing page.

Structure (single-page scroll, mobile-responsive):

1. NAV — fixed top, glassmorphism, logo + links + "EdgeAgent 2026" badge
2. HERO — "Never Circle the Lot Again." with animated grid background, stats row
3. THE GAP — Parkin vs SmartPark comparison (side-by-side mockups or cards)
4. STREET DEMO — The interactive street map (from Phase 2) in a browser-chrome frame
5. VOICE AGENT — The voice widget (Phase 3) shown inside a phone frame mockup
6. SAVED PLACES — Show the saved places UI inside a phone frame, explain the "park near my work" flow
7. SENSORS — Hardware specs grid ($11.40 BOM, 5yr battery, IP67, Thread mesh)
8. ARCHITECTURE — Flow diagram: sensor → mesh → gateway → Alibaba Cloud → phone
9. PREDICTION — Chart.js prediction chart (Phase 5)
10. TECH STACK — Alibaba Cloud products used (IoT Platform, Qwen, PolarDB, etc.)
11. FOOTER — "Built for Qwen Cloud Challenge · EdgeAgent Track 2026"

Reference the existing prototype at smartpark-uae.html for exact design patterns,
animations, and color usage. Match the visual quality exactly.

Use scroll-triggered fade-in animations (IntersectionObserver).
Mobile responsive: stack sections, full-width map, touch-friendly voice button.
```

### Phase 7: Backend + Real-Time Updates
```
Build the FastAPI backend with real-time WebSocket updates.

Structure:
/backend
  main.py          — FastAPI app, CORS, lifespan
  /routers
    zones.py       — GET /zones, GET /zones/{id}, GET /zones/nearby
    spots.py       — GET /spots/{id}
    predict.py     — GET /predict/{zone_id}
    agent.py       — POST /agent/voice, POST /agent/text
    places.py      — CRUD for saved places
  /services
    simulator.py   — ParkingSimulator (background task, realistic time-of-day profile)
    agent.py       — LangGraph agent orchestrator
    prediction.py  — Simple moving-average prediction model
  /models
    schemas.py     — Pydantic models
    database.py    — SQLAlchemy + async engine

Real-time:
- WebSocket endpoint /ws/spots broadcasts status changes every 2s
- Frontend connects via WebSocket, updates map markers in real-time
- Use Redis pub/sub if scaling, or simple in-memory broadcast for demo

Simulator:
- Runs as FastAPI background task on startup
- Time-of-day occupancy profile (see §7.4 in spec)
- Probabilistic transitions: spots fill during rush hours, free up during off-peak
- Publishes state changes to WebSocket subscribers

For the hackathon demo, use SQLite (aiosqlite) instead of PolarDB for simplicity.
The data layer interface should be clean enough to swap to PostgreSQL later.

Deploy as a single Docker container: FastAPI + Next.js (via next start) behind Nginx.
```

---

## 12. Demo Video Script (5 min)

For the hackathon submission, record a 5-minute video:

1. (0:00-0:30) Problem: drone footage of cars circling for parking in Dubai. "30% of urban traffic is people looking for parking."
2. (0:30-1:00) Solution: SmartPark overview. Light-powered sensors → edge AI → your phone. Show the hardware diagram.
3. (1:00-2:30) Live demo: open the web app. Show the street map with real-time dots. Click a spot. Show zone detail. Hit "Simulate rush hour" — watch spots fill up.
4. (2:30-3:30) Voice agent demo: tap mic, say "Is there a free parking spot near my work?" Show the agent reasoning chain + response. Tap "Navigate."
5. (3:30-4:15) Parkin integration: show how SmartPark enhances Parkin. "Parkin shows zones. SmartPark shows spots."
6. (4:15-4:45) Architecture: animated diagram. Mention Alibaba Cloud products: IoT Platform, Qwen-Max, PolarDB, Redis.
7. (4:45-5:00) Closing: "SmartPark — never circle the lot again." GitHub link.

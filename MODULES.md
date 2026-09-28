# SpotSense — Modular Capability Map ("Parkin Map 360" schema)

Principle: **one module = one type of connection to the parking world.**
Each module has its own data source, its own contract, and can be sold
standalone (full or modular packages). The AI layer fuses them all.

Status legend: ✅ built & working · 🟡 built as demo/simulator · ⛔ planned (not in code yet)

---

## Mind-map tree (copy straight into FigJam)

```
SPOTSENSE 360
│  AI layer that connects to ANY parking system and fuses data
│  from every available source — full or modular delivery
│
├── 1. VISION AI — camera occupancy module            ✅
│   ├── Live feed analysis (RTSP / webcam / uploaded clip)
│   ├── Detects parking bays (YOLO + painted-bay geometry, /train console)
│   ├── Detects type of car
│   ├── Shows free vs busy bays in real time
│   ├── Bay labelling & region calibration UI (/cameras page)
│   ├── Detection event log (per camera, per bay)
│   └── Open /ingest API — third-party vision systems feed us events
│
├── 2. SENSOR DEVICE — IoT occupancy module           🟡
│   ├── Data gathering is the product; installation is an add-on
│   ├── Per-bay presence (mmWave / ToF), one sensor = one painted bay
│   ├── Fleet health: battery, signal (RSSI), firmware, heartbeat
│   ├── Sensor fleet dashboard (GET /api/sensors)
│   └── Simulator as demo data source until hardware ships
│
├── 3. GATE / ANPR — entry-exit duration module       ⛔
│   ├── Zone cameras scan plate at entry and at exit
│   ├── Produces verified park duration per vehicle (ParkEvent)
│   ├── Cross-checks Vision/Sensor occupancy vs paid time
│   └── Feeds enforcement (overstay) and billing (exact charge)
│
├── 4. PAYMENT & WALLET module                         🟡
│   ├── Parkin payment system integration (full or modular)
│   ├── Auto-charge on exit: session priced at bay rate (AED/hr)
│   ├── Driver wallet + payment demo flow
│   ├── Offline/online payment gateway support
│   └── Duration source: gate ANPR (3) or occupancy sensors (1,2)
│
├── 5. ENFORCEMENT module                              🟡
│   ├── Flags occupied-but-unpaid bays automatically
│   ├── Qwen Max AI arbitration before a violation is issued
│   ├── Patrol officer mode (iOS app + web enforcement console)
│   └── Directs officers to flagged cars instead of blind sweeps
│
├── 6. AI AGENT & RECOMMENDATION module                ✅
│   ├── Voice + text agent (driver queries, officer queries)
│   ├── Optimal-spot recommendation (POST /api/recommend/optimal-spot)
│   ├── Saved-place-aware search (home/work → best bay)
│   ├── Qwen Cloud reasoning with visible reasoning steps
│   └── Returns map cards the client can navigate to
│
├── 7. PREDICTION & ANALYTICS module                   🟡
│   ├── Occupancy forecast per zone (GET /api/predict/{zone})
│   ├── Historical demand curves + confidence scores
│   └── Analytics dashboard (frontend /analytics)
│
├── 8. LIVE MAP & CORE PLATFORM module                 ✅
│   ├── Zones with GeoJSON polygons, pricing, totals
│   ├── Bay-level spot state machine (free/occupied/reserved/offline)
│   ├── Real-time WebSocket broadcast (/ws/spots, ~2s)
│   └── ParkEvent history (parked_at / left_at / duration)
│
└── 9. DRIVER APP & NAVIGATION module                  ✅
    ├── iOS native app (SwiftUI) + web driver view
    ├── Geofence entry/exit alerts (auto-prompt on arrival)
    ├── Turn-by-turn navigation to the chosen bay
    ├── Approaching banner + saved places
    └── Offline fallback (on-device simulator + local agent)
```

---

## How the modules connect (data flow for the schema arrows)

```
[1 Vision AI] ──┐
[2 Sensors]  ────┼──► [8 Live Map / core state] ──► [6 AI Agent] ──► [9 Driver App]
[3 Gate ANPR] ───┤                │                        │
                 │                ▼                        ▼
                 ├──────► [4 Payment/Wallet] ◄───── [5 Enforcement]
                 │                │
                 └──────► [7 Prediction/Analytics] ◄┘
```

- Modules 1, 2, 3 are **sensors of truth** (three independent ways to know a
  bay is occupied). Any one alone is deployable; together they cross-validate.
- Module 8 is the **bus**: every module writes spot state / events into it,
  every other module reads from it.
- Modules 4, 5 are the **money branches** — billing uses duration, enforcement
  uses duration × payment status.
- Modules 6, 7, 9 are the **experience branches** — what the driver and the
  operator actually see.

## Suggested mind-map colour coding (matching your current canvas)

| Colour | Meaning | Modules |
|---|---|---|
| Blue (root) | Product definition | SpotSense 360 |
| Yellow | Vision / AI reasoning | 1, 6, 7 |
| Green | Physical data sources | 2, 3 |
| Red/Pink | Money | 4, 5 |
| Purple | Experience & platform | 8, 9 |

## Gap note (for the "modular package" pitch)

Only module **3 (Gate/ANPR)** is not yet in the codebase — everything else
already exists as working code or a demo. The `ParkEvent` model
(`parked_at / left_at / duration_minutes`) and the `/ingest` vision API are
the exact seams where ANPR plugs in without touching the other modules.

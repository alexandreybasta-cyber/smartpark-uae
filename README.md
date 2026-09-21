# SpotSense

**AI-powered smart parking for Dubai — bay-level availability, navigation, and automated enforcement, powered by edge sensors and Qwen Cloud.**

[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

- **Demo video:** [Coming soon — will be added before submission]
- **Live demo:** [Coming soon — will be added before submission]

## Problem & Solution

Drivers waste time circling the block for a free spot, and authorities run blind
ANPR camera-car sweeps to find unpaid vehicles. Zone-level parking apps
show which *zone* exists and let you pay, but never which *specific bay* is free —
or which parked car is in violation.

**SpotSense** puts one sensor in each painted bay (no cameras, no computer
vision) and fuses that live data with **Qwen Cloud reasoning** to:

- send drivers **straight to a free bay** instead of circling, and
- send enforcement officers **straight to a flagged unpaid vehicle** instead of
  sweeping blindly.

## Key Features

- **Real-time parking map** — live bay-level status (free / occupied / reserved)
  over WebSockets.
- **Automated enforcement** — occupied-but-unpaid bays past a grace period are
  flagged for patrol officers.
- **Navigation** — route to the nearest free bay with walking distance/ETA.
- **Predictive analytics** — time-of-day occupancy forecasts and zone comparison.
- **Voice / agent assistant** — conversational parking co-pilot for drivers and
  enforcement officers.

## Qwen Cloud (DashScope) Integration

The live Qwen Cloud call is implemented in the native iOS app — this is the
**proof of Qwen Cloud / Alibaba Cloud usage**:

➡️ **[`ios/SmartPark/SmartPark/Services/QwenAgentService.swift`](ios/SmartPark/SmartPark/Services/QwenAgentService.swift)**

- Endpoint: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Model: `qwen-plus`
- Driver-mode and enforcement-mode queries with live context; API key read from
  `ios/SmartPark/Secrets.xcconfig` (git-ignored).

The backend and web dashboard use a deterministic reasoning engine so the demo
works with **no API key and no hardware**.

## Architecture

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full system diagram, data
flow, tech stack, and roadmap.

## Quick Start

```bash
./start.sh
```

This runs the **backend on :8000** and the **frontend on :3000** using
**simulated sensor data — no hardware needed**.

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:8000        |
| API Docs  | http://localhost:8000/docs   |

### Prerequisites

- **Python 3.11+** with a virtual environment and backend deps
  (`cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt`).
- **Node.js 20+** for the frontend (`cd frontend && npm install`).

### iOS app (optional)

The native iOS app needs a DashScope API key. Copy the example config and add
your key:

```bash
cp ios/SmartPark/Secrets.xcconfig.example ios/SmartPark/Secrets.xcconfig
# then set QWEN_API_KEY in Secrets.xcconfig (git-ignored)
```

## Repository Layout

```
.
├── backend/            FastAPI + SQLite + WebSocket, sensor simulator
├── frontend/           Next.js 16 web dashboard
├── mobile/             Expo (React Native) app
├── ios/                Native SwiftUI app (Qwen Cloud integration)
└── Website/spotsense/  Static marketing site
```

## Hackathon

Built for the **Global AI Hackathon with Qwen Cloud — Track 5: EdgeAgent**.

Required submission artifacts:

- Public GitHub repository (this repo).
- Demo video — [Coming soon — will be added before submission].
- Live demo — [Coming soon — will be added before submission].
- Proof of Qwen Cloud usage:
  [`ios/SmartPark/SmartPark/Services/QwenAgentService.swift`](ios/SmartPark/SmartPark/Services/QwenAgentService.swift).

## Testing for Judges

1. Run `./start.sh` (starts backend :8000 + frontend :3000 on simulated data).
2. Open http://localhost:3000 and watch bays update live on the map.
3. Open http://localhost:8000/docs to explore the API and the `/ws/spots`
   WebSocket.
4. (Optional) Build the iOS app in Xcode with a DashScope key in
   `ios/SmartPark/Secrets.xcconfig` to see the live Qwen Cloud agent.

No physical sensors are required — data is simulated via `backend/simulator.py`.

## Testing

### Web App (easiest)
Open https://spotsense.app/ in any browser. The full demo runs on simulated sensor data with no setup required.

### Backend API
```bash
./start.sh
```
The API runs at http://localhost:8000. WebSocket updates stream at ws://localhost:8000/ws/spots.

### iOS App (requires Xcode + macOS)
1. Clone the repo
2. Open `ios/SmartPark/SmartPark.xcodeproj` in Xcode
3. Create `ios/SmartPark/Secrets.xcconfig` (see `Secrets.xcconfig.example` for the format):
   ```
   QWEN_API_KEY = your_dashscope_api_key
   QODER_AGENT_API_KEY = your_qoder_agent_key
   SMARTPARK_API_BASE_URL = http://localhost:8000
   ```
4. Start the backend: `./start.sh`
5. Build and run in Xcode Simulator or on a connected device

The web demo uses a deterministic agent fallback. The iOS app connects to Qwen Cloud (DashScope qwen-plus) for natural language queries.

## License

Released under the [MIT License](LICENSE).

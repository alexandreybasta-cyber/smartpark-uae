# SmartPark UAE

AI-powered smart parking for UAE. Real-time spot availability, predictive occupancy, and intelligent navigation across Dubai Internet City.

## Quick Start

```bash
chmod +x start.sh
./start.sh
```

This starts both backend (port 8000) and frontend (port 3000).

## Manual Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python seed.py          # seed the database
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### iOS App (Expo)

```bash
cd mobile
npm install
npx expo start
```

Install **Expo Go** from the App Store on your iPhone, make sure the phone is on
the same Wi-Fi as this machine, and scan the QR code in the terminal. The app
auto-discovers the backend on port 8000 of the dev machine (start it first).
If the backend is unreachable, the app switches to an on-device offline demo
(amber "OFFLINE DEMO" badge) so the demo never breaks.

## URLs

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000         |
| Backend   | http://localhost:8000         |
| API Docs  | http://localhost:8000/docs    |

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, Leaflet maps
- **iOS App**: Expo (React Native), Apple Maps, live WebSocket updates, TTS
- **Backend**: FastAPI, SQLite, WebSockets
- **AI**: Agentic voice assistant, predictive occupancy ML
- **Hardware**: Solar-powered IoT sensors (ESP32 + VL53L1X)

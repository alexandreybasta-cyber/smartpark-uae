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

## URLs

| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000         |
| Backend   | http://localhost:8000         |
| API Docs  | http://localhost:8000/docs    |

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Leaflet maps
- **Backend**: FastAPI, SQLite, WebSockets
- **AI**: Agentic voice assistant, predictive occupancy ML
- **Hardware**: Solar-powered IoT sensors (ESP32 + VL53L1X)

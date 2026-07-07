#!/bin/bash
# Start SpotSense - Backend + Frontend
echo "Starting SpotSense..."

# Start backend
cd backend
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend started on http://localhost:8000 (PID: $BACKEND_PID)"

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend started on http://localhost:3000 (PID: $FRONTEND_PID)"

echo ""
echo "SpotSense is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
wait

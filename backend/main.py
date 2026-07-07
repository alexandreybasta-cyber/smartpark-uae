import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from seed import seed_database
from simulator import run_simulator
from ws import manager, websocket_endpoint
from routers import zones, spots, predict, agent_router, places, sensors


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: init DB, seed data, start simulator."""
    # Startup
    await init_db()
    await seed_database()

    # Start simulator background task
    simulator_task = asyncio.create_task(run_simulator(manager.broadcast))

    yield

    # Shutdown
    simulator_task.cancel()
    try:
        await simulator_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="SpotSense UAE API",
    description="AI-powered smart parking management for Dubai Internet City",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS: allow all origins for demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(zones.router)
app.include_router(spots.router)
app.include_router(predict.router)
app.include_router(agent_router.router)
app.include_router(places.router)
app.include_router(sensors.router)

# WebSocket endpoint
app.websocket("/ws/spots")(websocket_endpoint)


@app.get("/")
async def root():
    return {"message": "SpotSense UAE API", "version": "1.0.0", "status": "running"}

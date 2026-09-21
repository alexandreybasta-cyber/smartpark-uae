import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from seed import seed_database
from simulator import run_simulator
from vision.worker import init_registry
from ws import manager, websocket_endpoint
from routers import zones, spots, predict, agent_router, places, sensors, recommend, vision


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: init DB, seed data, start simulator + vision."""
    # Startup
    await init_db()
    await seed_database()

    # Vision registry (camera analysis workers) - routers reach it via
    # vision.worker.registry.
    app.state.vision = init_registry(manager.broadcast)

    # Start simulator background task
    simulator_task = asyncio.create_task(run_simulator(manager.broadcast))

    yield

    # Shutdown
    simulator_task.cancel()
    try:
        await simulator_task
    except asyncio.CancelledError:
        pass
    await app.state.vision.stop_all()


app = FastAPI(
    title="SpotSense UAE API",
    description="AI-powered smart parking management for Dubai Internet City",
    version="1.0.0",
    lifespan=lifespan,
)

# HACKATHON DEMO: CORS is intentionally permissive for open accessibility.
# Production deployments should restrict allow_origins to known frontend domains.
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
app.include_router(recommend.router)
app.include_router(vision.router)

# WebSocket endpoint
app.websocket("/ws/spots")(websocket_endpoint)


@app.get("/")
async def root():
    return {"message": "SpotSense UAE API", "version": "1.0.0", "status": "running"}

from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# Zone schemas
class SpotOut(BaseModel):
    id: str
    zone_id: int
    lat: float
    lng: float
    status: str
    last_changed_at: Optional[datetime] = None
    sensor_id: Optional[str] = None
    occupied_since: Optional[datetime] = None

    class Config:
        from_attributes = True


class ZoneOut(BaseModel):
    id: int
    name: str
    geojson_polygon: Optional[str] = None
    pricing_type: str
    price_per_hour: float
    total_spots: int
    created_at: Optional[datetime] = None
    free_count: int = 0
    occupied_count: int = 0
    reserved_count: int = 0

    class Config:
        from_attributes = True


class ZoneDetailOut(ZoneOut):
    spots: List[SpotOut] = []

    class Config:
        from_attributes = True


# Sensor schemas
class SensorOut(BaseModel):
    id: str
    spot_id: str
    firmware_version: str
    battery_mv: int
    signal_rssi: int
    last_heartbeat: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True


class SensorFleetSummary(BaseModel):
    total: int
    online: int
    offline: int
    low_battery: int


# Spot detail
class SpotDetailOut(SpotOut):
    sensor: Optional[SensorOut] = None

    class Config:
        from_attributes = True


# Prediction schemas
class PredictionOut(BaseModel):
    timestamp: datetime
    predicted_occupancy: float
    confidence: float

    class Config:
        from_attributes = True


# Agent schemas
class AgentTextRequest(BaseModel):
    text: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class MapCard(BaseModel):
    zone_id: Optional[int] = None
    zone_name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    free_spots: Optional[int] = None
    total_spots: Optional[int] = None
    price_per_hour: Optional[float] = None
    walking_minutes: Optional[int] = None


class AgentTextResponse(BaseModel):
    text: str
    reasoning_steps: List[str] = []
    map_card: Optional[MapCard] = None


# Places schemas
class SavedPlaceCreate(BaseModel):
    label: str
    custom_name: Optional[str] = None
    lat: float
    lng: float
    address: Optional[str] = None


class SavedPlaceOut(BaseModel):
    id: int
    user_id: str
    label: str
    custom_name: Optional[str] = None
    lat: float
    lng: float
    address: Optional[str] = None

    class Config:
        from_attributes = True


# Recommend schemas
class RecommendRequest(BaseModel):
    destination_lat: float
    destination_lng: float
    saved_place_lat: Optional[float] = None
    saved_place_lng: Optional[float] = None
    user_lat: float
    user_lng: float


class RecommendResponse(BaseModel):
    spot_id: str
    spot_lat: float
    spot_lng: float
    spot_name: str
    zone_name: str
    walking_distance_meters: int
    score: float
    time_free_seconds: int

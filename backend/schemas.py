from pydantic import BaseModel, Field
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
    detection_source: str = "simulated"

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
    text: str = Field(..., min_length=1, max_length=500)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)


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
    label: str = Field(..., min_length=1, max_length=500)
    custom_name: Optional[str] = Field(default=None, max_length=500)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    address: Optional[str] = Field(default=None, max_length=500)


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
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lng: float = Field(..., ge=-180, le=180)
    saved_place_lat: Optional[float] = Field(default=None, ge=-90, le=90)
    saved_place_lng: Optional[float] = Field(default=None, ge=-180, le=180)
    user_lat: float = Field(..., ge=-90, le=90)
    user_lng: float = Field(..., ge=-180, le=180)


class RecommendResponse(BaseModel):
    spot_id: str
    spot_lat: float
    spot_lng: float
    spot_name: str
    zone_name: str
    walking_distance_meters: int
    score: float
    time_free_seconds: int


# ---------------------------------------------------------------------------
# Vision (camera-based occupancy detection) schemas
# ---------------------------------------------------------------------------
class CameraCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    source_type: str = Field(default="rtsp")  # rtsp | file | webcam | snapshot
    source_url: Optional[str] = Field(default=None, max_length=500)
    webcam_index: Optional[int] = None
    fps_target: float = Field(default=2.0, ge=0.1, le=30.0)


class CameraUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    source_type: Optional[str] = None
    source_url: Optional[str] = Field(default=None, max_length=500)
    webcam_index: Optional[int] = None
    fps_target: Optional[float] = Field(default=None, ge=0.1, le=30.0)


class RegionOut(BaseModel):
    id: int
    camera_id: int
    spot_id: Optional[str] = None
    label: Optional[str] = None
    polygon: List[List[float]]
    status: str
    confidence: float
    occupy_threshold: float
    free_threshold: float
    last_updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CameraOut(BaseModel):
    id: int
    name: str
    source_type: str
    source_url: Optional[str] = None
    webcam_index: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    fps_target: float
    width: Optional[int] = None
    height: Optional[int] = None
    last_frame_at: Optional[datetime] = None
    frames_analysed: int = 0
    created_at: Optional[datetime] = None
    regions: List[RegionOut] = []

    class Config:
        from_attributes = True


class RegionCreate(BaseModel):
    label: Optional[str] = Field(default=None, max_length=100)
    # Normalised 0..1 frame coordinates, at least 3 points.
    polygon: List[List[float]] = Field(..., min_length=3)
    spot_id: Optional[str] = None
    occupy_threshold: float = Field(default=0.90, ge=0.0, le=1.0)
    free_threshold: float = Field(default=0.15, ge=0.0, le=1.0)


class RegionUpdate(BaseModel):
    label: Optional[str] = Field(default=None, max_length=100)
    polygon: Optional[List[List[float]]] = Field(default=None, min_length=3)
    spot_id: Optional[str] = None
    occupy_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    free_threshold: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class DetectionEventOut(BaseModel):
    id: int
    camera_id: int
    region_id: int
    spot_id: Optional[str] = None
    previous_status: Optional[str] = None
    new_status: str
    confidence: float
    source: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class IngestRegionReading(BaseModel):
    """One space reading pushed by an external detector."""
    region_id: Optional[int] = None
    label: Optional[str] = None
    occupied: bool
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class IngestRequest(BaseModel):
    """Payload accepted from external detectors (LotVulture webhook/MQTT bridge)."""
    camera_name: Optional[str] = None
    camera_id: Optional[int] = None
    readings: List[IngestRegionReading] = Field(..., min_length=1)

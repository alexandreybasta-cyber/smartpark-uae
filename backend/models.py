from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    geojson_polygon = Column(Text, nullable=True)
    pricing_type = Column(String(50), default="hourly")
    price_per_hour = Column(Float, default=4.0)
    total_spots = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    spots = relationship("Spot", back_populates="zone", lazy="selectin")
    predictions = relationship("Prediction", back_populates="zone", lazy="selectin")


class Spot(Base):
    __tablename__ = "spots"

    id = Column(String(20), primary_key=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    status = Column(String(20), default="free")  # free, occupied, reserved, sensor_offline
    last_changed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    sensor_id = Column(String(50), nullable=True)
    occupied_since = Column(DateTime, nullable=True)
    # Who owns the truth for this spot's status:
    #   simulated = background simulator may flip it
    #   camera    = a CameraRegion drives it; simulator must leave it alone
    #   ingest    = an external detector (webhook/MQTT bridge) drives it
    detection_source = Column(String(20), default="simulated")

    zone = relationship("Zone", back_populates="spots")
    sensor = relationship("Sensor", back_populates="spot", uselist=False, lazy="selectin")
    park_events = relationship("ParkEvent", back_populates="spot", lazy="selectin")
    camera_regions = relationship("CameraRegion", back_populates="spot", lazy="selectin")


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(String(50), primary_key=True)
    spot_id = Column(String(20), ForeignKey("spots.id"), nullable=False)
    firmware_version = Column(String(20), default="2.1.4")
    battery_mv = Column(Integer, default=3400)
    signal_rssi = Column(Integer, default=-55)
    last_heartbeat = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(String(20), default="online")

    spot = relationship("Spot", back_populates="sensor")


class SavedPlace(Base):
    __tablename__ = "saved_places"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), default="demo_user")
    label = Column(String(50), nullable=False)
    custom_name = Column(String(200), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    address = Column(String(500), nullable=True)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    predicted_occupancy = Column(Float, nullable=False)
    confidence = Column(Float, default=0.85)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    zone = relationship("Zone", back_populates="predictions")


class ParkEvent(Base):
    __tablename__ = "park_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), default="demo_user")
    spot_id = Column(String(20), ForeignKey("spots.id"), nullable=False)
    parked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    left_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    spot = relationship("Spot", back_populates="park_events")


class Camera(Base):
    """A video source feeding the occupancy-detection pipeline.

    source_type is one of: rtsp | file | webcam | snapshot
      rtsp     -> source_url is an rtsp:// stream (IP security camera)
      file     -> source_url is a local video path, looped
      webcam   -> webcam_index selects a local capture device
      snapshot -> source_url is an image path/URL re-read on an interval
    """
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    source_type = Column(String(20), default="rtsp")
    source_url = Column(String(500), nullable=True)
    webcam_index = Column(Integer, nullable=True)
    # offline | connecting | online | error
    status = Column(String(20), default="offline")
    error_message = Column(String(500), nullable=True)
    # Frames analysed per second (capture rate may be higher; we sample).
    fps_target = Column(Float, default=2.0)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    last_frame_at = Column(DateTime, nullable=True)
    frames_analysed = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    regions = relationship("CameraRegion", back_populates="camera", lazy="selectin",
                           cascade="all, delete-orphan")


class CameraRegion(Base):
    """A polygon drawn over a camera frame, representing one parking space.

    polygon is JSON: [[x, y], ...] in NORMALISED 0..1 frame coordinates so the
    mapping survives resolution changes.
    status/confidence are the live detection state; occupy_threshold and
    free_threshold implement dual-threshold hysteresis (a region only flips to
    'occupied' above the high threshold and to 'free' below the low one).
    """
    __tablename__ = "camera_regions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    spot_id = Column(String(20), ForeignKey("spots.id"), nullable=True)
    label = Column(String(100), nullable=True)
    polygon = Column(Text, nullable=False)
    # unknown | free | occupied
    status = Column(String(20), default="unknown")
    confidence = Column(Float, default=0.0)
    occupy_threshold = Column(Float, default=0.90)
    free_threshold = Column(Float, default=0.15)
    last_updated_at = Column(DateTime, nullable=True)

    camera = relationship("Camera", back_populates="regions")
    spot = relationship("Spot", back_populates="camera_regions")


class DetectionEvent(Base):
    """Audit trail of every occupancy state transition observed by vision."""
    __tablename__ = "detection_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    region_id = Column(Integer, ForeignKey("camera_regions.id"), nullable=False)
    spot_id = Column(String(20), nullable=True)
    previous_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    confidence = Column(Float, default=0.0)
    # vision | ingest
    source = Column(String(20), default="vision")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

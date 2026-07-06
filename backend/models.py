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

    zone = relationship("Zone", back_populates="spots")
    sensor = relationship("Sensor", back_populates="spot", uselist=False, lazy="selectin")
    park_events = relationship("ParkEvent", back_populates="spot", lazy="selectin")


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

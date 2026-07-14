"""Database seeding script for SpotSense UAE demo data."""
import json
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from database import async_session
from models import Zone, Spot, Sensor, SavedPlace, Prediction


# DIC (Dubai Internet City) area zones with GeoJSON polygons
ZONES_DATA = [
    {
        "name": "DIC Parking Zone A",
        "pricing_type": "hourly",
        "price_per_hour": 4.0,
        "total_spots": 18,
        "geojson_polygon": json.dumps({
            "type": "Polygon",
            "coordinates": [[[55.1580, 25.0930], [55.1600, 25.0930], [55.1600, 25.0945], [55.1580, 25.0945], [55.1580, 25.0930]]]
        })
    },
    {
        "name": "DIC Parking Zone B",
        "pricing_type": "hourly",
        "price_per_hour": 5.0,
        "total_spots": 24,
        "geojson_polygon": json.dumps({
            "type": "Polygon",
            "coordinates": [[[55.1605, 25.0920], [55.1630, 25.0920], [55.1630, 25.0940], [55.1605, 25.0940], [55.1605, 25.0920]]]
        })
    },
    {
        "name": "DIC Parking Zone C",
        "pricing_type": "hourly",
        "price_per_hour": 3.5,
        "total_spots": 16,
        "geojson_polygon": json.dumps({
            "type": "Polygon",
            "coordinates": [[[55.1570, 25.0910], [55.1595, 25.0910], [55.1595, 25.0925], [55.1570, 25.0925], [55.1570, 25.0910]]]
        })
    }
]

# Realistic parking spot coordinates for each zone (cluster-based, road-following)
# Each zone is a list of (lat, lng) tuples representing actual parking locations
# along roads in the Dubai Internet City / Media City area.

ZONE_A_SPOTS = [
    # Cluster 1: Curbside parking along DIC internal road (south section)
    (25.0931, 55.1586), (25.0932, 55.1587), (25.0933, 55.1588),
    (25.0934, 55.1589), (25.0935, 55.1590), (25.0936, 55.1591),
    # Cluster 2: Parking strip near Building 3 (mid section)
    (25.0938, 55.1593), (25.0939, 55.1594), (25.0940, 55.1595),
    (25.0941, 55.1596), (25.0942, 55.1597), (25.0943, 55.1598),
    # Cluster 3: Curbside near DIC roundabout (north section)
    (25.0944, 55.1592), (25.0945, 55.1593), (25.0944, 55.1594),
    (25.0943, 55.1595), (25.0942, 55.1593), (25.0941, 55.1592),
]

ZONE_B_SPOTS = [
    # Cluster 1: Parking lot between Buildings 4-5
    (25.0926, 55.1607), (25.0927, 55.1607), (25.0928, 55.1608),
    (25.0926, 55.1609), (25.0927, 55.1609),
    # Cluster 2: Parking lot near Building 6
    (25.0930, 55.1612), (25.0931, 55.1612), (25.0932, 55.1613),
    (25.0930, 55.1614), (25.0931, 55.1614),
    # Cluster 3: Parking strip along internal road near Building 7
    (25.0933, 55.1617), (25.0934, 55.1618), (25.0935, 55.1619),
    (25.0936, 55.1620), (25.0937, 55.1621),
    # Cluster 4: Parking lot between Buildings 8-9
    (25.0935, 55.1623), (25.0936, 55.1623), (25.0937, 55.1624),
    (25.0935, 55.1625), (25.0936, 55.1625),
    # Cluster 5: Street parking along east DIC road
    (25.0938, 55.1610), (25.0939, 55.1612), (25.0940, 55.1614),
    (25.0939, 55.1616),
]

ZONE_C_SPOTS = [
    # Cluster 1: Street parking along Al Sufouh Road (west section)
    (25.0912, 55.1572), (25.0913, 55.1574), (25.0914, 55.1576),
    (25.0915, 55.1578), (25.0916, 55.1580),
    # Cluster 2: Curbside parking along Al Sufouh Road (east section)
    (25.0918, 55.1583), (25.0919, 55.1585), (25.0920, 55.1587),
    (25.0921, 55.1589), (25.0922, 55.1590), (25.0923, 55.1591),
    # Cluster 3: Knowledge Park internal lot
    (25.0916, 55.1585), (25.0917, 55.1586), (25.0918, 55.1587),
    (25.0916, 55.1588), (25.0917, 55.1589),
]

ALL_ZONE_SPOTS = [ZONE_A_SPOTS, ZONE_B_SPOTS, ZONE_C_SPOTS]

SAVED_PLACES = [
    {"label": "home", "custom_name": "Dubai Marina Apartment", "lat": 25.0800, "lng": 55.1400, "address": "Marina Walk, Dubai Marina, Dubai"},
    {"label": "work", "custom_name": "DIC Building 3", "lat": 25.0935, "lng": 55.1590, "address": "Building 3, Dubai Internet City, Dubai"},
    {"label": "gym", "custom_name": "Fitness First DMC", "lat": 25.0910, "lng": 55.1530, "address": "Dubai Media City, Dubai"},
]


def generate_spot_coords(zone_index: int):
    """Return realistic parking coordinates with small jitter for a zone."""
    base_coords = ALL_ZONE_SPOTS[zone_index]
    coords = []
    for (lat, lng) in base_coords:
        # Add ±3-5 meter jitter (approx 0.00003-0.00005 degrees)
        jittered_lat = lat + random.uniform(-0.00004, 0.00004)
        jittered_lng = lng + random.uniform(-0.00005, 0.00005)
        coords.append((jittered_lat, jittered_lng))
    return coords


def assign_initial_statuses(count: int) -> list[str]:
    """Assign initial statuses: ~35% free, ~55% occupied, ~10% reserved."""
    statuses = []
    for _ in range(count):
        r = random.random()
        if r < 0.35:
            statuses.append("free")
        elif r < 0.90:
            statuses.append("occupied")
        else:
            statuses.append("reserved")
    return statuses


def generate_predictions(zone_id: int, now: datetime) -> list[dict]:
    """Generate 12 hours of predicted occupancy data at 15-min intervals."""
    predictions = []
    dubai_offset = timedelta(hours=4)

    for i in range(48):  # 12 hours * 4 intervals per hour
        ts = now + timedelta(minutes=15 * i)
        dubai_time = ts + dubai_offset
        hour = dubai_time.hour

        # Base occupancy from time-of-day profile
        if 0 <= hour < 6:
            base_occ = random.uniform(8, 15)
        elif 7 <= hour < 10:
            base_occ = random.uniform(45, 85)
        elif 10 <= hour < 12:
            base_occ = random.uniform(70, 80)
        elif 12 <= hour < 13:
            base_occ = random.uniform(60, 70)
        elif 13 <= hour < 17:
            base_occ = random.uniform(72, 82)
        elif 17 <= hour < 20:
            base_occ = random.uniform(85, 92)
        else:
            base_occ = random.uniform(30, 50)

        # Add some noise
        occ = max(0, min(100, base_occ + random.uniform(-5, 5)))
        confidence = random.uniform(0.75, 0.95)

        predictions.append({
            "zone_id": zone_id,
            "timestamp": ts,
            "predicted_occupancy": round(occ, 1),
            "confidence": round(confidence, 3),
            "generated_at": now,
        })

    return predictions


async def seed_database():
    """Seed the database with demo data if empty."""
    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(select(Zone))
        if result.scalars().first():
            print("Database already seeded, skipping.")
            return

        print("Seeding database...")
        now = datetime.now(timezone.utc)

        # Create zones
        zones = []
        for zone_data in ZONES_DATA:
            zone = Zone(**zone_data)
            session.add(zone)
            zones.append(zone)

        await session.flush()  # Get zone IDs

        # Create spots and sensors
        spot_index = 0
        for zone_idx, zone in enumerate(zones):
            coords = generate_spot_coords(zone_idx)
            statuses = assign_initial_statuses(len(coords))

            for i, (lat, lng) in enumerate(coords):
                spot_id = f"{zone.id}{zone_idx + 1:02d}-{i + 1:02d}"
                status = statuses[i]
                sensor_id = f"SNS-{zone.id}{zone_idx + 1:02d}-{i + 1:02d}"

                spot = Spot(
                    id=spot_id,
                    zone_id=zone.id,
                    lat=lat,
                    lng=lng,
                    status=status,
                    last_changed_at=now - timedelta(minutes=random.randint(1, 60)),
                    sensor_id=sensor_id,
                    occupied_since=now - timedelta(minutes=random.randint(5, 120)) if status == "occupied" else None,
                )
                session.add(spot)

                sensor = Sensor(
                    id=sensor_id,
                    spot_id=spot_id,
                    firmware_version=random.choice(["2.1.4", "2.1.3", "2.2.0"]),
                    battery_mv=random.randint(3200, 3600),
                    signal_rssi=random.randint(-70, -40),
                    last_heartbeat=now - timedelta(seconds=random.randint(0, 30)),
                    status="online",
                )
                session.add(sensor)

                spot_index += 1

        # Create saved places
        for place_data in SAVED_PLACES:
            place = SavedPlace(user_id="demo_user", **place_data)
            session.add(place)

        # Create predictions for each zone
        for zone in zones:
            preds = generate_predictions(zone.id, now)
            for pred_data in preds:
                pred = Prediction(**pred_data)
                session.add(pred)

        await session.commit()
        print(f"Seeded: {len(zones)} zones, {spot_index} spots/sensors, {len(SAVED_PLACES)} places, {len(zones)*48} predictions")

"""Module registry: the single source of truth for what a module IS.

Nav entries, overview widgets, entitlement gating and the admin switch all
read from here, so adding a module means adding one dict entry.
"""

MODULES = [
    dict(key="vision", num=1, name="Vision AI", route="/dash/vision",
         color="#D9A71B", blurb="Camera feed analysis: bays, car types, free vs busy"),
    dict(key="sensors", num=2, name="Sensor Device", route="/dash/sensors",
         color="#3E9C6B", blurb="Per-bay IoT presence data and fleet health"),
    dict(key="anpr", num=3, name="Gates & ANPR", route="/dash/gates",
         color="#2E8BA0", blurb="Plate passage events at entry and exit, verified duration"),
    dict(key="payments", num=4, name="Payments & Wallet", route="/dash/payments",
         color="#D96A50", blurb="Sessions, auto-charge on exit, revenue"),
    dict(key="enforcement", num=5, name="Enforcement", route="/dash/enforcement",
         color="#C44B74", blurb="Occupied-but-unpaid flags with AI arbitration"),
    dict(key="agent", num=6, name="AI Agent", route="/dash/agent",
         color="#7C5CD6", blurb="Voice and text agent, optimal-spot recommendations"),
    dict(key="analytics", num=7, name="Prediction & Analytics", route="/dash/analytics",
         color="#957AD8", blurb="Occupancy forecasts and utilisation reports"),
    dict(key="map", num=8, name="Live Map & Zones", route="/dash/map",
         color="#2E8B8B", blurb="Live bay map, sites, areas, pricing"),
    dict(key="driver", num=9, name="Driver App", route="/dash/driver",
         color="#4F6FB5", blurb="Driver app config, geofences, saved places"),
]

MODULE_KEYS = [m["key"] for m in MODULES]


def registry_payload(entitled: list[str]) -> list[dict]:
    """Registry metadata for the entitled modules, in product order."""
    return [m for m in MODULES if m["key"] in entitled]

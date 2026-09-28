"""Platform seeding: demo tenant, users, areas, sources, entitlements and a
7-day backfilled event ledger so every module page has real history on boot."""
import logging
import random
from datetime import datetime, timezone, timedelta

from sqlalchemy import select

from database import async_session
from models import (Area, ModuleEntitlement, Source, Spot, Tenant, User, Zone)
from platform_core.ledger import emit, refresh_zone_cache
from platform_core.registry import MODULE_KEYS
from platform_core.security import hash_password

logger = logging.getLogger(__name__)

DEMO_USERS = [
    ("admin@spotsense.app", "demo1234", "Platform Admin", "admin"),
    ("operator@spotsense.app", "demo1234", "Ops Manager", "operator"),
    ("enforce@spotsense.app", "demo1234", "Patrol Officer", "enforcement"),
]

AREA_NAMES = ["Row A", "Row B"]
_PLATE_LETTERS = "ABDKLMNPST"


def _plate() -> str:
    return f"{random.choice(_PLATE_LETTERS)} {random.randint(10000, 99999)}"


async def seed_platform() -> None:
    async with async_session() as session:
        existing = (await session.execute(select(Tenant))).scalars().first()
        if existing:
            await refresh_zone_cache(session)
            return

        logger.info("Seeding platform: tenant, users, areas, sources, ledger...")
        now = datetime.now(timezone.utc)
        tenant = Tenant(name="SpotSense Demo (Dubai Internet City)",
                        logo_text="SS", plan="platform-all")
        session.add(tenant)
        await session.flush()

        for email, password, name, role in DEMO_USERS:
            session.add(User(tenant_id=tenant.id, email=email,
                             password_hash=hash_password(password),
                             name=name, role=role))

        zones = (await session.execute(select(Zone))).scalars().all()
        for zone in zones:
            zone.tenant_id = tenant.id
            spots = list(zone.spots)
            half = max(1, len(spots) // 2)
            areas = []
            for i, area_name in enumerate(AREA_NAMES):
                area = Area(zone_id=zone.id, name=area_name)
                session.add(area)
                areas.append(area)
            await session.flush()
            for i, spot in enumerate(spots):
                spot.area_id = areas[0].id if i < half else areas[-1].id

            session.add_all([
                Source(tenant_id=tenant.id, zone_id=zone.id, kind="camera",
                       name=f"CAM-{zone.id} zone overview", status="online"),
                Source(tenant_id=tenant.id, zone_id=zone.id, kind="sensor",
                       name=f"SNS-FLEET-{zone.id} bay sensors", status="online"),
                Source(tenant_id=tenant.id, zone_id=zone.id, kind="anpr_gate",
                       name=f"GATE-{zone.id}-IN entry LPR", status="online"),
                Source(tenant_id=tenant.id, zone_id=zone.id, kind="anpr_gate",
                       name=f"GATE-{zone.id}-OUT exit LPR", status="online"),
                Source(tenant_id=tenant.id, zone_id=zone.id, kind="payment",
                       name=f"PAY-{zone.id} Parkin bridge", status="online"),
            ])

        for key in MODULE_KEYS:
            session.add(ModuleEntitlement(tenant_id=tenant.id, module_key=key))
        await session.flush()

        # ---- backfill 7 days of passage + payment history per site ----
        for zone in zones:
            spot_ids = [s.id for s in zone.spots] or [f"{zone.id}1-01"]
            price = zone.price_per_hour or 4.0
            for day in range(7):
                for _ in range(random.randint(8, 14)):
                    bay_id = random.choice(spot_ids)
                    plate = _plate()
                    start = now - timedelta(days=day,
                                            hours=random.randint(0, 12),
                                            minutes=random.randint(0, 59))
                    minutes = random.randint(20, 150)
                    end = start + timedelta(minutes=minutes)
                    paid = random.random() < 0.85
                    amount = round(minutes / 60.0 * price, 2)
                    await emit(session, tenant_id=tenant.id, zone_id=zone.id,
                               bay_id=bay_id, event_type="vehicle_passage",
                               payload={"plate": plate, "gate": f"GATE-{zone.id}-IN",
                                        "direction": "in"},
                               source_kind="anpr_gate", ts=start)
                    await emit(session, tenant_id=tenant.id, zone_id=zone.id,
                               bay_id=bay_id, event_type="vehicle_passage",
                               payload={"plate": plate, "gate": f"GATE-{zone.id}-OUT",
                                        "direction": "out"},
                               source_kind="anpr_gate", ts=end)
                    await emit(session, tenant_id=tenant.id, zone_id=zone.id,
                               bay_id=bay_id, event_type="payment_session",
                               payload={"bay_id": bay_id, "plate": plate,
                                        "started_at": start.isoformat(),
                                        "ended_at": end.isoformat(),
                                        "amount": amount if paid else 0.0,
                                        "status": "paid" if paid else "unpaid"},
                               source_kind="payment", ts=end)

        await session.commit()
        await refresh_zone_cache(session)
        logger.info("Platform seeded: tenant %s, %d sites, %d modules entitled",
                    tenant.id, len(zones), len(MODULE_KEYS))

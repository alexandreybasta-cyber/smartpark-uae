"""ANPR mock adapter: stands in for a Parkin/RTA-style barrierless feed.

Produces the same normalized events a real LPR gate integration would:
vehicle_passage in/out plus payment_session open/close. ~15% of visits never
open a payment session, which is what makes the enforcement module light up.
"""
import asyncio
import logging
import random
from datetime import datetime, timezone, timedelta

from sqlalchemy import select

from database import async_session
from models import Spot, Zone
from platform_core.ledger import emit, refresh_zone_cache

logger = logging.getLogger(__name__)

_PLATE_LETTERS = "ABDKLMNPST"
_TICK = 7          # seconds between adapter ticks
_MAX_OPEN = 5      # concurrent open visits per site


def _plate() -> str:
    return f"{random.choice(_PLATE_LETTERS)} {random.randint(10000, 99999)}"


class _Visit:
    __slots__ = ("plate", "bay_id", "in_ts", "paying", "duration_min", "area_id")

    def __init__(self, plate, bay_id, area_id, paying, duration_min):
        self.plate = plate
        self.bay_id = bay_id
        self.area_id = area_id
        self.in_ts = datetime.now(timezone.utc)
        self.paying = paying
        self.duration_min = duration_min


async def run_anpr_mock() -> None:
    """Background loop. Cancelled by lifespan on shutdown."""
    open_visits: dict[int, dict[str, _Visit]] = {}
    while True:
        try:
            async with async_session() as session:
                zones = (await session.execute(
                    select(Zone).where(Zone.tenant_id.is_not(None)))).scalars().all()
                await refresh_zone_cache(session)
                for zone in zones:
                    tenant_id = zone.tenant_id
                    visits = open_visits.setdefault(zone.id, {})
                    price = zone.price_per_hour or 4.0

                    # close visits whose simulated stay elapsed
                    for plate in list(visits):
                        v = visits[plate]
                        if datetime.now(timezone.utc) - v.in_ts < timedelta(
                                minutes=v.duration_min):
                            continue
                        del visits[plate]
                        await emit(session, tenant_id=tenant_id, zone_id=zone.id,
                                   bay_id=v.bay_id, event_type="vehicle_passage",
                                   payload={"plate": v.plate,
                                            "gate": f"GATE-{zone.id}-OUT",
                                            "direction": "out"},
                                   source_kind="anpr_gate", source_id=f"GATE-{zone.id}-OUT")
                        if v.paying:
                            minutes = (datetime.now(timezone.utc) - v.in_ts).total_seconds() / 60.0
                            await emit(session, tenant_id=tenant_id, zone_id=zone.id,
                                       bay_id=v.bay_id, event_type="payment_session",
                                       payload={"bay_id": v.bay_id, "plate": v.plate,
                                                "started_at": v.in_ts.isoformat(),
                                                "ended_at": datetime.now(timezone.utc).isoformat(),
                                                "amount": round(minutes / 60.0 * price, 2),
                                                "status": "paid"},
                                       source_kind="payment", source_id=f"PAY-{zone.id}")
                        # unpaid visits intentionally emit nothing: enforcement
                        # derives the violation from the missing session.

                    # open new visits while bays are free-ish
                    if len(visits) < _MAX_OPEN and random.random() < 0.55:
                        spots = (await session.execute(
                            select(Spot).where(Spot.zone_id == zone.id,
                                               Spot.status == "occupied")
                            .limit(40))).scalars().all()
                        if spots:
                            spot = random.choice(spots)
                            plate = _plate()
                            paying = random.random() < 0.85
                            visits[plate] = _Visit(plate, spot.id, spot.area_id,
                                                   paying, random.randint(3, 9))
                            await emit(session, tenant_id=tenant_id, zone_id=zone.id,
                                       bay_id=spot.id, event_type="vehicle_passage",
                                       payload={"plate": plate,
                                                "gate": f"GATE-{zone.id}-IN",
                                                "direction": "in"},
                                       source_kind="anpr_gate",
                                       source_id=f"GATE-{zone.id}-IN",
                                       area_id=spot.area_id)
                            if paying:
                                await emit(session, tenant_id=tenant_id,
                                           zone_id=zone.id, bay_id=spot.id,
                                           event_type="payment_session",
                                           payload={"bay_id": spot.id, "plate": plate,
                                                    "started_at": datetime.now(timezone.utc).isoformat(),
                                                    "ended_at": None, "amount": 0.0,
                                                    "status": "open"},
                                           source_kind="payment",
                                           source_id=f"PAY-{zone.id}",
                                           area_id=spot.area_id)
                await session.commit()
        except asyncio.CancelledError:
            raise
        except Exception as e:  # keep the demo alive, never crash the loop
            logger.error("anpr mock error: %s", e)
        await asyncio.sleep(_TICK)

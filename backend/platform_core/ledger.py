"""Event ledger helpers: the only way anything writes normalized events."""
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Event, Zone

logger = logging.getLogger(__name__)

_zone_tenant: dict[int, int] = {}


async def refresh_zone_cache(session: AsyncSession) -> None:
    result = await session.execute(select(Zone.id, Zone.tenant_id))
    for zone_id, tenant_id in result.all():
        if tenant_id is not None:
            _zone_tenant[zone_id] = tenant_id


async def tenant_of_zone(session: AsyncSession, zone_id: int) -> Optional[int]:
    if zone_id in _zone_tenant:
        return _zone_tenant[zone_id]
    zone = await session.get(Zone, zone_id)
    if zone is not None and zone.tenant_id is not None:
        _zone_tenant[zone_id] = zone.tenant_id
    return zone.tenant_id if zone else None


async def emit(
    session: AsyncSession,
    *,
    tenant_id: int,
    zone_id: Optional[int],
    event_type: str,
    payload: dict,
    source_kind: Optional[str] = None,
    source_id: Optional[str] = None,
    area_id: Optional[int] = None,
    bay_id: Optional[str] = None,
    ts: Optional[datetime] = None,
) -> Event:
    """Append one normalized event. Caller commits (or use emit_now)."""
    event = Event(
        tenant_id=tenant_id,
        zone_id=zone_id,
        area_id=area_id,
        bay_id=bay_id,
        type=event_type,
        source_kind=source_kind,
        source_id=source_id,
        payload=json.dumps(payload),
        ts=ts or datetime.now(timezone.utc),
    )
    session.add(event)
    return event


async def emit_bay_state(
    session: AsyncSession,
    spot,
    status: str,
    source_kind: str,
    source_id: Optional[str] = None,
    confidence: Optional[float] = None,
) -> Optional[Event]:
    tenant_id = await tenant_of_zone(session, spot.zone_id)
    if tenant_id is None:
        return None
    return await emit(
        session,
        tenant_id=tenant_id,
        zone_id=spot.zone_id,
        event_type="bay_state_change",
        payload={"status": status, "confidence": confidence},
        source_kind=source_kind,
        source_id=source_id,
        area_id=spot.area_id,
        bay_id=spot.id,
    )


async def emit_now(
    *,
    tenant_id: int,
    zone_id: Optional[int],
    event_type: str,
    payload: dict,
    source_kind: Optional[str] = None,
    source_id: Optional[str] = None,
    area_id: Optional[int] = None,
    bay_id: Optional[str] = None,
    ts: Optional[datetime] = None,
) -> None:
    """Emit + commit in its own session (background adapters)."""
    from database import async_session

    async with async_session() as session:
        await emit(
            session,
            tenant_id=tenant_id,
            zone_id=zone_id,
            event_type=event_type,
            payload=payload,
            source_kind=source_kind,
            source_id=source_id,
            area_id=area_id,
            bay_id=bay_id,
            ts=ts,
        )
        await session.commit()

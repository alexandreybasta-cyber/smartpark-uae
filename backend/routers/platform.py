"""Platform API (/api/p): auth, entitlements, sites/areas/bays, event ledger,
overview widgets and module-page data. Everything reads the normalized ledger.
"""
import json
import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Optional

from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import (Area, Camera, DetectionEvent, ModuleEntitlement,
                    PlatformSession, Prediction, SavedPlace, Sensor, Source,
                    Spot, Event, Tenant, User, Zone)
from platform_core import ledger
from platform_core.registry import MODULES, MODULE_KEYS, registry_payload
from platform_core.security import (get_current_user, new_token, preview_modules,
                               require_admin, verify_password)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/p", tags=["platform"])


# ---------------------------------------------------------------- schemas
class LoginBody(BaseModel):
    email: str
    password: str


class SiteBody(BaseModel):
    name: str
    price_per_hour: float = 4.0


class AreaBody(BaseModel):
    name: str


class BayBody(BaseModel):
    lat: float
    lng: float


class EntitlementBody(BaseModel):
    modules: list[str]


class IngestBayState(BaseModel):
    bay_id: str
    status: str
    confidence: Optional[float] = None
    source_id: Optional[str] = None


class IngestPassage(BaseModel):
    plate: str
    gate: str
    direction: str  # in | out
    bay_id: Optional[str] = None


# ---------------------------------------------------------------- helpers
def _day_ago() -> datetime:
    # SQLite stores naive UTC; cutoffs must be naive too for string compare.
    return datetime.utcnow() - timedelta(hours=24)


async def _tenant_zone_ids(db: AsyncSession, user: User) -> list[int]:
    result = await db.execute(select(Zone.id).where(Zone.tenant_id == user.tenant_id))
    return [r[0] for r in result.all()]


async def _entitled_keys(db: AsyncSession, user: User,
                         request: Request) -> list[str]:
    preview = preview_modules(request, user)
    if preview is not None:
        return [k for k in MODULE_KEYS if k in preview]
    result = await db.execute(select(ModuleEntitlement.module_key).where(
        ModuleEntitlement.tenant_id == user.tenant_id))
    return [r[0] for r in result.all()]


def _parse_payload(event: Event) -> dict:
    try:
        return json.loads(event.payload or "{}")
    except json.JSONDecodeError:
        return {}


async def _open_visits(db: AsyncSession, zone_ids: list[int]) -> dict[str, dict]:
    """Plates with a passage-in and no passage-out in the last 24h."""
    if not zone_ids:
        return {}
    result = await db.execute(
        select(Event).where(Event.type == "vehicle_passage",
                            Event.zone_id.in_(zone_ids),
                            Event.ts >= _day_ago()).order_by(Event.ts))
    visits: dict[str, dict] = {}
    for ev in result.scalars():
        payload = _parse_payload(ev)
        plate = payload.get("plate")
        if not plate:
            continue
        if payload.get("direction") == "in":
            visits[plate] = {"bay_id": ev.bay_id, "in_ts": ev.ts,
                             "gate": payload.get("gate"), "zone_id": ev.zone_id}
        else:
            visits.pop(plate, None)
    return visits


async def _latest_payment_status(db: AsyncSession, zone_ids: list[int]) -> dict[str, str]:
    """bay_id -> status of its most recent payment_session event."""
    if not zone_ids:
        return {}
    result = await db.execute(
        select(Event).where(Event.type == "payment_session",
                            Event.zone_id.in_(zone_ids),
                            Event.ts >= _day_ago()).order_by(Event.ts))
    latest: dict[str, str] = {}
    for ev in result.scalars():
        if ev.bay_id:
            latest[ev.bay_id] = _parse_payload(ev).get("status", "unknown")
    return latest


async def _violations(db: AsyncSession, user: User) -> list[dict]:
    zone_ids = await _tenant_zone_ids(db, user)
    visits = await _open_visits(db, zone_ids)
    payments = await _latest_payment_status(db, zone_ids)
    out = []
    for plate, v in visits.items():
        bay_id = v["bay_id"]
        if not bay_id or payments.get(bay_id) == "open":
            continue
        spot = await db.get(Spot, bay_id)
        if spot is None or spot.status != "occupied":
            continue
        since = v["in_ts"]
        out.append({
            "plate": plate, "bay_id": bay_id, "zone_id": v["zone_id"],
            "gate": v["gate"],
            "occupied_since": (spot.occupied_since or since).isoformat(),
            "entered_at": since.isoformat(),
            "minutes": int((datetime.utcnow() - since).total_seconds() // 60),
        })
    out.sort(key=lambda x: x["minutes"], reverse=True)
    return out


# ---------------------------------------------------------------- auth
@router.post("/auth/login")
async def login(body: LoginBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalars().first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = new_token()
    db.add(PlatformSession(token=token, user_id=user.id))
    tenant = await db.get(Tenant, user.tenant_id)
    await db.commit()
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
        "tenant": {"id": tenant.id, "name": tenant.name, "logo_text": tenant.logo_text},
    }


@router.get("/me")
async def me(request: Request, db: AsyncSession = Depends(get_db),
             user: User = Depends(get_current_user)):
    keys = await _entitled_keys(db, user, request)
    tenant = await db.get(Tenant, user.tenant_id)
    return {
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
        "tenant": {"id": tenant.id, "name": tenant.name, "logo_text": tenant.logo_text},
        "modules": registry_payload(keys),
        "preview": preview_modules(request, user),
    }


@router.get("/modules")
async def modules(db: AsyncSession = Depends(get_db),
                  user: User = Depends(get_current_user)):
    result = await db.execute(select(ModuleEntitlement.module_key).where(
        ModuleEntitlement.tenant_id == user.tenant_id))
    entitled = {r[0] for r in result.all()}
    return [{"key": m["key"], "num": m["num"], "name": m["name"],
             "route": m["route"], "color": m["color"], "blurb": m["blurb"],
             "entitled": m["key"] in entitled} for m in MODULES]


@router.put("/entitlements")
async def set_entitlements(body: EntitlementBody, db: AsyncSession = Depends(get_db),
                           user: User = Depends(require_admin)):
    unknown = [k for k in body.modules if k not in MODULE_KEYS]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Unknown modules: {unknown}")
    result = await db.execute(select(ModuleEntitlement).where(
        ModuleEntitlement.tenant_id == user.tenant_id))
    for row in result.scalars():
        await db.delete(row)
    for key in body.modules:
        db.add(ModuleEntitlement(tenant_id=user.tenant_id, module_key=key))
    await db.commit()
    return {"modules": body.modules}


# ---------------------------------------------------------------- sites
@router.get("/sites")
async def sites(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(Zone).where(Zone.tenant_id == user.tenant_id).order_by(Zone.id))
    out = []
    for zone in result.scalars():
        spots = list(zone.spots)
        out.append({
            "id": zone.id, "name": zone.name, "price_per_hour": zone.price_per_hour,
            "polygon": json.loads(zone.geojson_polygon) if zone.geojson_polygon else None,
            "areas": [{"id": a.id, "name": a.name} for a in zone.areas],
            "bays_total": len(spots),
            "bays_free": sum(1 for s in spots if s.status == "free"),
            "bays_occupied": sum(1 for s in spots if s.status == "occupied"),
        })
    return out


@router.get("/sites/{zone_id}")
async def site_detail(zone_id: int, db: AsyncSession = Depends(get_db),
                      user: User = Depends(get_current_user)):
    zone = await db.get(Zone, zone_id)
    if zone is None or zone.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Site not found")
    sources = (await db.execute(select(Source).where(Source.zone_id == zone_id))).scalars().all()
    return {
        "id": zone.id, "name": zone.name, "price_per_hour": zone.price_per_hour,
        "polygon": json.loads(zone.geojson_polygon) if zone.geojson_polygon else None,
        "areas": [{"id": a.id, "name": a.name} for a in zone.areas],
        "bays": [{"id": s.id, "area_id": s.area_id, "lat": s.lat, "lng": s.lng,
                  "status": s.status, "occupied_since": s.occupied_since.isoformat()
                  if s.occupied_since else None,
                  "detection_source": s.detection_source} for s in zone.spots],
        "sources": [{"id": s.id, "kind": s.kind, "name": s.name, "status": s.status}
                    for s in sources],
    }


@router.post("/sites", status_code=201)
async def create_site(body: SiteBody, db: AsyncSession = Depends(get_db),
                      user: User = Depends(require_admin)):
    zone = Zone(name=body.name, price_per_hour=body.price_per_hour,
                tenant_id=user.tenant_id, total_spots=0)
    db.add(zone)
    await db.commit()
    await ledger.refresh_zone_cache(db)
    return {"id": zone.id, "name": zone.name}


@router.post("/sites/{zone_id}/areas", status_code=201)
async def create_area(zone_id: int, body: AreaBody, db: AsyncSession = Depends(get_db),
                      user: User = Depends(require_admin)):
    zone = await db.get(Zone, zone_id)
    if zone is None or zone.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Site not found")
    area = Area(zone_id=zone_id, name=body.name)
    db.add(area)
    await db.commit()
    return {"id": area.id, "name": area.name}


@router.post("/areas/{area_id}/bays", status_code=201)
async def create_bay(area_id: int, body: BayBody, db: AsyncSession = Depends(get_db),
                     user: User = Depends(require_admin)):
    area = await db.get(Area, area_id)
    if area is None:
        raise HTTPException(status_code=404, detail="Area not found")
    zone = await db.get(Zone, area.zone_id)
    if zone is None or zone.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Site not found")
    count = (await db.execute(select(func.count(Spot.id)).where(
        Spot.zone_id == zone.id))).scalar() or 0
    spot = Spot(id=f"{zone.id}{area.id:02d}-{count + 1:02d}", zone_id=zone.id,
                area_id=area_id, lat=body.lat, lng=body.lng, status="free")
    db.add(spot)
    zone.total_spots = count + 1
    await db.commit()
    return {"id": spot.id}


@router.get("/sources")
async def sources(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Source).where(Source.tenant_id == user.tenant_id))
    return [{"id": s.id, "zone_id": s.zone_id, "area_id": s.area_id, "kind": s.kind,
             "name": s.name, "status": s.status} for s in result.scalars()]


# ---------------------------------------------------------------- ledger
@router.get("/events")
async def events(request: Request, type: Optional[str] = None, zone_id: Optional[int] = None,
                 limit: int = 200, db: AsyncSession = Depends(get_db),
                 user: User = Depends(get_current_user)):
    limit = min(max(limit, 1), 500)
    zone_ids = await _tenant_zone_ids(db, user)
    if zone_id is not None:
        if zone_id not in zone_ids:
            raise HTTPException(status_code=404, detail="Site not found")
        zone_ids = [zone_id]
    q = select(Event).where(Event.tenant_id == user.tenant_id)
    if zone_ids:
        q = q.where(Event.zone_id.in_(zone_ids))
    if type:
        q = q.where(Event.type == type)
    q = q.order_by(Event.ts.desc()).limit(limit)
    out = []
    for ev in (await db.execute(q)).scalars():
        out.append({"id": ev.id, "type": ev.type, "zone_id": ev.zone_id,
                    "area_id": ev.area_id, "bay_id": ev.bay_id,
                    "source_kind": ev.source_kind, "source_id": ev.source_id,
                    "payload": _parse_payload(ev), "ts": ev.ts.isoformat()})
    return out


@router.post("/ingest/bay_state", status_code=201)
async def ingest_bay_state(body: IngestBayState, db: AsyncSession = Depends(get_db),
                           user: User = Depends(get_current_user)):
    """External detector contract (edge box, 3rd-party vision, MQTT bridge)."""
    spot = await db.get(Spot, body.bay_id)
    if spot is None:
        raise HTTPException(status_code=404, detail="Bay not found")
    zone = await db.get(Zone, spot.zone_id)
    if zone is None or zone.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Bay not found")
    if body.status not in ("free", "occupied"):
        raise HTTPException(status_code=400, detail="status must be free or occupied")
    spot.status = body.status
    spot.last_changed_at = datetime.now(timezone.utc)
    spot.occupied_since = spot.last_changed_at if body.status == "occupied" else None
    spot.detection_source = "ingest"
    await ledger.emit_bay_state(db, spot, body.status, "ingest",
                                source_id=body.source_id, confidence=body.confidence)
    await db.commit()
    return {"ok": True, "bay_id": spot.id, "status": spot.status}


@router.post("/ingest/passage", status_code=201)
async def ingest_passage(body: IngestPassage, db: AsyncSession = Depends(get_db),
                         user: User = Depends(get_current_user)):
    """ANPR gate contract: one plate passage event per row."""
    if body.direction not in ("in", "out"):
        raise HTTPException(status_code=400, detail="direction must be in or out")
    zone_ids = await _tenant_zone_ids(db, user)
    zone_id = None
    if body.bay_id:
        spot = await db.get(Spot, body.bay_id)
        if spot is not None and spot.zone_id in zone_ids:
            zone_id = spot.zone_id
    if zone_id is None and zone_ids:
        zone_id = zone_ids[0]
    if zone_id is None:
        raise HTTPException(status_code=400, detail="No site available for tenant")
    await ledger.emit(db, tenant_id=user.tenant_id, zone_id=zone_id,
                      bay_id=body.bay_id, event_type="vehicle_passage",
                      payload={"plate": body.plate, "gate": body.gate,
                               "direction": body.direction},
                      source_kind="anpr_gate", source_id=body.gate)
    await db.commit()
    return {"ok": True}


# ---------------------------------------------------------------- module data
@router.get("/payments/sessions")
async def payment_sessions(db: AsyncSession = Depends(get_db),
                           user: User = Depends(get_current_user)):
    zone_ids = await _tenant_zone_ids(db, user)
    if not zone_ids:
        return []
    result = await db.execute(
        select(Event).where(Event.type == "payment_session",
                            Event.zone_id.in_(zone_ids))
        .order_by(Event.ts.desc()).limit(300))
    out = []
    for ev in result.scalars():
        p = _parse_payload(ev)
        out.append({"bay_id": ev.bay_id, "plate": p.get("plate"),
                    "started_at": p.get("started_at"), "ended_at": p.get("ended_at"),
                    "amount": p.get("amount", 0.0), "status": p.get("status"),
                    "ts": ev.ts.isoformat(), "zone_id": ev.zone_id})
    return out


@router.get("/enforcement/violations")
async def violations(db: AsyncSession = Depends(get_db),
                     user: User = Depends(get_current_user)):
    return await _violations(db, user)


@router.get("/analytics/summary")
async def analytics_summary(db: AsyncSession = Depends(get_db),
                            user: User = Depends(get_current_user)):
    zone_ids = await _tenant_zone_ids(db, user)
    out = []
    now = datetime.utcnow()
    for zone_id in zone_ids:
        zone = await db.get(Zone, zone_id)
        spots = list(zone.spots)
        total = len(spots)
        occupied = sum(1 for s in spots if s.status == "occupied")
        future = (await db.execute(
            select(func.max(Prediction.predicted_occupancy)).where(
                Prediction.zone_id == zone_id,
                Prediction.timestamp >= now))).scalar()
        out.append({"zone_id": zone_id, "name": zone.name, "total": total,
                    "occupied": occupied,
                    "occupancy_now": round(100.0 * occupied / total, 1) if total else 0.0,
                    "forecast_peak": future})
    return out


# ---------------------------------------------------------------- overview
@router.get("/overview")
async def overview(request: Request, db: AsyncSession = Depends(get_db),
                   user: User = Depends(get_current_user)):
    keys = await _entitled_keys(db, user, request)
    zone_ids = await _tenant_zone_ids(db, user)
    since = _day_ago()
    widgets: dict[str, dict] = {}

    spots_all: list[Spot] = []
    if zone_ids:
        spots_all = list((await db.execute(
            select(Spot).where(Spot.zone_id.in_(zone_ids)))).scalars())

    if "map" in keys:
        widgets["map"] = {
            "sites": len(zone_ids),
            "bays_total": len(spots_all),
            "bays_free": sum(1 for s in spots_all if s.status == "free"),
            "bays_occupied": sum(1 for s in spots_all if s.status == "occupied"),
        }
    if "vision" in keys:
        cams = (await db.execute(select(Camera))).scalars().all()
        det = (await db.execute(select(func.count(DetectionEvent.id)).where(
            DetectionEvent.created_at >= since))).scalar() or 0
        widgets["vision"] = {"cameras_total": len(cams),
                             "cameras_online": sum(1 for c in cams if c.status == "online"),
                             "detections_24h": det}
    if "sensors" in keys:
        sens = (await db.execute(select(Sensor))).scalars().all()
        widgets["sensors"] = {"total": len(sens),
                              "online": sum(1 for s in sens if s.status == "online"),
                              "low_battery": sum(1 for s in sens if (s.battery_mv or 9999) < 3300)}
    if "anpr" in keys:
        pas = (await db.execute(select(func.count(Event.id)).where(
            Event.type == "vehicle_passage", Event.ts >= since,
            Event.tenant_id == user.tenant_id))).scalar() or 0
        visits = await _open_visits(db, zone_ids)
        widgets["anpr"] = {"passages_24h": pas, "open_visits": len(visits)}
    if "payments" in keys:
        result = await db.execute(select(Event).where(
            Event.type == "payment_session", Event.ts >= since,
            Event.tenant_id == user.tenant_id))
        revenue, sessions, open_now = 0.0, 0, 0
        for ev in result.scalars():
            p = _parse_payload(ev)
            sessions += 1
            if p.get("status") == "paid":
                revenue += float(p.get("amount") or 0.0)
            elif p.get("status") == "open":
                open_now += 1
        widgets["payments"] = {"revenue_24h_aed": round(revenue, 2),
                               "sessions_24h": sessions, "open_sessions": open_now}
    if "enforcement" in keys:
        widgets["enforcement"] = {"open_violations": len(await _violations(db, user)),
                                  "arbitration": "qwen-max"}
    if "agent" in keys:
        widgets["agent"] = {"engine": "deterministic + Qwen Cloud", "status": "online"}
    if "analytics" in keys:
        total = len(spots_all)
        occupied = sum(1 for s in spots_all if s.status == "occupied")
        peak = None
        if zone_ids:
            peak = (await db.execute(select(func.max(Prediction.predicted_occupancy)).where(
                Prediction.zone_id.in_(zone_ids),
                Prediction.timestamp >= datetime.utcnow()))).scalar()
        widgets["analytics"] = {
            "occupancy_now_pct": round(100.0 * occupied / total, 1) if total else 0.0,
            "forecast_peak_pct": peak}
    if "driver" in keys:
        places = (await db.execute(select(func.count(SavedPlace.id)))).scalar() or 0
        widgets["driver"] = {"saved_places": places, "geofence_m": 150}
    return {"modules": keys, "widgets": widgets}

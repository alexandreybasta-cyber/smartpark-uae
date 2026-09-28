# SpotSense Platform Plan — Modular Dashboard Core

Date: 2026-09-28 · Status: agreed direction, ready to build
Companion doc: `MODULES.md` (the 9 modules and their capabilities)

## 1. The state change

SpotSense stops being an app and becomes a **hosted platform**:

- The **core** is a company dashboard. A client company logs in and sees
  SpotSense as one product.
- **Modules** (the 9 from MODULES.md) are independent capabilities that all
  plug into the same core. A company that buys 2 modules sees exactly 2
  modules in its dashboard, nav, and overview.
- MVP: one hosted instance, one demo tenant with **all 9 modules enabled**,
  so the dashboard presents the whole business concept.

## 2. Decisions taken (2026-09-28)

| Decision | Choice | Why |
|---|---|---|
| Entity hierarchy | Tenant > Site > Area > Bay | Matches how Parkin / facility managers talk; a site can mix module types |
| Tenant isolation | None beyond a tenant field. Keep it simple | MVP represents the business concept, not an infra showcase |
| Module attachment | In-process routers + entitlement flags (module registry) | MVP-fast; registry is the seam to split services later |
| Dashboard UI | Overview page + one page per entitled module | Sells the "360" story, degrades gracefully to 2 modules |

## 3. Core structure (the part that must scale)

### 3.1 Entity model

```
Tenant            company buying SpotSense (name, logo, plan)
  Site            one physical place: mall, street zone, tower, community
    Area          floor / row / block / street segment
      Bay         the atom. One painted bay = one record, always
  Source          a device or feed attached to a Site or Area:
                  camera | sensor | anpr_gate | payment_gateway | manual
ModuleEntitlement (tenant_id, module_key) — the on/off switch
Event             the ledger (below)
```

Bays are the universal atom: every module either **writes state about bays**
(vision, sensors, ANPR) or **reads bay state to act** (payment, enforcement,
agent, prediction, map, driver app). Sites/Areas exist so a client's portfolio
maps 1:1 to reality; sources exist so hardware never leaks into module code.

### 3.2 The normalized event ledger — the scaling key

All three industry infrastructures reduce to the same three event types.
The core stores and serves only these; modules never talk to hardware.

```
bay_state_change   { bay_id, status, confidence, source_id, ts }
vehicle_passage    { plate, gate_id, direction(in/out), ts, source_id }
payment_session    { bay_id or plate, started_at, ended_at, amount, status }
```

- Duration = matched in/out `vehicle_passage` (Parkin-style) OR occupancy
  window from `bay_state_change` (sensor/vision-style). Both feed payment.
- One `events` table (tenant_id, site_id, type, payload JSON, source_id, ts).
  Append-only. Every dashboard widget is a query over this ledger.
- This is why a client can run vision-only today and add sensors tomorrow
  with zero module changes: producers and consumers only know the contract.

### 3.3 Adapter layer (one per industry infrastructure)

| Adapter | Industry world | How it produces events | MVP status |
|---|---|---|---|
| `vision-rtsp` | Camera parking zones / own cameras | Existing backend vision worker (YOLO + painted-bay geometry) emits bay_state_change | exists — rewire output to ledger |
| `vision-edge` | Classical building security cams (NVR/VMS, SIRA-regulated, customer LAN) | On-prem box/container pulls RTSP/ONVIF or VMS API, POSTs events to `/ingest` | exists as `/ingest` API; edge box = deployment recipe, not new code |
| `anpr-gate` | Parkin/RTA barrierless infra | Consumes plate-passage events: own LPR cam, or operator feed/API (Parkin-style entry/exit log) | new: mock LPR event generator for MVP + `/ingest` passage schema |
| `sensor-mqtt` | IoT bay sensors | Sensor ticks (simulator now, MQTT/HTTP later) emit bay_state_change | exists as simulator — rewire to ledger |
| `payment-parkin` | Parkin/payment systems | Payment gateway webhooks emit payment_session | demo stub (existing payment-demo) |

Rule: **adapters are the only code that touches hardware or third-party
feeds.** Modules consume the ledger. This is the entire scaling argument.

### 3.4 Module registry + entitlements

- `MODULES` registry in code: key, name, icon, colour, nav route, overview
  widget component, required event types, API router.
- `module_entitlements` table gates: nav entries, overview widgets, API
  routers (403 when not entitled), ingestion workers (adapter won't run for a
  tenant without the module).
- MVP seeds all 9 for the demo tenant. Add a **"View as client" switch** in
  admin: pick any subset of modules to preview exactly what a 2-module buyer
  sees — this is a sales weapon, not just a feature.

## 4. Dashboard information architecture

```
Login (email + password; roles: admin, operator, enforcement — MVP: admin + operator)
└── Shell: tenant name + logo top-left, site switcher, nav = entitled modules only
    ├── Overview            live widgets from entitled modules only:
    │                       occupancy map, free bays now, violations open,
    │                       revenue today, 24h forecast, fleet health
    ├── Map & Zones (8)     live bay map, site/area tree, pricing
    ├── Vision AI (1)       cameras, regions, /train console, event log
    ├── Sensors (2)         fleet dashboard, battery/RSSI, per-bay history
    ├── Gates & ANPR (3)    passage log, duration reconstruction, match rate
    ├── Payments (4)        sessions, revenue, auto-charge rules
    ├── Enforcement (5)     open violations, AI arbitration queue, officer view
    ├── Agent (6)           chat/voice console, recommendation log
    ├── Analytics (7)       forecasts, demand curves, utilisation reports
    └── Driver App (9)      QR/deep-link config, geofence radii, saved-place stats
        + Admin: sites/areas/bays CRUD, sources, entitlements, users
```

Overview widgets are registered by modules (3.4), so a 2-module client gets a
2-widget overview automatically. No per-client UI code, ever.

## 5. MVP scope and build phases

Phase 0 — Core shell (new Next.js app or refactor of `frontend/`):
auth, tenant/site/area/bay CRUD seeded with one demo portfolio
(1 mall site + 1 street zone site, areas, ~120 bays), shell + nav from
entitlements, Overview page with widget registry.

Phase 1 — Event ledger + adapters: `events` table + core service functions
(`emit_bay_state`, `emit_passage`, `emit_payment`); rewire vision worker and
simulator to emit; add mock ANPR generator (plates entering/leaving the demo
sites) and payment stub deriving sessions from durations.

Phase 2 — Module pages: port existing UI into the shell routes — map (Leaflet
components), cameras page (existing /cameras UI), enforcement page,
payment-demo, analytics charts, agent chat. Each page reads the ledger.

Phase 3 — Overview widgets + "View as client" subset preview + role split
(enforcement role sees module 5 only).

Phase 4 — Hosting: single FastAPI + single Next.js on the existing
Cloudflare/MuleRun pipeline; SQLite is fine for MVP, Postgres swap is a
config change thanks to SQLAlchemy; document the edge-box deployment recipe
for `vision-edge`.

Out of scope for MVP (deliberately): tenant isolation mechanics, per-tenant
schemas, SSO, billing/subscription automation, real Parkin/RTA API
integration (mock adapter proves the contract), mobile app rebuild.

## 6. Risks and open points

- SQLite concurrency with the vision worker + WebSocket broadcast: fine at
  demo scale; the ledger's append-only design makes the Postgres move trivial.
- SIRA: for real Dubai building deployments the edge box must sit inside the
  client's network; the `/ingest` contract already assumes that. Keep it in
  the sales deck as "we never touch your CCTV network from outside".
- Parkin/RTA have no public plate-event API today; the `anpr-gate` adapter's
  mock keeps the contract honest until a partnership defines the real feed.
- Overview widget registry must stay declarative (component + query), or
  "sell 2 modules" silently becomes custom UI work per client.

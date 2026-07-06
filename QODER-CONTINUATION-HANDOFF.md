# SmartPark UAE — Continuation Handoff (Audit of 2026-07-07)

Read `smartpark-handoff.md` first — it is the product spec and remains the source of truth.
This document records what an independent audit found in the current codebase and what must
be done next, in priority order, to be hackathon-ready (Qwen Cloud Challenge / EdgeAgent track).

---

## 1. Current state (verified, not assumed)

### What exists and works
- `frontend/` — Next.js 16.2.10 / React 19, four routes:
  - `/` — marketing landing page (Hero, ProblemSection, InteractiveDemo, AgentSection, HardwareSection, ArchitectureSection, TechStackSection).
  - `/demo` — Leaflet map of Dubai Internet City with zone polygons, spot markers, spot bottom-sheet ("Pay via Parkin" mock button), search bar, simulator controls. This is the closest thing to "the app".
  - `/places` — saved places CRUD, persisted in `localStorage` only (`PlacesContext`).
  - `/analytics` — Chart.js prediction/zone-comparison panels.
  - Voice agent widget mounted globally in `layout.tsx` (Web Speech API STT, animated reasoning steps, map card).
- `backend/` — FastAPI + SQLite (aiosqlite/SQLAlchemy async): routers for zones (incl. `/nearby` haversine), spots, predict, places, sensors; `/ws/spots` WebSocket with a broadcast ConnectionManager; a 2-second simulator background task using a Dubai time-of-day occupancy profile; seeded DB (3 zones, 58 spots + sensors, saved places, 48×3 prediction rows).
- `smartpark-uae.html` — single-file design prototype (design tokens source).
- Public repo exists: `github.com/alexandreybasta-cyber/smartpark-uae` (pushed via GitHub API script, not via git remote — local repo has NO remote configured).

### Critical gaps (the audit's main findings)

1. **Frontend and backend are two disconnected systems.**
   `frontend/src/lib/api.ts` (fetchZones, sendAgentQuery, createSpotsWebSocket, fetchPredictions) is imported by NOTHING.
   The entire UI runs on `src/data/seed.ts` + `src/lib/simulator.ts` + `src/lib/agentResponses.ts`, all client-side.
   The backend's WebSocket has zero consumers. `.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8000` but it is dead config.

2. **There is no AI anywhere.** No Qwen, no DashScope, no LangGraph, no LLM call of any kind
   (verified by grep across backend and frontend). "Qwen-Max", "LangGraph", "agentic AI" appear only
   as marketing copy in landing components. The backend "agent" (`backend/agent.py`) is keyword
   if/else matching. The frontend voice agent (`lib/agentResponses.ts`) returns canned strings with
   HARDCODED numbers ("Zone 314: 11/24 free") that can contradict the live simulated map next to it.
   For a Qwen hackathon this is the #1 credibility risk — judges will look for a real Qwen call.

3. **The landing InteractiveDemo is a MALL layout** — "SmartPark Control Center — Dubai Mall Level P2",
   zones "Near Entrance / Central / Near Elevators". The spec (§7.1.3) explicitly says:
   "Street Demo (interactive) — NOT a mall layout" — it must be Dubai street bays (the Parkin-gap story).
   This is the leftover the product owner keeps flagging. Replace it (the `/demo` Leaflet street map
   embedded in a frame, or a street-grid SVG version of it).

4. **No mobile app exists.** No React Native project, no PWA manifest, no service worker.
   Spec §2 calls the product "phone-first". Cheapest credible path: make the Next.js app a PWA
   (manifest.json + icons + viewport/theme meta + optional service worker) and present `/demo`
   inside a phone frame on the landing page.

5. **Two divergent data models.** Frontend zones: 312/314/315 "Street 2A — DIC" (pricing types A/B/C, RTA style).
   Backend zones: autoincrement ids 1/2/3 "DIC Parking Zone A/B/C" (pricing_type "hourly"). Spot id formats
   differ too. Unify on the spec's model (string zone ids "312", street names, RTA pricing letters) —
   backend seed is the place to fix, then delete the frontend seed as source of truth.

6. **No TTS.** Spec says spoken responses (SpeechSynthesis fallback). Not implemented (grep: zero
   `speechSynthesis` usage). No `/api/agent/voice` endpoint either (only `/api/agent/text`).

7. **No Parkin integration panel.** Only a mock "Pay via Parkin" button in SpotSheet. Spec §7.5 asks for
   a comparison panel ("Parkin shows zones, SmartPark shows spots") + deep-link mock.

8. **Predictions are seeded random noise** around the time-of-day curve (backend `seed.py`), generated
   once at first boot for the next 12h from that moment — they go stale after 12h and are never
   regenerated. Acceptable for demo, but regenerate on startup and/or compute a rolling moving average
   as the spec suggests.

9. **No Docker/deploy config, no tests.** Spec Phase 7 wants a single-container deploy.

### Security findings (do these FIRST)

- **`push-via-api.sh` contains a hardcoded GitHub fine-grained PAT (line 14).** The file is now
  untracked/ignored, but the token IS in local git history (commits `cc5b6e5` and `b854609`).
  Verified: it was never pushed to the public repo (checked every remote commit tree). HOWEVER,
  if anyone adds a remote and does a normal `git push` of local history, the token leaks publicly.
  Actions:
  1. Revoke/rotate the token at github.com → Settings → Developer settings → Fine-grained tokens.
  2. Stop using the API-push script; use a normal remote: `git remote add origin https://github.com/alexandreybasta-cyber/smartpark-uae.git` and push with `gh auth login` credentials.
  3. Either rewrite local history to purge the token (`git filter-repo --invert-paths --path push-via-api.sh`) or re-init history before pushing normally.
- Backend CORS is `allow_origins=["*"]` with `allow_credentials=True` — fine for a demo, tighten to the frontend origin for the submission.
- When Qwen is added, the DashScope key goes in `backend/.env` (git-ignored), read via `os.environ` — never hardcode.

---

## 2. Work plan (priority order for the hackathon)

### P0 — Security
- Rotate the leaked PAT; purge it from history; switch to normal git push (see above).

### P1 — Wire frontend to backend (make it ONE system)
- `/demo` map: fetch initial zones/spots from `GET /api/zones` (+ spots via zone detail), subscribe to
  `WS /ws/spots`, update markers on `spot_update` messages. Keep the local simulator only as an
  offline fallback for the landing-page widget.
- `/places`: use backend CRUD (`/api/places`) with localStorage fallback.
- `/analytics`: fetch `GET /api/predict/{zone_id}` instead of client-side curves.
- Voice/chat: route the transcript to `POST /api/agent/text` (lat/lng from the demo user location),
  render `reasoning_steps` + `map_card` from the response. Delete `lib/agentResponses.ts` once done —
  no hardcoded numbers may remain.
- Unify the data model per spec §5 (string zone ids "312"/"314"/"315", street names, RTA pricing A–D)
  in `backend/seed.py`; regenerate `smartpark.db` (delete the file; lifespan reseeds).

### P2 — Real Qwen agent (the hackathon's core requirement)
- Backend: add `dashscope` (or OpenAI-compatible endpoint) client. Replace `detect_intent`/keyword
  matching in `backend/agent.py` with a Qwen-Max (or qwen-plus) tool-calling loop exposing tools:
  `resolve_saved_place(name)`, `search_zones_nearby(lat,lng,radius)`, `get_zone_predictions(zone_id)`,
  `rank_zones(candidates)` (keep the existing composite score 0.4·avail + 0.3·proximity + 0.3·prediction
  as the tool implementation). Return the same `AgentTextResponse` shape (text, reasoning_steps, map_card)
  so the frontend contract holds. Stream reasoning steps if time allows.
- Keep a deterministic fallback path (current keyword handler) behind a flag for offline demos —
  label it clearly in the UI ("offline mode").
- LangGraph is optional; a single tool-loop meets the spec's intent. Do not build 4 separate agents
  unless time remains.
- Arabic: Qwen handles it natively — add one Arabic suggestion chip to prove it.

### P3 — Fix the landing page story
- Replace the Dubai Mall `InteractiveDemo` with the street demo (embed the real `/demo` map in a
  browser/phone frame, or rebuild as street-bay grid). Spec §7.1.3: NOT a mall.
- Add the Parkin comparison panel (spec §7.5): "Parkin: Zone 312 — AED 4/hr" vs
  "SmartPark: 7/18 free · nearest Spot 312-05 (~30m)" + mock "Pay with Parkin" deep link.
- Landing copy must match reality: only claim Qwen/agentic once P2 is actually done.

### P4 — "App" credibility
- PWA: `public/manifest.json`, icons, `theme-color`, standalone display; verify installable on a phone.
- Phone-frame section on the landing page showing `/demo` (the spec's §7.2).
- Add TTS via `speechSynthesis.speak()` for agent responses (few lines, big demo effect).

### P5 — Packaging
- `docker-compose.yml` (backend + frontend) or a single Dockerfile per spec Phase 7.
- README: architecture diagram matching what actually exists; demo script (spec §12).
- Remove dead files: `frontend/src/lib/simulator.ts` + `useSimulator` (after P1), duplicate
  `landing/PredictionChart.tsx` vs `predictions/PredictionChart.tsx` — keep one.

## 3. Contract reference (do not break)

`POST /api/agent/text` → `{ text: string, reasoning_steps: string[], map_card?: { zone_id, zone_name, lat, lng, free_spots, total_spots, price_per_hour, walking_minutes } }`

`WS /ws/spots` broadcast → `{ type: "spot_update", spots: [{ id, status, last_changed_at }] }`

Design tokens: spec §10 (already implemented in `globals.css` / Tailwind as `sp-*` classes).

# SmartPark UAE — Continuation Handoff (Audit of 2026-07-07)

---

## ⚡ CONCEPT PIVOT (2026-07-07, after the audit below)

The product owner changed the concept: **SmartPark is no longer a consumer "find a free spot"
app. It is now "SmartPark Enforce" — a parking-compliance platform for the AUTHORITY (RTA /
Dubai Police).** New flow:

1. Bay sensor detects a parked car (hardware unchanged).
2. Platform cross-checks the bay against Parkin/RTA payment records.
3. Grace period (e.g. 10 min) with no payment → **violation trigger pushed to the authority platform** (bay ID, GPS, occupancy time).
4. Agentic layer assists patrol officers: "any unpaid vehicles on my route?", proactive violation alerts, ranked by unpaid duration + detour distance.
5. Replaces today's blind ANPR camera-car sweeps: the patrol drives **straight to the flagged car**; ANPR confirms the plate; the **existing RTA fine system** issues the fine; the fine **confirmation syncs back** to close the loop.

**Already done for the pivot:** the website landing page (`frontend/src/app/page.tsx`) was
rebuilt around this concept with new self-contained components in
`frontend/src/components/enforce/` (EnforceHero, ConceptSteps = animated 5-step concept with
fades, SweepComparison, AgentPoliceDemo = scripted police↔agent chat, SystemSchema = animated
end-to-end loop diagram, EnforceNavbar/Footer). These use EXPLICIT hex colors (dark theme,
spec §10) on purpose — do not convert them to the shared sp-* tokens, which are being re-themed.
Layout metadata updated; the consumer VoiceAgentWidget was removed from the global layout.
The old consumer landing components remain untouched in `frontend/src/components/landing/`.
Production build verified (`next build` passes; all sections visually verified).

**Design upgrade (2026-07-07, later same night):** owner asked for a more expressive,
animated site (reference: a.security) built with Framer Motion, and a new narrative order:
**agentic IoT concept FIRST, then the TWO use cases** (01 driver copilot, 02 enforcement).
Done: `motion` v12 installed in frontend (import from 'motion/react'); new components in
`frontend/src/components/agentic/`: AgenticHero (staggered-word headline, parallax glows,
SENSE·CONNECT·REASON·ACT marquee ticker), AgenticConcept (400vh sticky scroll-driven 4-stage
explainer with per-stage animated visuals — bay sensor, mesh→cloud, Qwen core with orbiting
context chips, agent action split), UseCases (two mission cards with mini looping demos).
Page order now: AgenticHero → AgenticConcept → UseCases → ConceptSteps (retitled "USE CASE 02 ·
THE ENFORCEMENT FLOW") → SweepComparison → AgentPoliceDemo → SystemSchema → Footer. Navbar has
a scroll-progress bar. Build + visual verification passed. NOTE: the parallel session added
routes /driver /enforcement /navigate /parkin-mock — not authored by this session; coordinate
before editing those.

**Still to do for the pivot (in priority order):**
1. Backend: add a violation model + simulator support (spot occupied + no payment session +
   grace expired → violation record; endpoint `GET /api/violations`, WS event `violation`),
   and a `payments` mock table simulating Parkin sessions for ~80% of occupied bays.
2. Backend agent: re-target intents to enforcement (nearby_violations, fine_status,
   assign_patrol) — this is also where the real Qwen integration (P2 below) should land.
3. Mobile app (`mobile/`): pivot from consumer to PATROL app — same map, but red = flagged
   violations; agent tab asks enforcement questions; spot sheet shows "unpaid since / fine
   status" instead of "Pay via Parkin".
4. `/demo`, `/places`, `/analytics` web routes are now off-concept (consumer) — either rebrand
   /demo as the "authority ops map" or remove links to them from the enforcement page.
5. Fine-confirmation loop: mock RTA fine API (`POST /api/fines` + confirmation webhook) so the
   demo can show the closed loop end to end.

---

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

4. **[RESOLVED 2026-07-07] iOS app now exists** — `mobile/` is an Expo (React Native) app,
   built after this audit. Four tabs: Map (Apple Maps, zone polygons, live spot dots via
   `WS /ws/spots`), Agent (chat → `POST /api/agent/text`, animated reasoning steps, map card,
   TTS via expo-speech), Places (backend CRUD via `/api/places`), Insights (SVG prediction chart
   from `/api/predict/{zone_id}` + zone comparison). It derives the backend host from the Expo
   dev-server URI, so a phone on the same Wi-Fi connects automatically; if the backend is
   unreachable it falls back to an on-device simulator + local agent using the SAME scoring
   logic and live-computed numbers (badge shows "OFFLINE DEMO"). Run: `cd mobile && npx expo start`,
   scan QR with Expo Go on iPhone. Verified: `tsc --noEmit` clean, `expo export --platform ios`
   bundles clean, all five consumed endpoints + WebSocket smoke-tested against the running backend.
   Remaining mobile gaps: mic button is a placeholder (real STT needs an Expo dev build with a
   native speech module — cannot run in Expo Go), no app icon/splash artwork yet, and the mobile
   app is the FIRST real consumer of the backend — the web frontend is still disconnected (gap #1).

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

### P4 — "App" credibility [PARTIALLY DONE — iOS app exists in `mobile/`]
- DONE: Expo iOS app with map, agent chat, TTS, places, insights (see gap #4 above).
- Remaining: app icon/splash for `mobile/assets/`; phone-frame section on the landing page
  (spec §7.2) — can show screen recordings of the real iOS app now instead of mockups;
  TTS on the WEB voice widget via `speechSynthesis.speak()` (mobile already has TTS).
- When P2 lands (real Qwen agent in the backend), the iOS app gets it for free — it already
  calls `POST /api/agent/text`. Do not change that contract.

### P5 — Packaging
- `docker-compose.yml` (backend + frontend) or a single Dockerfile per spec Phase 7.
- README: architecture diagram matching what actually exists; demo script (spec §12).
- Remove dead files: `frontend/src/lib/simulator.ts` + `useSimulator` (after P1), duplicate
  `landing/PredictionChart.tsx` vs `predictions/PredictionChart.tsx` — keep one.

## 3. Contract reference (do not break)

`POST /api/agent/text` → `{ text: string, reasoning_steps: string[], map_card?: { zone_id, zone_name, lat, lng, free_spots, total_spots, price_per_hour, walking_minutes } }`

`WS /ws/spots` broadcast → `{ type: "spot_update", spots: [{ id, status, last_changed_at }] }`

Design tokens: spec §10 (already implemented in `globals.css` / Tailwind as `sp-*` classes).

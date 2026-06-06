# Tasks: Phase 1 — Landing Page Complete + Backend API

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,500–2,500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend foundation (Express, MongoDB, middleware) | PR 1 | Base: main; new `backend/` directory |
| 2 | Backend models + auth (schemas, JWT, bcrypt) | PR 2 | Base: PR 1 branch; depends on foundation |
| 3 | Backend public API (tariffs, schedule, availability) | PR 3 | Base: PR 2 branch; depends on models |
| 4 | Landing page sections (Hero, Mission/Vision, Flux AI, WhatsApp, ScrollTop) | PR 4 | Base: main; independent of backend |
| 5 | Landing page interactions (hamburger morph, scroll spy, counters, live clock) | PR 5 | Base: PR 4 branch; depends on sections |
| 6 | Integration + verification (frontend→backend API wiring, smoke tests) | PR 6 | Base: PR 3 + PR 5; merges both tracks |

---

## Phase 1: Backend Foundation (Batch 1)

- [x] 1.1 Create `backend/package.json` with `express`, `mongoose`, `cors`, `dotenv`, `morgan`, `bcryptjs`, `jsonwebtoken` dependencies and `dev`/`start` scripts.
- [x] 1.2 Create `backend/src/config/index.js` to load `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET` from `.env` with sensible defaults (`PORT=3000`, local MongoDB fallback).
- [x] 1.3 Create `backend/src/app.js` — configure Express with `express.json()`, `cors()`, `morgan('dev')`, mount placeholder route modules, and attach a global error handler returning `{ error: "Internal server error" }` with status 500.
- [x] 1.4 Create `backend/src/server.js` — import `app`, connect to MongoDB via Mongoose, log "MongoDB connected" on success, log error without crashing on failure, then start HTTP server on `config.port`.
- [x] 1.5 Create `backend/.env.example` with all required environment variable keys.

## Phase 2: Backend Models + Auth (Batch 2)

- [ ] 2.1 Create `backend/src/models/User.js` — Mongoose schema with `name`, `email` (unique, lowercase), `cedula` (unique), `password`, `role` (enum: `user`/`admin`, default `user`), `phone`; `timestamps: true`; `pre('save')` bcryptjs hash (salt ≥10) skipping if unchanged; `toJSON` transform removing `password`; index on `email` and `cedula`.
- [ ] 2.2 Create `backend/src/models/Vehicle.js` — schema with `plate`, `type` (enum: `car`/`moto`/`suv`/`bike`), `brand`, `model`, `color`, `owner` (ref User); `timestamps: true`; index on `plate`.
- [ ] 2.3 Create `backend/src/models/ParkingSpot.js` — schema with `code`, `zone` (enum: `A`/`B`/`C`), `type` (enum: `car`/`moto`/`bike`), `status` (enum: `available`/`occupied`/`reserved`, default `available`); `timestamps: true`; index on `code`.
- [ ] 2.4 Create `backend/src/models/Reservation.js` — schema with `user`, `vehicle`, `spot` (all ObjectId refs), `entryTime`, `exitTime`, `status` (enum: `active`/`completed`/`cancelled`); `timestamps: true`; index on `status`.
- [ ] 2.5 Create `backend/src/models/Tariff.js` — schema with `vehicleType` (enum), `hourlyRate`, `dailyRate`, `monthlyRate` (all Number, COP); `timestamps: true`.
- [ ] 2.6 Create `backend/src/models/Schedule.js` — schema with `weekdayOpen`, `weekdayClose`, `sundayOpen`, `sundayClose` (all String "HH:mm"); `timestamps: true`.
- [ ] 2.7 Create `backend/src/controllers/authController.js` — `register` (hash password, create User, return 201 with `{ user, accessToken, refreshToken }`), `login` (compare bcrypt, return 200 with tokens), `me` (return 200 with user profile, no password), `refresh` (verify refresh token, return new `accessToken`).
- [ ] 2.8 Create `backend/src/middleware/requireAuth.js` — verify `Authorization: Bearer <token>` via `jwt.verify`, attach `req.user = { id, email, role }`, or return 401 `{ error: "Authentication required" }`.
- [ ] 2.9 Create `backend/src/middleware/requireAdmin.js` — extend `requireAuth`, check `req.user.role === 'admin'`, return 403 `{ error: "Admin access required" }` otherwise.
- [ ] 2.10 Create `backend/src/routes/auth.js` — mount `POST /register`, `POST /login`, `GET /me` (with `requireAuth`), `POST /refresh`.
- [ ] 2.11 Wire `authRoutes` into `app.js` under `/api/auth`.

## Phase 3: Backend Public API (Batch 3)

- [ ] 3.1 Create `backend/src/controllers/publicController.js` — `getTariffs` (query Tariff, return shaped `{ car, moto, suv, bike }` objects), `getSchedule` (return singleton `{ weekday, sunday }`), `getAvailability` (aggregate ParkingSpot into `spots` array and `stats` by type).
- [ ] 3.2 Create `backend/src/routes/public.js` — mount `GET /tariffs`, `GET /schedule`, `GET /parking/availability` (no auth required).
- [ ] 3.3 Wire `publicRoutes` into `app.js` under `/api`.
- [ ] 3.4 Add `express-rate-limit` to `backend/package.json` and configure `limiter` (60 req/min per IP) for public routes; return 429 `{ error: "Too many requests" }` when exceeded.
- [ ] 3.5 Seed `Tariff` and `Schedule` collections with default documents matching frontend fallback values on first server start (optional script or `findOneOrCreate` pattern).

## Phase 4: Landing Page Sections (Batch 4)

- [ ] 4.1 Create `src/components/landing/HeroSection.tsx` — full-viewport background image (`hero-background.png`) with semi-transparent dark overlay, centered "PUNTO PARK U" title and "Estacionamiento Fácil y Sencillo" subtitle; image-failure graceful fallback.
- [ ] 4.2 Create `src/components/landing/MissionVision.tsx` — dual side-by-side cards "Nuestra Misión" (rocket icon) and "Nuestra Visión" (visibility icon) with vanilla text; stack vertically on `<768px`.
- [ ] 4.3 Create `src/components/landing/FluxAISteps.tsx` — numbered 3-step process (1 Visión Computacional, 2 Asignación Inteligente, 3 Analítica Predictiva) with descriptions; include "Latencia Flux" badge showing "0.8 seg".
- [ ] 4.4 Create `src/components/landing/WhatsAppFloat.tsx` — fixed bottom-right button linking to `https://wa.me/573101234567` with pre-filled message, WhatsApp SVG icon, `target="_blank"`.
- [ ] 4.5 Create `src/components/landing/ScrollTopButton.tsx` — hidden until scroll exceeds 300px, visible with transition, on click smooth-scrolls to `window.scrollY = 0`.
- [ ] 4.6 Update `src/pages/LandingPage.tsx` — replace current Hero with `HeroSection`, add `MissionVision` inside `#about`, add `FluxAISteps` inside `#flux-ai`.
- [ ] 4.7 Update `src/components/layout/Layout.tsx` — render `WhatsAppFloat` and `ScrollTopButton` outside `<main>` so they appear on every page.

## Phase 5: Landing Page Interactions (Batch 5)

- [ ] 5.1 Create `src/hooks/useScrollSpy.ts` — IntersectionObserver hook tracking section visibility at 35% threshold, returns active section ID; handles multiple sections by highest intersection ratio.
- [ ] 5.2 Create `src/hooks/useCounter.ts` — accepts target value, returns animated number from 0 to target over ~800ms with easing; triggered by IntersectionObserver.
- [ ] 5.3 Create `src/hooks/useLiveClock.ts` — returns `new Date().toLocaleTimeString("es-CO")` updating every second; cleans up interval on unmount.
- [ ] 5.4 Update `src/components/layout/Header.tsx` — replace static hamburger icon with animated SVG vehicle morph (car → moto → bike) cycling on each toggle; use `appStore.isMobileMenuOpen`; lock body scroll when open; `MobileNav` links close overlay then scroll after 520ms.
- [ ] 5.5 Integrate `useScrollSpy` into `Header.tsx` — apply `text-primary` to active nav link matching observed section; desktop anchor links smooth-scroll with header height + 15px offset.
- [ ] 5.6 Update `src/components/layout/Footer.tsx` — display live timestamp via `useLiveClock` in a new footer element.
- [ ] 5.7 Update `src/components/landing/AvailabilitySection` (or `LandingPage` Availability cards) — wire `useCounter` to animate stat numbers on scroll-into-view.

## Phase 6: Integration + Verification (Batch 6)

- [ ] 6.1 Update `src/services/parking.service.ts` — change endpoint paths from `/parking/tariffs` to `/api/tariffs`, `/parking/schedule` to `/api/schedule`, `/parking/availability` to `/api/parking/availability` (align with backend public API routes).
- [ ] 6.2 Update `src/services/api.ts` (or Axios base config) — ensure base URL points to `http://localhost:3000` (or `VITE_API_URL` env var) and CORS headers are accepted.
- [ ] 6.3 Verify `appStore.fetchTariffs` consumes `GET /api/tariffs` and falls back to hardcoded defaults on 503/error.
- [ ] 6.4 Verify `appStore.fetchSchedule` consumes `GET /api/schedule` and falls back on error.
- [ ] 6.5 Verify `appStore.fetchAvailability` consumes `GET /api/parking/availability` and falls back on error.
- [ ] 6.6 Run backend smoke tests: `POST /api/auth/register` returns 201 with JWT; `POST /api/auth/login` returns 200; `GET /api/auth/me` returns 401 without token; `GET /api/tariffs` returns pricing; `GET /api/parking/availability` returns stats.
- [ ] 6.7 Run frontend smoke tests: all 10 sections render; hamburger cycles SVGs; nav highlights on scroll; WhatsApp link opens; ScrollTop appears at 300px; live timestamp ticks; counters animate.
- [ ] 6.8 Update `openspec/changes/phase-1-landing-backend/design.md` (if applicable) with any implementation deviations discovered during tasking.

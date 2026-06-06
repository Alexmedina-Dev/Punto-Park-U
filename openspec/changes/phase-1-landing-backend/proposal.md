# Proposal: Phase 1 — Landing Page Complete + Backend API

## Intent

Migrate remaining vanilla landing page sections to full parity and build the Node.js backend foundation — replacing localStorage with MongoDB Atlas, real API endpoints, and JWT authentication. The landing page currently has 7 of 10 sections; the backend is entirely absent.

## Scope

### In Scope
- 10-section landing page parity: Hero bg image overlay, Mission/Vision cards, Flux AI 3-step process, WhatsApp float button, ScrollTop button
- Animated hamburger menu with SVG vehicle morphing (car/moto/bike), IntersectionObserver nav highlighting, smooth scroll with offset, counter animations, live timestamp
- Node.js + Express backend scaffold: `backend/` with controllers, models, routes, middleware
- MongoDB Atlas M0 connection + Mongoose models: User, Vehicle, Reservation, ParkingSpot, Tariff, Schedule
- JWT auth (access + refresh tokens, bcryptjs) + role-based middleware (user/admin)
- Public API: `GET /api/tariffs`, `GET /api/schedule`, `GET /api/parking/availability`
- Auth API: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`

### Out of Scope
- Login/Register pages (Phase 2), User/Admin dashboards (Phase 3-4), Flux AI microservices (Phase 5)
- Deployment to Vercel/Railway, testing, PDF/Excel, WebSocket, vehicle CRUD, reservations, reports

## Capabilities

### New Capabilities
- `landing-sections`: Hero with bg image + overlay, Mission/Vision dual cards, Flux AI 3-step numbered process, WhatsApp floating button, Scroll-to-top button
- `landing-interactions`: Smooth scroll with header offset, IntersectionObserver nav highlight, animated hamburger (SVG car/moto/bike morph), counter animations, live timestamp
- `backend-foundation`: Node.js + Express project structure — `backend/src/{controllers,models,routes,middleware}`, `app.js`, `server.js`
- `backend-models`: Mongoose schemas — User, Vehicle, Reservation, ParkingSpot, Tariff, Schedule
- `backend-auth`: JWT with access+refresh tokens, bcryptjs hashing, role-based middleware (`requireAuth`, `requireAdmin`)
- `backend-public-api`: `GET /api/tariffs`, `GET /api/schedule`, `GET /api/parking/availability` — consumed by landing page Zustand store

### Modified Capabilities
- `app-shell`: Hamburger upgraded from static icon to animated SVG vehicle morphing; Footer adds live timestamp; WhatsApp float + ScrollTop added to Layout shell
- `state-management`: `appStore.fetchTariffs`, `fetchSchedule`, `fetchAvailability` already call API; backend deployment replaces fallback data with real responses

## Approach

Strangler Fig — frontend sections built component-by-component against vanilla reference at `Punto-Park-U-Web/index.html`. Backend built as standalone Express app in `/backend/`, connected to MongoDB Atlas M0. Data flow: React → Axios → Express Router → Mongoose → MongoDB. Frontend keeps API fallbacks (already in appStore) so landing page works offline during backend development.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/LandingPage.tsx` | Modified | Add Hero bg, Mission/Vision, Flux AI 3-step, WhatsApp, ScrollTop |
| `src/components/layout/Header.tsx` | Modified | Animated SVG hamburger replacing static menu/close icon |
| `src/components/layout/Footer.tsx` | Modified | Live timestamp display |
| `src/components/landing/` | New | HeroSection, MissionVision, FluxAISteps, WhatsAppFloat, ScrollTopButton |
| `src/hooks/` | New | useScrollSpy, useCounter, useLiveClock |
| `backend/` | New | Complete Express + MongoDB project |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| MongoDB Atlas M0 512MB limit | Low | Lean schemas, indexes on query fields, monitor Atlas dashboard |
| Backend blocks frontend progress | Medium | Frontend already has API fallbacks; backend built in parallel |
| TypeScript learning curve for Node | Medium | Use plain JS for Express initially, migrate to TS later |
| Vanilla SVG animations hard to port | Low | Keep SVG paths verbatim; Framer Motion for morph transitions |

## Rollback Plan

- **Landing page**: Keep current `LandingPage.tsx` as baseline; new sections gated by feature flag (`VITE_SHOW_ALL_SECTIONS`) until validated
- **Backend**: Frontend gracefully falls back to hardcoded data when API unreachable (already implemented in `appStore.ts`)
- **Full rollback**: Revert to Phase 0 state; vanilla reference at `Punto-Park-U-Web` remains untouched

## Dependencies

- Phase 0 complete — Vite + React 18 + Tailwind + Zustand + React Router + Axios
- MongoDB Atlas account (M0 free tier)
- Node.js 18+ locally
- Reference: `C:\Projects\Punto-Park-U-Web` (read-only)

## Success Criteria

- [ ] Landing page renders all 10 sections matching vanilla `index.html` visually
- [ ] Animated hamburger morphs through car → moto → bike SVG icons
- [ ] Nav highlights active section on scroll (IntersectionObserver)
- [ ] WhatsApp float button links to `https://wa.me/573101234567`
- [ ] Live timestamp updates every second in footer
- [ ] `POST /api/auth/register` creates user with hashed password, returns JWT
- [ ] `POST /api/auth/login` validates credentials, returns access + refresh tokens
- [ ] `GET /api/tariffs` returns pricing from MongoDB, fallback from appStore on error
- [ ] `GET /api/parking/availability` returns live spot stats from MongoDB
- [ ] Protected routes reject requests without valid JWT (401)

## Proposal Question Round

> These questions help sharpen the PRD before specs and design. Answer, skip, or correct.

1. **Business rules**: Should the public `/api/tariffs` and `/api/availability` endpoints be rate-limited? Any expected traffic volume for the landing page?
2. **Edge cases**: When MongoDB Atlas is unreachable, should the landing page show a subtle "datos estimados" indicator, or remain silent with fallback data?
3. **Scope boundary**: The Flux AI 3-step section on landing is purely marketing now. Should it display live stats from the AI modules (Phase 5) via placeholder API, or remain static until Phase 5?
4. **Deployment timing**: Should the backend be deployed to Railway during Phase 1 (so landing page hits real API), or deferred until Phase 2 (frontend uses fallbacks)?
5. **Vehicle images**: The vanilla pricing cards show AI-generated vehicle images per type. Are all 4 images (auto, moto, camioneta, bici) available in `Images/Google AI/`?

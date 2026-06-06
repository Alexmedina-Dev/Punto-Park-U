# Design: Phase 1 — Landing Page Complete + Backend API

## Technical Approach

Build the 5 remaining landing sections (Hero bg, Mission/Vision, Flux AI 3-step, WhatsApp float, ScrollTop) against the vanilla reference, and scaffold a standalone Express backend in `backend/`. Frontend uses existing API fallbacks in `appStore` so it works offline during backend development.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Backend language | JavaScript (Node 18) | TypeScript | Developer is new to TS; proposal says "JS initially, migrate later" |
| Backend structure | Layered Express | MVC framework | Standard pattern, easy to teach |
| Auth tokens | JWT access (15min) + refresh (7d) | Single long-lived token | Security best practice; refresh reduces re-login |
| Password hashing | bcryptjs | crypto | Industry standard, async API |
| Validation | express-validator | Joi/Zod | Simpler JS syntax; no TS complexity |
| Rate limiting | express-rate-limit | custom middleware | Battle-tested, simple config |
| Animations | CSS + IntersectionObserver | Framer Motion | Landing page is CSS-heavy; Framer Motion only for SVG morph |
| Image loading | `<picture>` avif/webp | Next.js Image | Vite project; manual responsive images |

## Data Flow

**Frontend → Backend**
```
LandingPage ──→ useParkingData ──→ appStore.fetch* ──→ parking.service.ts ──→ Axios ──→ Express
     │                                                                            │
     └─← fallback data ───────────────────────────────────────────────────────────┘
```

**Backend Request Lifecycle**
```
Request ──→ rate-limit ──→ cors ──→ helmet ──→ express.json ──→ route handler
                                                              │
                                                              ↓
                                                    Mongoose ──→ MongoDB Atlas
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/landing/HeroSection.tsx` | Create | Full-viewport bg image with dark overlay |
| `src/components/landing/MissionVision.tsx` | Create | Dual cards for About section |
| `src/components/landing/FluxAISteps.tsx` | Create | 3-step numbered process |
| `src/components/landing/WhatsAppFloat.tsx` | Create | Fixed bottom-right button |
| `src/components/landing/ScrollTopButton.tsx` | Create | Appears after 300px scroll |
| `src/hooks/useScrollSpy.ts` | Create | IntersectionObserver nav highlighting |
| `src/hooks/useCounter.ts` | Create | Animated number counting |
| `src/hooks/useLiveClock.ts` | Create | `es-CO` timestamp interval |
| `src/components/layout/Header.tsx` | Modify | Animated SVG hamburger (car→moto→bike) |
| `src/components/layout/Footer.tsx` | Modify | Live timestamp display |
| `src/components/layout/Layout.tsx` | Modify | Render WhatsApp + ScrollTop |
| `src/pages/LandingPage.tsx` | Modify | Integrate new sections |
| `backend/` | Create | Express + Mongoose project |
| `backend/src/config/` | Create | Environment variables |
| `backend/src/middleware/` | Create | auth, rateLimit, errorHandler |
| `backend/src/models/` | Create | 6 Mongoose schemas |
| `backend/src/controllers/` | Create | auth, public, parking |
| `backend/src/routes/` | Create | auth, public |
| `backend/src/app.js` | Create | Express middleware stack |
| `backend/src/server.js` | Create | Server entry point |

## Landing Page Design

### Component Tree (10 Sections)
```
LandingPage
├── HeroSection (bg image + overlay)
├── WhyUsSection (4 cards)
├── AboutSection
│   ├── MissionVision (2 cards)
│   └── History
├── PricingSection
├── AvailabilitySection
│   └── Counter (useCounter hook)
├── FluxAISection
│   └── FluxAISteps (3 numbered steps)
├── LocationSection
├── WhatsAppFloat
└── ScrollTopButton
```

### Data Flow
```
useParkingData (hook)
  ├── fetchTariffs() → parking.service.ts → GET /api/tariffs
  ├── fetchSchedule() → parking.service.ts → GET /api/schedule
  └── fetchAvailability() → parking.service.ts → GET /api/parking/availability
```

### Animation Strategy

| Animation | Technology | Reason |
|-----------|-----------|--------|
| Section fade-in | CSS + IntersectionObserver | GPU-composited, no JS overhead |
| Counter numbers | useCounter + IntersectionObserver | Triggered once on scroll-into-view |
| Hamburger SVG morph | CSS transitions + state cycling | Simple DOM toggle, car→moto→bike |
| Scroll-to-top | CSS transition + scrollTo | Native smooth scroll |
| Mobile overlay | CSS transform | GPU-accelerated slide |

### Mobile Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|---------------|
| < 640px (sm) | Single column, stacked cards, hamburger menu |
| 640-1024px (md) | 2-column grids, reduced padding |
| > 1024px (lg) | Full desktop nav, 4-column grids, side-by-side |

### Image Loading Strategy
- `<picture>` element with avif/webp/png fallbacks
- `loading="lazy"` for below-fold images
- `decoding="async"` for non-blocking decode
- Hero image: eager load with `fetchpriority="high"`

## Backend Design

### Express App Structure
```
backend/
├── src/
│   ├── config/       # Environment variables
│   ├── middleware/   # auth, rateLimit, errorHandler
│   ├── models/       # User, Vehicle, ParkingSpot, Reservation, Tariff, Schedule
│   ├── controllers/  # authController, publicController
│   ├── routes/       # auth.js, public.js
│   ├── app.js        # Express setup
│   └── server.js     # Entry point
└── package.json
```

### Middleware Pipeline
```
app.js order:
1. helmet() — security headers
2. cors({ origin: VITE_DEV_URL }) — frontend origin
3. express.json() — body parsing
4. express-rate-limit({ windowMs: 60000, max: 60 }) — rate limiting
5. morgan('dev') — logging
6. Route handlers
7. Global error handler — { error: "Internal server error" } 500
```

### MongoDB Schemas

| Model | Key Fields | Indexes |
|-------|-----------|---------|
| User | name, email, cedula, password, role, phone | email, cedula |
| Vehicle | plate, type, brand, model, color, owner | plate |
| ParkingSpot | code, zone, type, status | code |
| Reservation | user, vehicle, spot, entryTime, exitTime, status | status |
| Tariff | vehicleType, hourlyRate, dailyRate, monthlyRate | vehicleType |
| Schedule | weekdayOpen, weekdayClose, sundayOpen, sundayClose | — |

Password hashing via `pre('save')` hook with bcryptjs (salt ≥ 10). `toJSON` transform removes `password` field.

### JWT Flow
```
POST /api/auth/register → hash password → create User → return {user, accessToken, refreshToken}
POST /api/auth/login → compare password → return {user, accessToken, refreshToken}
GET /api/auth/me → verify accessToken → return user profile
POST /api/auth/refresh → verify refreshToken → return new accessToken
```
Access token: 15min. Refresh token: 7d. Secrets: `JWT_SECRET`, `JWT_REFRESH_SECRET`.

### API Route Structure

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/auth/register` | POST | No | Create user |
| `/api/auth/login` | POST | No | Authenticate |
| `/api/auth/me` | GET | Yes | Current user |
| `/api/auth/refresh` | POST | No | New access token |
| `/api/tariffs` | GET | No | All pricing |
| `/api/schedule` | GET | No | Operating hours |
| `/api/parking/availability` | GET | No | Spot stats |

### Error Handling
- Global error handler returns `{ error: message }` with appropriate status
- MongoDB duplicate key (11000) → 409 Conflict
- Validation errors → 400 Bad Request
- Auth errors → 401/403

### Validation
express-validator for request body:
- register: name, email, cedula, password required
- login: email, password required

## Integration Design

### Frontend ↔ Backend Communication
- Axios instance with `baseURL` from `VITE_API_URL`
- Request interceptor: attach `Bearer` token from localStorage
- Response interceptor: 401 → clear token + redirect to login

### State Management Updates
- `appStore`: `fetchTariffs`, `fetchSchedule`, `fetchAvailability` already exist
- `authStore`: `login`/`register` updated to use new backend endpoints
- No new stores needed

### API Service Layer
- `parking.service.ts` already calls `/parking/*` endpoints
- `auth.service.ts` already calls `/auth/*` endpoints
- Update `baseURL` to point to backend port (4000)

### Offline Fallback Strategy
- `appStore` catch blocks set fallback data (already implemented)
- `showErrorToast` displays user-friendly message
- `withRetry` retries 3x with exponential backoff

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Counter animation, scroll spy | Manual visual check |
| Integration | Auth flow | Manual via Postman/frontend |
| E2E | All sections render | `npm run build` + visual walkthrough |

## Migration / Rollout

No data migration — greenfield backend. Frontend fallbacks already implemented.

## Open Questions

- [ ] Should we add `helmet` to middleware pipeline now or defer to Phase 2?
- [ ] Should backend be deployed to Railway during Phase 1 or deferred to Phase 2?

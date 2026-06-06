# Exploration: Migration Strategy — Punto Park U (Vanilla → React + TypeScript)

## Document Info
- **Project**: punto-park-u
- **Mode**: OpenSpec (file-based)
- **Reference**: `C:\Projects\Punto-Park-U-Web` (vanilla, read-only)
- **Target**: `C:\Projects\Punto-Park-U` (React + TypeScript + Vite)
- **Date**: 2026-06-06
- **Author**: SDD Explore Executor

---

## 1. Current State Analysis

### 1.1 Reference Project (Vanilla)
The reference project is a fully functional multi-page vanilla HTML/CSS/JS application with the following structure:

```
Punto-Park-U-Web/
├── index.html              # Landing page (700 lines, 10 sections)
├── Styles.css              # 1738 lines of custom CSS (dark mode, glassmorphism)
├── Login/
│   ├── Login.html          # Login form
│   ├── Login.js            # 73 lines — hardcoded auth, localStorage
│   └── Pantalla Usuario/
│       ├── PantallaUsuario.html  # User dashboard
│       └── pantalla-usuario.js # 354 lines — vehicle/reservation state
├── Registro/
│   ├── Registro.html       # Registration form
│   ├── Registro.js         # 149 lines — form validation, localStorage
│   ├── Registro-exitoso/   # Success screen
│   └── Pantalla-error/     # Error screen
├── Administrador/
│   ├── Admi.html           # Admin login
│   ├── Admi.js             # Admin auth guard
│   └── Panel/
│       ├── PanelAdmi.html   # Admin dashboard (complex, multi-view)
│       ├── panel.css        # Admin-specific styles
│       ├── panel.js         # 1133+ lines — reports, charts, PDF/Excel export
│       └── modules.js       # 296 lines — operators, heatmap, integrations
├── Images/                  # Assets, logos, AI-generated images
└── plan-flux-ai.txt         # 310 lines — AI system specification
```

### 1.2 Key Characteristics
| Aspect | Vanilla Implementation |
|--------|----------------------|
| **State** | Global `let state` objects + localStorage |
| **Auth** | Hardcoded users (`admin`/`admin1234`) + localStorage |
| **Routing** | Multi-page HTML links (`href="Login/Login.html"`) |
| **Styling** | Custom CSS variables, ~1738 lines, dark mode, glassmorphism |
| **Data** | 100% localStorage (no backend) |
| **Charts** | None (dashboard uses mock data + sparklines) |
| **Reports** | jsPDF + autoTable + XLSX (loaded via CDN) |
| **Responsive** | Mobile-first with hamburger menu, overlay |
| **Icons** | Material Symbols Outlined (Google Fonts) |

### 1.3 Current Target Project
```
Punto-Park-U/
├── .git/
├── .atl/
├── .gitignore
└── openspec/
    ├── config.yaml          # OpenSpec configuration
    ├── specs/               # Domain specifications (6 domains)
    │   ├── _meta/
    │   ├── landing/
    │   ├── auth/
    │   ├── admin/
    │   ├── user-panel/
    │   ├── reservations/
    │   ├── flux-ai/
    │   └── api/
    └── changes/
        └── archive/
```

**Status**: Empty project skeleton. No React code, no backend, no infrastructure.

---

## 2. Migration Strategy: Strangler Fig Pattern

### 2.1 Why Strangler Fig?
Given the complexity of the reference project (7+ pages, 2000+ lines of JS, 1700+ lines of CSS), a **big bang rewrite** is too risky. Instead, we use the **Strangler Fig Pattern**:

1. **Build the new React app alongside** the vanilla reference
2. **Migrate domain by domain** (landing → auth → user-panel → admin)
3. **Keep the vanilla project as reference** until full migration
4. **Introduce backend API early** (Phase 1) so new features can use real data
5. **Redirect traffic** to the new app only when a domain is complete

### 2.2 Migration Principles
- **Read-only reference**: Never modify `Punto-Park-U-Web`
- **Component parity**: Each vanilla section maps to a React component
- **Data bridge**: localStorage → Zustand → API (progressive enhancement)
- **Styling continuity**: Port CSS variables to Tailwind config
- **Feature freeze**: No new features in vanilla during migration

---

## 3. Phase Sequencing (0-5)

### Phase 0: Foundation & Tooling (Week 1)
**Goal**: Set up the development environment and project skeleton.

**Tasks**:
- Initialize React 18 + TypeScript + Vite project
- Configure Tailwind CSS v3.4 with custom theme (port CSS variables)
- Set up Zustand stores (appStore + authStore)
- Install React Router v6 with route structure
- Configure path aliases (`@/components`, `@/stores`, etc.)
- Set up sonner for toast notifications
- Set up ErrorBoundary
- Create base layout components (Header, Footer, MobileNav)
- Port CSS variables to `tailwind.config.js` (dark mode tokens, glassmorphism)
- Create shared UI components (Button, Card, Badge, Input, Modal)

**Deliverables**:
- `npm run dev` works with a blank page
- Storybook-style component playground (optional)
- Tailwind config with all custom tokens

**Dependencies**: None (start of project)

---

### Phase 1: Landing Page + Backend API (Weeks 2-3)
**Goal**: Migrate the landing page and build the backend foundation.

**Frontend Tasks**:
- Create `LandingPage.tsx` with all 10 sections from `index.html`
- Implement section components: Hero, WhyUs, About, Pricing, Availability, FluxAI, Location, Footer
- Port vanilla JS behaviors to React hooks:
  - Hamburger menu → `useState` + `useEffect`
  - Smooth scroll → `useRef` + `scrollIntoView`
  - Live timestamp → `useEffect` + `setInterval`
  - IntersectionObserver → `useInView` hook (or custom)
  - Scroll-to-top → `useScroll` hook
- Port localStorage price/schedule reading to Zustand store
- Create WhatsApp float component
- Create ScrollTop component
- Implement responsive mobile navigation

**Backend Tasks**:
- Initialize Node.js + Express project
- Configure MongoDB Atlas connection (M0 free tier)
- Set up Mongoose models: User, Vehicle, Reservation, ParkingSpot, Tariff, Schedule
- Implement JWT auth middleware (access + refresh tokens)
- Implement bcryptjs password hashing
- Create API endpoints:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `GET /api/auth/me`
  - `GET /api/tariffs` (public — for landing page pricing)
  - `GET /api/schedule` (public — for landing page hours)
  - `GET /api/parking/availability` (public — for live gauges)

**Deliverables**:
- Landing page renders identically to vanilla
- Backend API serves pricing, schedule, and availability data
- All landing page data comes from API (no more hardcoded prices)

**Dependencies**: Phase 0 complete

---

### Phase 2: Authentication System (Weeks 4-5)
**Goal**: Replace hardcoded auth with full JWT-based authentication.

**Frontend Tasks**:
- Create `LoginPage.tsx` with form validation
- Create `RegisterPage.tsx` with all validation rules from `Registro.js`
- Create `ForgotPassword.tsx` (new feature — not in vanilla)
- Implement `AuthGuard` HOC for protected routes
- Build `authStore` (Zustand slice) with:
  - `user`, `isAuthenticated`, `isAdmin`
  - `login()`, `logout()`, `register()`, `refreshToken()`
- Implement JWT token storage (httpOnly cookie or secure localStorage)
- Add login/register links to landing page header
- Create success/error toast notifications (replace alert-based errors)

**Backend Tasks**:
- Complete auth endpoints:
  - `POST /api/auth/admin/login` (separate admin login)
  - `POST /api/auth/forgot-password` (email simulation)
  - `POST /api/auth/reset-password`
- Implement role-based access control (RBAC)
  - `user` role: access to user-panel
  - `admin` role: access to admin-panel
- Add auth middleware to protect all non-public routes

**Deliverables**:
- Users can register, login, logout
- JWT tokens managed securely
- Role-based routing works
- Admin login is separate from user login

**Dependencies**: Phase 1 complete (backend running)

---

### Phase 3: User Panel (Weeks 6-7)
**Goal**: Migrate the user dashboard with vehicles and reservations.

**Frontend Tasks**:
- Create `UserLayout.tsx` with sidebar + bottom tabs (mobile)
- Create `UserDashboard.tsx` (home view with stats)
- Create `VehiclesPage.tsx`:
  - List vehicles (port from `pantalla-usuario.js`)
  - Add/edit/delete vehicle modals
  - Vehicle type selector (Carro/Moto/Bicicleta)
- Create `ReservationsPage.tsx`:
  - Active reservation display
  - Make reservation form
  - Payment simulation (PSE)
  - Cancel reservation
- Create `ProfilePage.tsx`:
  - Edit profile form
  - Change password modal
  - Notification preferences (save to Zustand + API)
- Create `UserLocation.tsx` (map + directions)
- Implement `appStore` (Zustand slice) for:
  - Vehicles list, active reservation, user profile
  - Notification settings

**Backend Tasks**:
- Implement vehicle CRUD endpoints:
  - `GET /api/vehicles` (user's vehicles)
  - `POST /api/vehicles`
  - `PUT /api/vehicles/:id`
  - `DELETE /api/vehicles/:id`
- Implement reservation endpoints:
  - `GET /api/reservations`
  - `POST /api/reservations`
  - `PUT /api/reservations/:id`
  - `DELETE /api/reservations/:id`
- Implement user profile endpoints:
  - `GET /api/users/me`
  - `PUT /api/users/me`
  - `PUT /api/users/me/password`

**Deliverables**:
- User panel fully functional with real backend data
- Vehicle CRUD works
- Reservations work with payment simulation
- Profile updates persist

**Dependencies**: Phase 2 complete (auth system)

---

### Phase 4: Admin Panel (Weeks 8-10)
**Goal**: Migrate the admin dashboard — the most complex domain.

**Frontend Tasks**:
- Create `AdminLayout.tsx` with sidebar navigation
- Create `AdminDashboard.tsx`:
  - KPI cards (ingresos, vehículos, ocupación, ticket promedio)
  - Sparkline charts (lazy-loaded Chart.js)
  - Recent vehicles table
  - Occupancy-by-hour widget
- Create `ParkingMap.tsx`:
  - Visual grid of parking spots (port from `initParkingMap()`)
  - Zone-based coloring (Zona A, B, C)
  - Occupied/free status
- Create `TariffManagement.tsx`:
  - Vehicle type tabs (Carro/Moto/Bicicleta)
  - Hour/day/month price inputs
  - Live preview cards
  - Save to backend (no more localStorage)
- Create `ScheduleManagement.tsx`:
  - Weekday/Sunday time inputs
  - Live preview
  - Save to backend
- Create `ReportsPage.tsx`:
  - Report type selector (daily/monthly/vehicle/financial)
  - Date/moth/plate/range filters
  - Validation rules (port from `validateReportState()`)
  - PDF export (lazy-loaded jsPDF + autoTable)
  - Excel export (lazy-loaded XLSX)
  - Report preview table with KPIs
- Create `MonitoringPage.tsx`:
  - Operator monitoring cards (port from `modules.js`)
  - Occupancy heatmap (7 days × 24 hours)
  - Integration status cards
- Create `SystemStatus.tsx` (new feature)

**Backend Tasks**:
- Implement admin endpoints:
  - `GET /api/admin/users` (list all users)
  - `GET /api/admin/reports` (generate report data)
  - `PUT /api/admin/tariffs` (update pricing)
  - `PUT /api/admin/schedule` (update hours)
  - `GET /api/admin/activity` (recent activity log)
  - `GET /api/parking/stats` (occupancy statistics)
  - `GET /api/parking/spots` (list all spots)
  - `PUT /api/parking/spots/:id` (update spot)
- Add admin middleware (`requireAdmin`)
- Implement report data aggregation (mock data for MVP)

**Deliverables**:
- Admin panel fully functional
- Dashboard with charts and KPIs
- Parking map with live occupancy
- Tariff and schedule management persist to DB
- Reports generate PDF and Excel
- Monitoring shows operators, heatmap, integrations

**Dependencies**: Phase 3 complete (user panel + vehicle/reservation APIs)

---

### Phase 5: Flux AI Integration (Weeks 11-12)
**Goal**: Integrate the AI modules (Python microservices).

**Frontend Tasks**:
- Enhance landing page Flux AI section with live metrics
- Add admin dashboard widgets for:
  - AI recognition accuracy
  - Real-time vehicle detection feed
  - Predictive occupancy chart
- Create `FluxAIMonitor.tsx` (new admin view)
- Add WebSocket listeners for real-time updates

**Backend Tasks**:
- Set up Python FastAPI microservices:
  - **Vision Module** (Port 4001): EasyOCR + OpenCV for plate recognition
  - **Analytics Module** (Port 4002): Scikit-learn + Prophet for predictions
- Implement API Gateway in Node.js to proxy AI requests
- Add WebSocket events for real-time updates:
  - Vehicle entry/exit events
  - Occupancy changes
  - AI detection results
- Deploy Python services to Render free tier

**Deliverables**:
- Flux AI modules running as separate services
- Frontend receives real-time updates via WebSocket
- AI features visible in admin dashboard

**Dependencies**: Phase 4 complete (admin panel + full backend)

---

## 4. Component Mapping (Vanilla → React)

### 4.1 Landing Page (`index.html` → `LandingPage.tsx`)

| Vanilla Element | React Component | Notes |
|-----------------|-----------------|-------|
| `<header>` + `<nav>` | `LandingHeader.tsx` | Extract mobile menu logic to hook |
| `#mobile-overlay` | `MobileMenu.tsx` | Use `AnimatePresence` for transitions |
| `.hero` | `HeroSection.tsx` | Keep background image + overlay |
| `.why` | `WhyUsSection.tsx` | 4 cards, map from data array |
| `.about` | `AboutSection.tsx` | History + Mission/Vision grid |
| `.rates` | `PricingSection.tsx` | Fetch prices from API, not localStorage |
| `.availability` | `AvailabilitySection.tsx` | Live gauges with API data |
| `.flux` | `FluxAISection.tsx` | Static content (enhanced in Phase 5) |
| `.location` | `LocationSection.tsx` | Map image + address + schedule |
| `<footer>` | `Footer.tsx` | Reuse across all pages |
| `.whatsapp-float` | `WhatsAppFloat.tsx` | Reusable floating action button |
| `.scroll-top` | `ScrollTopButton.tsx` | Global component |
| `setInterval(timestamp)` | `useLiveClock()` hook | Custom hook |
| `IntersectionObserver` | `useInView()` hook | From `react-intersection-observer` or custom |
| `localStorage` prices | `useTariffs()` hook | Fetches from `/api/tariffs` |

### 4.2 Authentication (`Login/` + `Registro/` → `auth/` domain)

| Vanilla File | React Component | Notes |
|--------------|-------------------|-------|
| `Login.html` | `LoginPage.tsx` | Form with validation, error states |
| `Login.js` | `useAuth()` hook | Replaces global functions |
| `Registro.html` | `RegisterPage.tsx` | Multi-field form |
| `Registro.js` | `useRegister()` hook | Validation logic ported |
| `Pantalla-error/` | `ErrorPage.tsx` | Generic error with message param |
| `Registro-exitoso/` | `SuccessPage.tsx` | Registration success screen |
| Hardcoded users | `POST /api/auth/login` | Backend validates credentials |
| `localStorage` session | `authStore` (Zustand) | JWT tokens + user object |

### 4.3 User Panel (`Login/Pantalla Usuario/` → `user-panel/` domain)

| Vanilla File | React Component | Notes |
|--------------|-------------------|-------|
| `PantallaUsuario.html` | `UserLayout.tsx` | Sidebar + mobile bottom tabs |
| `pantalla-usuario.js` | `useUserData()` hook | State + API calls |
| `showTab()` | `UserNav.tsx` + React Router | `/user/home`, `/user/vehicles`, etc. |
| `renderVehicles()` | `VehiclesList.tsx` | Grid of vehicle cards |
| `openEditModal()` | `EditVehicleModal.tsx` | Reusable modal component |
| `openAddModal()` | `AddVehicleModal.tsx` | Vehicle type selector |
| `renderActiveReservation()` | `ActiveReservationCard.tsx` | Status badge, timer, actions |
| `makeReservation()` | `ReservationForm.tsx` | Vehicle select + payment method |
| `toggleProfileForm()` | `ProfileForm.tsx` | Toggle between display/edit |
| `saveNotificationSettings()` | `NotificationSettings.tsx` | Checkboxes + Zustand persist |
| `showToast()` | `sonner` toast | Global toast system |

### 4.4 Admin Panel (`Administrador/` → `admin/` domain)

| Vanilla File | React Component | Notes |
|--------------|-------------------|-------|
| `Admi.html` | `AdminLoginPage.tsx` | Separate admin login route |
| `Admi.js` | `useAdminAuth()` hook | Session guard + dev bypass |
| `PanelAdmi.html` | `AdminLayout.tsx` | Sidebar + topbar + main content |
| `panel.js` (dashboard) | `AdminDashboard.tsx` | KPIs + sparklines + recent table |
| `panel.js` (mapa) | `ParkingMap.tsx` | Zone grids with spot status |
| `panel.js` (tarifas) | `TariffManagement.tsx` | Tabs + inputs + live preview |
| `panel.js` (horarios) | `ScheduleManagement.tsx` | Time inputs + preview |
| `panel.js` (informes) | `ReportsPage.tsx` | Complex report builder |
| `panel.js` (PDF) | `usePDFExport()` hook | Lazy load jsPDF + autoTable |
| `panel.js` (Excel) | `useExcelExport()` hook | Lazy load XLSX |
| `modules.js` (operators) | `OperatorMonitoring.tsx` | Cards with status + stats |
| `modules.js` (heatmap) | `OccupancyHeatmap.tsx` | 7×24 grid with tooltips |
| `modules.js` (integrations) | `IntegrationStatus.tsx` | System status cards |
| `initCharts()` | `ChartWidget.tsx` | Lazy load Chart.js |
| `initSparklines()` | `SparklineChart.tsx` | Mini charts for dashboard |

---

## 5. Data Flow Architecture

### 5.1 Progressive Enhancement Strategy
The migration follows a **three-stage data flow**:

```
Stage 1: Static (Week 1-2)
├── Frontend: Hardcoded data in components
├── No backend
└── Goal: UI parity with vanilla

Stage 2: Zustand + localStorage (Week 2-3)
├── Frontend: Zustand stores with persist middleware
├── localStorage as "database"
├── No backend yet
└── Goal: Interactive state management

Stage 3: API + MongoDB (Week 3+)
├── Frontend: Zustand stores → API calls
├── Backend: Node.js + Express + MongoDB
├── localStorage only for JWT tokens
└── Goal: Full data persistence
```

### 5.2 Store Architecture

```typescript
// appStore.ts — Global application state
interface AppState {
  // UI state
  isMobileMenuOpen: boolean;
  isLoading: boolean;
  
  // Data (from API)
  tariffs: Tariffs;
  schedule: Schedule;
  availability: Availability;
  
  // Actions
  fetchTariffs: () => Promise<void>;
  fetchSchedule: () => Promise<void>;
  fetchAvailability: () => Promise<void>;
}

// authStore.ts — Authentication state
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// adminStore.ts — Admin panel state (Zustand slice)
interface AdminState {
  // Dashboard
  dashboardStats: DashboardStats;
  recentVehicles: Vehicle[];
  
  // Parking
  parkingSpots: ParkingSpot[];
  
  // Reports
  reportData: ReportData | null;
  
  // Actions
  fetchDashboardStats: () => Promise<void>;
  fetchParkingSpots: () => Promise<void>;
  generateReport: (params: ReportParams) => Promise<void>;
  updateTariff: (tariff: Tariff) => Promise<void>;
  updateSchedule: (schedule: Schedule) => Promise<void>;
}
```

### 5.3 API Integration Pattern

```typescript
// services/api.ts — Axios instance with interceptors
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await useAuthStore.getState().refreshToken();
      // Retry original request
    }
    return Promise.reject(error);
  }
);
```

### 5.4 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Component  │  │  Zustand    │  │  API Service│       │
│  │  (UI)       │◄─┤  Store      │◄─┤  (Axios)    │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│         │                │                  │              │
│         ▼                ▼                  ▼              │
│  ┌─────────────────────────────────────────────────┐    │
│  │              localStorage (JWT only)             │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                            │ REST / WebSocket
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Express    │  │  JWT Auth   │  │  Controllers │       │
│  │  Router     │──┤  Middleware │──┤  (Business)  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│         │                  │                │              │
│         ▼                  ▼                ▼              │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Mongoose ODM + MongoDB Atlas        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP (internal)
                            ▼
┌─────────────────────────────────────────────────────────┐
│              FLUX AI MICROSERVICES (Python)              │
│  ┌─────────────┐  ┌─────────────┐                      │
│  │  Vision API │  │  Analytics  │                      │
│  │  (FastAPI)  │  │  API        │                      │
│  │  Port 4001  │  │  (FastAPI)  │                      │
│  └─────────────┘  │  Port 4002  │                      │
│                   └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Risk Assessment

### 6.1 High Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **TypeScript learning curve** | High | Medium | Start with `any` types, progressively add strict types. Use `.ts` for logic, `.tsx` for components. |
| **Backend deployment complexity** | Medium | High | Use Railway/Render free tier. Document deployment steps. Start with local dev. |
| **MongoDB Atlas limits (512MB)** | Low | Medium | Design lean schemas. Add indexes early. Monitor with Atlas Dashboard. |
| **AI module accuracy (OCR)** | Medium | High | Start with EasyOCR (no training). Fallback to manual entry. Add YOLOv8 later. |
| **Time overrun** | High | High | Strict phase boundaries. Drop Flux AI Phase 5 if needed (can be standalone). |

### 6.2 Medium Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **localStorage → API migration** | Medium | Medium | Build abstraction layer in Zustand. Toggle between localStorage and API via env var. |
| **CSS migration to Tailwind** | Medium | Low | Keep custom CSS for complex animations. Use `@apply` for repeated patterns. |
| **PDF/Excel export libraries** | Low | Medium | Lazy load both. Test in build. Fallback to CSV if libraries fail. |
| **WebSocket real-time updates** | Medium | Medium | Implement polling fallback. socket.io for MVP. |

### 6.3 Low Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Vite configuration** | Low | Low | Use official templates. Path aliases in `vite.config.ts`. |
| **Zustand complexity** | Low | Low | Simple slices. DevTools middleware for debugging. |
| **React Router migration** | Low | Low | Hash router for static hosting. Browser router for deployed app. |

---

## 7. Dependencies Between Phases

### 7.1 Dependency Graph

```
Phase 0 (Foundation)
    │
    ▼
Phase 1 (Landing + Backend) ─────┐
    │                              │
    ▼                              │
Phase 2 (Auth) ◄───────────────────┘
    │
    ▼
Phase 3 (User Panel) ────────────┐
    │                              │
    ▼                              │
Phase 4 (Admin Panel) ◄───────────┘
    │
    ▼
Phase 5 (Flux AI)
```

### 7.2 Critical Path
The **critical path** is: `0 → 1 → 2 → 3 → 4`

- Phase 5 (Flux AI) is **optional** for MVP. Can be deferred or implemented as standalone microservices.
- Phase 1 and Phase 2 can overlap slightly (backend auth endpoints can be built while frontend landing is being finalized).
- Phase 3 and Phase 4 share the same backend APIs (vehicles, reservations, users), so backend work for Phase 3 should include admin endpoints.

### 7.3 Phase Overlap Strategy

```
Week 1:  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Phase 0
Week 2:  ░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░  Phase 1 (Frontend)
Week 3:  ░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░  Phase 1 (Backend) + Phase 2 start
Week 4:  ░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░  Phase 2 (Auth)
Week 5:  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░  Phase 2 (Auth) + Phase 3 start
Week 6:  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░  Phase 3 (User Panel)
Week 7:  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  Phase 3 (User Panel)
Week 8:  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Phase 4 (Admin Panel)
Week 9:  ░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░  Phase 4 (Admin Panel)
Week 10: ░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░  Phase 4 (Admin Panel)
Week 11: ░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░░░░░░░  Phase 5 (Flux AI)
Week 12: ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████████░░░░  Phase 5 (Flux AI)
```

---

## 8. Technical Decisions

### 8.1 Why Zustand over Redux/Context?
- **Simpler**: No reducers, no actions, no boilerplate
- **Slices**: Natural fit for `authStore`, `appStore`, `adminStore`
- **TypeScript**: Excellent type inference
- **Persist**: Built-in middleware for localStorage sync
- **DevTools**: Redux DevTools compatible

### 8.2 Why Lazy Loading for Heavy Libraries?
- `jsPDF` + `autoTable`: ~300KB (only needed for report export)
- `xlsx` (SheetJS): ~500KB (only needed for Excel export)
- `chart.js`: ~200KB (only needed for admin dashboard)
- Strategy: `React.lazy()` + `import()` for all heavy libraries

### 8.3 Why Two Separate Stores (appStore + authStore)?
- **Separation of concerns**: Auth logic is isolated from app logic
- **Auth guard**: Can import `authStore` independently for route guards
- **Hydration**: Auth store can rehydrate from localStorage on app load
- **Testing**: Easier to test stores independently

### 8.4 Why Not Next.js?
- **No SSR needed**: This is a dashboard/SPA application, not content-heavy
- **Simpler deployment**: Vite builds to static files, deploy anywhere
- **No API routes**: Backend is separate (Node.js), not colocated
- **Learning curve**: React Router v6 is simpler than Next.js routing

### 8.5 Why MongoDB over SQL?
- **Flexibility**: Schema-less for evolving project (educational)
- **Free tier**: MongoDB Atlas M0 is permanently free (512MB)
- **JSON native**: Frontend and backend both use JSON
- **Mongoose**: Excellent ODM for validation and middleware

---

## 9. Migration Delta Summary

| Feature | Vanilla (Before) | React (After) | Delta |
|---------|-----------------|---------------|-------|
| **Routing** | Multi-page HTML | SPA with React Router | New: client-side routing |
| **State** | Global `let` + localStorage | Zustand + API | New: predictable state management |
| **Auth** | Hardcoded users | JWT + bcryptjs | New: secure authentication |
| **Backend** | None | Node.js + Express + MongoDB | New: full backend |
| **Data** | localStorage only | MongoDB Atlas | New: persistent database |
| **Styling** | 1738 lines CSS | Tailwind + CSS modules | Changed: utility-first approach |
| **Charts** | None (mock sparklines) | Chart.js (lazy-loaded) | New: real data visualization |
| **Reports** | jsPDF + XLSX (CDN) | Lazy-loaded libraries | Changed: same libs, better UX |
| **Type Safety** | None | TypeScript | New: compile-time safety |
| **Build** | None (static files) | Vite (optimized bundle) | New: fast builds, HMR |
| **AI** | Static text | Python microservices | New: real AI features (Phase 5) |
| **Real-time** | Static gauges | WebSocket + socket.io | New: live updates |
| **Responsive** | Mobile-first CSS | Tailwind + custom hooks | Changed: same result, cleaner code |
| **Error Handling** | `console.warn` | ErrorBoundary + sonner | New: user-friendly errors |
| **Testing** | None | Deferred (user decision) | Same: no testing in MVP |

---

## 10. Rollback Plan

### 10.1 Per-Phase Rollback

| Phase | Rollback Trigger | Rollback Action |
|-------|-----------------|----------------|
| **Phase 0** | Tooling issues | Restart with Create React App instead of Vite |
| **Phase 1** | Landing looks broken | Keep vanilla `index.html` as fallback, serve from `/legacy` |
| **Phase 2** | Auth too complex | Revert to hardcoded users in Zustand, defer backend auth |
| **Phase 3** | User panel bugs | Allow users to access vanilla `PantallaUsuario.html` temporarily |
| **Phase 4** | Admin panel too complex | Keep vanilla `PanelAdmi.html` as fallback for admin users |
| **Phase 5** | AI modules fail | Skip Phase 5 entirely. MVP is functional without AI. |

### 10.2 Global Rollback
If the entire React migration fails:
- The vanilla project remains untouched at `Punto-Park-U-Web`
- Can serve vanilla from `public/legacy/` in the React app
- Gradual redirect: landing → React, admin → vanilla if needed

---

## 11. Success Criteria

### 11.1 Per-Phase Acceptance Criteria

| Phase | Criteria | Verification |
|-------|----------|--------------|
| **0** | `npm run dev` starts, no errors | Manual test |
| **1** | Landing page pixel-perfect match with vanilla | Visual comparison + manual test |
| **2** | Can register, login, logout with JWT | API test + manual test |
| **3** | User can CRUD vehicles, make reservations | E2E manual test |
| **4** | Admin can manage tariffs, generate reports, view dashboard | E2E manual test |
| **5** | AI modules respond to API calls, WebSocket updates work | API test + manual test |

### 11.2 Global Success Criteria
- **Feature parity**: Every vanilla feature exists in React
- **No regressions**: All vanilla UX patterns preserved
- **Performance**: Lighthouse score ≥ 80 (no worse than vanilla)
- **Accessibility**: Same or better ARIA support
- **Mobile**: Same responsive behavior

---

## 12. Open Questions

1. **Deployment**: Should we deploy incrementally (per phase) or only at the end?
2. **Domain**: Should we buy a domain for the project, or use Vercel/Railway defaults?
3. **Email**: For password recovery, do we need email service (SendGrid free tier) or just simulate?
4. **Images**: Should we migrate all images from `Images/` to a CDN or keep them in `public/`?
5. **Testing**: If user wants testing later, should we add `data-testid` attributes during migration?
6. **PWA**: Should we add service worker / PWA capabilities during migration?

---

## 13. Recommendation

### 13.1 Recommended Approach
**Proceed with the phased Strangler Fig migration as outlined.**

Key success factors:
1. **Strict phase boundaries**: Don't start Phase N until Phase N-1 is accepted
2. **Backend-first for data**: Build API endpoints before consuming them in frontend
3. **Visual parity**: Compare React output with vanilla side-by-side
4. **Feature freeze**: No new features in vanilla during migration
5. **Defer Phase 5**: Flux AI is the most complex and risky. Complete Phases 0-4 first.

### 13.2 What to Start First
Begin with **Phase 0 (Foundation)** immediately. This sets up the entire toolchain and validates that the chosen stack works on the developer's machine.

### 13.3 Estimated Timeline
- **Phase 0**: 3-5 days
- **Phase 1**: 7-10 days
- **Phase 2**: 5-7 days
- **Phase 3**: 7-10 days
- **Phase 4**: 10-14 days
- **Phase 5**: 7-10 days
- **Total**: ~6-8 weeks (assuming part-time work)

### 13.4 Ready for Proposal
**Yes** — The exploration is complete. The orchestrator should:
1. Present this plan to the user for review
2. Ask the user to approve the phase sequence
3. Ask the user to answer the open questions (Section 12)
4. Upon approval, create a formal SDD proposal for Phase 0

---

## 14. Appendix: File Mapping Reference

### Vanilla → React File Mapping

| Vanilla Path | React Path | Type |
|--------------|------------|------|
| `index.html` | `src/pages/LandingPage.tsx` | Page |
| `Styles.css` | `src/index.css` + `tailwind.config.js` | Styles |
| `Login/Login.html` | `src/pages/LoginPage.tsx` | Page |
| `Login/Login.js` | `src/hooks/useAuth.ts` + `src/stores/authStore.ts` | Logic |
| `Registro/Registro.html` | `src/pages/RegisterPage.tsx` | Page |
| `Registro/Registro.js` | `src/hooks/useRegister.ts` | Logic |
| `Login/Pantalla Usuario/PantallaUsuario.html` | `src/pages/UserPanel.tsx` | Page |
| `Login/Pantalla Usuario/pantalla-usuario.js` | `src/stores/appStore.ts` + `src/hooks/useVehicles.ts` | Logic |
| `Administrador/Admi.html` | `src/pages/AdminLoginPage.tsx` | Page |
| `Administrador/Panel/PanelAdmi.html` | `src/pages/AdminPanel.tsx` | Page |
| `Administrador/Panel/panel.js` | `src/stores/adminStore.ts` + `src/hooks/useReports.ts` | Logic |
| `Administrador/Panel/modules.js` | `src/components/admin/OperatorMonitoring.tsx` | Component |
| `Images/*` | `public/images/*` | Static assets |
| `plan-flux-ai.txt` | `docs/flux-ai-spec.md` | Documentation |

---

## 15. Appendix: Tailwind Config Mapping

### CSS Variables → Tailwind Theme

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#10131a',
        surface: {
          DEFAULT: '#10131a',
          low: '#191b23',
          container: '#1d1f27',
          high: '#272a32',
          highest: '#32353d',
          variant: '#32353d',
        },
        primary: {
          DEFAULT: '#a7c8ff',
          fixed: '#d5e3ff',
          'fixed-dim': '#a7c8ff',
          container: '#0074d9',
        },
        'on-primary': '#003060',
        'on-primary-container': '#fdfbff',
        secondary: {
          DEFAULT: '#afc8f0',
          container: '#2f486a',
        },
        'on-bg': '#e1e2ec',
        'on-surface': '#e1e2ec',
        'on-surface-var': '#c1c6d5',
        outline: {
          DEFAULT: '#8b919e',
          variant: '#414753',
        },
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        brutal: '0 20px 40px rgba(0, 0, 0, 0.4)',
        'glow-primary': '0 0 20px rgba(167, 200, 255, 0.3)',
      },
    },
  },
};
```

---

*End of Exploration Document*

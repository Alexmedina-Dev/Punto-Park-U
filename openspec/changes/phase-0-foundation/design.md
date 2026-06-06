# Design: Phase 0 — Foundation & Tooling

## Technical Approach

Strangler Fig scaffold alongside the vanilla reference. We bootstrap a Vite + React 18 + TypeScript SPA, port the vanilla dark-mode design tokens into Tailwind v3.4, and wire Zustand stores, React Router v6 lazy routes, Axios interceptors, and shared UI primitives. No pages are built yet — only stubs and the shell.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Build tool | Vite 5 | CRA, Next.js | Faster HMR; simpler config for a SENA learner than Next.js App Router |
| Strict TS | `strict: false` | `strict: true` | User is new to TS; enable rules progressively to avoid blocker fatigue |
| State | Zustand v4 | Context + useReducer | Less boilerplate, easier to teach; matches proposal |
| Routing | React Router v6 | TanStack Router | Standard, docs-rich, fits lazy-loading requirement |
| HTTP | Axios instance | fetch() | Interceptors for JWT are declarative; familiar to vanilla JS devs |
| Styling | Tailwind utility | CSS Modules | Matches reference `Styles.css` token-for-token via `theme.extend` |
| Dark mode | `class` strategy | `media` strategy | Requirement is user-toggleable, not OS-bound like vanilla `color-scheme: dark` |
| Icons | Material Symbols (CDN) | Lucide, FontAwesome | Exact visual match with vanilla; no extra npm weight |

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Routes    │────→│  Page Stub  │────→│  UI Primitive│
│  (lazy)     │     │   (layout)  │     │  (Button...) │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
        ┌────────┐   ┌─────────┐   ┌──────────┐
        │authStore│   │appStore │   │ api.ts   │
        │(Zustand)│   │(Zustand)│   │ (Axios)  │
        └────────┘   └─────────┘   └──────────┘
```

`authStore` → `api.ts` request interceptor injects `Authorization` header. `appStore` → `<html>` class toggle drives Tailwind `dark:` variants.

## Capability Designs

### 1. app-shell

**Component structure**
```
src/components/layout/
  Header.tsx        — fixed, glass backdrop, desktop nav, login/admin CTAs
  Footer.tsx        — logo, sections, copyright
  MobileNav.tsx     — hamburger toggle, slide-down overlay (≥1024px hidden)
  ErrorBoundary.tsx — class component with `componentDidCatch`
```

**State flow**
- `MobileNav` uses local `useState<boolean>` for `isOpen`; no global store needed.
- `ErrorBoundary` catches render errors and displays fallback UI; logs to `console.error`.

**TypeScript interfaces**
```ts
interface MobileNavProps { links: NavLink[]; }
interface ErrorBoundaryState { hasError: boolean; error?: Error; }
```

**Error handling**
- `ErrorBoundary` renders static fallback; no retry logic in Phase 0.
- Sonner `Toaster` mounted in `App.tsx` root for future toast calls.

**Performance**
- `Header`/`Footer` are lightweight; no memo needed yet.
- `MobileNav` unmounts overlay nodes when closed to reduce DOM weight (`unmountOnExit` pattern via conditional rendering).

### 2. theme-system

**Component structure**
```
tailwind.config.js  — extend colors, fonts, shadows, animations
src/index.css       — @tailwind directives + custom utilities
src/hooks/useTheme.ts — subscribe to appStore.theme, toggle .dark class
```

**State flow**
- `appStore.theme` → `useTheme` effect adds/removes `.dark` on `<html>`.
- Preference persisted to `localStorage` (SHOULD requirement).

**API design**
- Tailwind `theme.extend.colors` maps every vanilla `:root` variable:
  `bg: #10131a`, `surface-low: #191b23`, `primary: #a7c8ff`, etc.
- Custom utilities in `index.css`: `.glass`, `.shadow-brutal`, `.neon-glow`, `.animate-pulse-red`, `.animate-spin-custom`.

**TypeScript interfaces**
```ts
type Theme = 'light' | 'dark';
```

**Error handling**
- Invalid `localStorage` theme value defaults to `'dark'` (matches vanilla).

**Performance**
- `darkMode: 'class'` avoids FOUC; class is set before React hydration via inline script in `index.html` or early `useEffect`.

### 3. state-management

**Component structure**
```
src/stores/
  appStore.ts   — UI state slice
  authStore.ts  — session slice
  types.ts      — store interfaces
```

**State flow**
```
Component → action → store update → selector re-render
```

**API design**
```ts
interface AppStore {
  sidebarOpen: boolean; theme: Theme; isLoading: boolean;
  toggleSidebar: () => void; setTheme: (t: Theme) => void; setLoading: (b: boolean) => void;
}

interface AuthStore {
  user: User | null; accessToken: string | null; isAuthenticated: boolean;
  login: (c: Credentials) => Promise<void>;
  logout: () => void; setUser: (u: User | null) => void;
}
```

**Error handling**
- `login()` catches Axios errors; returns rejected Promise so caller can toast.
- `logout()` is synchronous and defensive (clear localStorage even if already empty).

**Performance**
- Zustand selectors prevent re-renders on unrelated slices.
- `persist` middleware NOT used in Phase 0 to keep logic explicit; `localStorage` read/write done manually inside actions.

### 4. routing

**Component structure**
```
src/App.tsx              — BrowserRouter + route table + Suspense
src/routes/
  ProtectedRoute.tsx     — guard wrapper
  index.tsx              — route definitions
src/pages/
  Landing.tsx, Login.tsx, Register.tsx, AdminLayout.tsx, UserPanel.tsx, NotFound.tsx
```

**State flow**
- `ProtectedRoute` reads `authStore.isAuthenticated` via Zustand selector.
- Unauthenticated → `<Navigate to="/login" state={{ from: location }} />`.

**API design**
```ts
interface ProtectedRouteProps { children: React.ReactNode; }
```

**Error handling**
- `NotFound` catches unmatched paths.
- `React.Suspense` fallback handles lazy chunk errors (show simple `<div>Loading...</div>`).

**Performance**
- All page stubs wrapped in `React.lazy(() => import('./pages/...'))`.
- Single `Suspense` boundary at route table level with a minimal spinner component.

### 5. ui-primitives

**Component structure**
```
src/components/ui/
  Button.tsx   — variants, sizes, disabled, loading
  Input.tsx    — label, error, controlled
  Card.tsx     — padding sizes, title, variant default|glass
  Badge.tsx    — variants, dot
  Modal.tsx    — open/onClose, title, children, backdrop/escape close
```

**State flow**
- All primitives are presentational; state passed via props.
- `Modal` attaches `keydown` listener in `useEffect` for Escape close.

**TypeScript interfaces**
```ts
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: ButtonSize; loading?: boolean;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string;
}

interface CardProps { title?: string; variant?: 'default' | 'glass'; padding?: 'sm' | 'md' | 'lg'; children: ReactNode; }

type BadgeVariant = 'success' | 'warning' | 'error' | 'info';
interface BadgeProps { variant?: BadgeVariant; dot?: boolean; children: ReactNode; }

interface ModalProps { open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode; }
```

**Error handling**
- `Input` renders error text only when `error` prop is truthy.
- `Button` ignores clicks when `disabled` or `loading`.

**Performance**
- Primitives are small; no `React.memo` in Phase 0 unless profiling shows need.
- `Modal` uses `createPortal` to avoid z-index stacking context issues.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `vite.config.ts` | Create | Vite 5 scaffold with `@/` alias to `src/` |
| `tsconfig.json` | Create | `strict: false`, path mapping `@/*` |
| `.env` | Create | `VITE_API_URL` placeholder |
| `tailwind.config.js` | Create | Theme extend with vanilla tokens, `darkMode: 'class'` |
| `src/index.css` | Create | Tailwind directives, custom utilities, CSS reset, font imports |
| `src/types/index.ts` | Create | `User`, `Vehicle`, `Tariff`, `Schedule`, `Reservation` |
| `src/services/api.ts` | Create | Axios instance, JWT request interceptor |
| `src/stores/appStore.ts` | Create | Zustand UI store |
| `src/stores/authStore.ts` | Create | Zustand auth store |
| `src/stores/types.ts` | Create | Store interfaces |
| `src/hooks/useTheme.ts` | Create | Sync `appStore.theme` → `<html>` class |
| `src/components/layout/Header.tsx` | Create | Fixed glass header |
| `src/components/layout/Footer.tsx` | Create | Multi-column footer |
| `src/components/layout/MobileNav.tsx` | Create | Animated hamburger overlay |
| `src/components/layout/ErrorBoundary.tsx` | Create | `componentDidCatch` fallback |
| `src/components/ui/Button.tsx` | Create | Variant/size/loading button |
| `src/components/ui/Input.tsx` | Create | Labeled input with error |
| `src/components/ui/Card.tsx` | Create | Card with glass variant |
| `src/components/ui/Badge.tsx` | Create | Status badge with dot |
| `src/components/ui/Modal.tsx` | Create | Portal modal with backdrop/Escape |
| `src/pages/Landing.tsx` | Create | Stub placeholder |
| `src/pages/Login.tsx` | Create | Stub placeholder |
| `src/pages/Register.tsx` | Create | Stub placeholder |
| `src/pages/AdminLayout.tsx` | Create | Stub placeholder |
| `src/pages/UserPanel.tsx` | Create | Stub placeholder |
| `src/pages/NotFound.tsx` | Create | 404 fallback |
| `src/routes/ProtectedRoute.tsx` | Create | Auth guard wrapper |
| `src/routes/index.tsx` | Create | Route table with lazy + Suspense |
| `src/App.tsx` | Create | Router + Toaster + layout shell |
| `src/main.tsx` | Create | Entry point with `React.StrictMode` |
| `index.html` | Create | Fonts, favicon, `class="dark"` default |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Button renders all variants | Manual visual check in `npm run dev` |
| Integration | Login → token stored → header injected | Manual flow via DevTools Network |
| E2E | Route guards, theme toggle, build | `npm run build` + `tsc --noEmit` + visual walkthrough |

## Migration / Rollout

No migration required — greenfield scaffold. Rollback: delete scaffold and restart with CRA if Vite fails.

## Open Questions

- [ ] Should `appStore` use Zustand `persist` middleware in a later phase, or keep manual `localStorage`? (Decision deferred to Phase 1.)
- [ ] Should `Modal` use `react-dom/createPortal` or a simpler inline conditional? (Decision: use Portal to match standard practice.)

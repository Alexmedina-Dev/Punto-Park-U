# Tasks: Phase 0 — Foundation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (setup+theme+state) → PR 2 (routing+layout+primitives) → PR 3 (integration) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Project setup, theme, state | PR 1 | main; configs + stores |
| 2 | Routing, layout, UI primitives | PR 2 | depends on PR 1 |
| 3 | Integration & verification | PR 3 | depends on PR 2 |

## Phase 1: Project Setup

- [x] 1.1 Vite scaffold; install tailwindcss, zustand, react-router-dom, axios, sonner — effort: S — risk: Low
- [x] 1.2 `vite.config.ts` + `tsconfig.json`: `@/` alias, `strict: false` — effort: S — risk: Low
- [x] 1.3 `.env`: `VITE_API_URL` placeholder — effort: XS — risk: Low
- [x] 1.4 `tailwind.config.js`: `darkMode: 'class'`, vanilla tokens, fonts, shadows — effort: M — risk: Medium
- [x] 1.5 `src/index.css`: directives, utilities, reset, font imports — effort: M — risk: Medium
- [x] 1.6 `src/types/index.ts`: `User`, `Vehicle`, `Tariff`, `Schedule`, `Reservation` — effort: S — risk: Low
- [x] 1.7 `src/services/api.ts`: Axios instance, base URL, JWT interceptor — effort: S — risk: Low

## Phase 2: State Management

- [x] 2.1 `src/stores/types.ts`: `AppStore`, `AuthStore` interfaces — deps: 1.6 — effort: S — risk: Low
- [x] 2.2 `src/stores/appStore.ts`: Zustand UI store (`theme`, `sidebarOpen`, `isLoading`) — deps: 2.1 — effort: S — risk: Low
- [x] 2.3 `src/stores/authStore.ts`: Zustand auth store (`user`, `token`, `login`, `logout`, localStorage) — deps: 2.1, 1.7 — effort: M — risk: Medium
- [x] 2.4 `src/hooks/useTheme.ts`: sync theme → `<html>` class, persist preference — deps: 2.2 — effort: S — risk: Low

## Phase 3: Routing + Layout

- [x] 3.1 `src/components/layout/`: `Header`, `Footer`, `MobileNav`, `ErrorBoundary` — deps: 1.5 — effort: M — risk: Low
- [x] 3.2 `src/pages/`: `Landing`, `Login`, `Register`, `AdminLayout`, `UserPanel`, `NotFound` stubs — effort: S — risk: Low
- [x] 3.3 `src/routes/ProtectedRoute.tsx`: auth guard, redirect to `/login` with `state.from` — deps: 2.3 — effort: S — risk: Low
- [x] 3.4 `src/routes/index.tsx`: route table with `React.lazy()` + `Suspense` — deps: 3.2, 3.3 — effort: S — risk: Low
- [x] 3.5 `src/App.tsx`: `BrowserRouter`, `Toaster`, layout shell, lazy routes — deps: 3.1, 3.4, 2.4 — effort: M — risk: Low

## Phase 4: UI Primitives

- [x] 4.1 `src/components/ui/Button.tsx`: variants, sizes, disabled, loading, `data-testid` — deps: 1.5 — effort: S — risk: Low
- [x] 4.2 `src/components/ui/Input.tsx`: label, error, controlled — deps: 1.5 — effort: S — risk: Low
- [x] 4.3 `src/components/ui/Card.tsx`: padding, title, `default | glass` — deps: 1.5 — effort: S — risk: Low
- [x] 4.4 `src/components/ui/Badge.tsx`: variants, optional dot — deps: 1.5 — effort: S — risk: Low
- [x] 4.5 `src/components/ui/Modal.tsx`: portal, backdrop/Escape close, title, footer — deps: 1.5 — effort: M — risk: Low

## Phase 5: Integration + Verification

- [x] 5.1 `src/main.tsx`: entry point with `React.StrictMode` — deps: 3.5 — effort: XS — risk: Low
- [x] 5.2 `index.html`: fonts, favicon, default `class="dark"` — effort: XS — risk: Low
- [ ] 5.3 `npm run dev`: verify clean start, alias resolves — deps: 5.1 — effort: S — risk: Low
- [x] 5.4 `npm run build` + `tsc --noEmit`: zero errors — deps: 5.1 — effort: S — risk: Low
- [ ] 5.5 Visual walkthrough: dark mode, primitives, routes, ErrorBoundary — deps: 5.3 — effort: M — risk: Low

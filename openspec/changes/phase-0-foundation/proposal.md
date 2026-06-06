# Proposal: Phase 0 — Foundation & Tooling

## Intent

Bootstrap the React 18 + TypeScript + Vite project skeleton. No user-facing pages — just toolchain, theme, stores, routing, and base components. Every subsequent phase depends on this.

## Scope

### In Scope
- Vite + React 18 + TypeScript scaffold with path aliases
- Tailwind CSS v3.4 with custom dark-mode theme (ported from vanilla `Styles.css`)
- Zustand store skeleton: `appStore` + `authStore` (TypeScript interfaces)
- React Router v6 route table with lazy-loaded page stubs
- Axios service layer with JWT interceptors
- 5 shared UI primitives: Button, Card, Badge, Input, Modal
- 3 layout components: Header, Footer, MobileNav
- ErrorBoundary + sonner toast + React.StrictMode
- Core type definitions: User, Vehicle, Tariff, Schedule, Reservation

### Out of Scope
- Pages (landing, login, admin — Phase 1+), backend API, real data, charts/PDF/Excel, testing, deployment

## Capabilities

### New Capabilities
- `app-shell`: Layout shell — Header, Footer, MobileNav, ErrorBoundary
- `theme-system`: Tailwind dark-mode theme from vanilla CSS variables
- `state-management`: Zustand stores — appStore, authStore with typed interfaces
- `routing`: React Router v6 skeleton with lazy-loaded page stubs
- `ui-primitives`: Shared component library (Button, Card, Badge, Input, Modal)

### Modified Capabilities
None — first phase.

## Approach

Strangler Fig foundation. Scaffold alongside untouched vanilla reference at `Punto-Park-U-Web`.

1. `npm create vite@latest` → install deps (tailwindcss, zustand, react-router-dom, axios, sonner)
2. Port CSS custom properties → `tailwind.config.js` extend block
3. Create folder structure: `components/{layout,ui}`, `pages/`, `stores/`, `hooks/`, `services/`, `types/`
4. Build stores + route table + Axios instance
5. Wire ErrorBoundary + sonner into root layout
6. Build UI primitives styled with ported tokens

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| Project root | New | Vite scaffold, configs |
| `src/components/layout/` | New | Header, Footer, MobileNav |
| `src/components/ui/` | New | Button, Card, Badge, Input, Modal |
| `src/stores/` | New | appStore, authStore (Zustand) |
| `src/pages/` | New | Placeholder stubs |
| `src/types/` | New | Domain type definitions |
| `tailwind.config.js` | New | Ported dark-mode theme |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tailwind config breaks dark mode | Medium | Build and visually test theme before adding components |
| TypeScript too strict for beginner | Medium | Start `strict:false`, use `any` for complex types, enable rules progressively |
| Vite port conflict | Low | Default 5173; fallback `--port 3000` |

## Rollback Plan

If Vite proves problematic: delete scaffold, restart with `create-react-app --template typescript`. Tailwind can be replaced with CSS modules. Zustand can be replaced with React Context + `useReducer`.

## Dependencies

- Node.js 18+, npm 9+ (local)
- Reference: `C:\Projects\Punto-Park-U-Web` (read-only)
- Git initialized (done)

## Success Criteria

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` produces production bundle
- [ ] Dark mode toggle works (class-based from Tailwind)
- [ ] All 5 UI primitives render correctly in dark mode
- [ ] Route stubs navigate without console errors
- [ ] Zustand stores initialize with correct default state
- [ ] ErrorBoundary catches and displays component errors
- [ ] `tsc --noEmit` passes with zero errors
- [ ] Custom Tailwind tokens visually match vanilla `Styles.css`

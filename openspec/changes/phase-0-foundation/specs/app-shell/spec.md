# App Shell Specification

## Purpose

Project scaffold, build toolchain, path aliases, environment config, type definitions, Axios service layer, and layout shell components (Header, Footer, MobileNav, ErrorBoundary). Every downstream phase depends on this foundation.

## Requirements

| # | Requirement | Strength | Migration Delta |
|---|------------|----------|-----------------|
| R1 | Vite + React 18 + TypeScript scaffold with `@/` → `src/` alias | MUST | Replaces vanilla HTML file-based structure; Vite replaces no-bundler approach |
| R2 | TypeScript config with `strict: false`, incremental rules enabled progressively | MUST | New — vanilla had no type checking |
| R3 | `.env` file with `VITE_API_URL` variable | MUST | New — vanilla used hardcoded URLs |
| R4 | Domain type definitions: User, Vehicle, Tariff, Schedule, Reservation | MUST | New — vanilla had no shared types |
| R5 | Axios instance with base URL from env, JWT interceptor for `Authorization` header | MUST | New — vanilla used fetch() inline |
| R6 | Header: fixed top, glass backdrop, logo, desktop nav links, login/admin buttons | MUST | Ported from vanilla — same visual, React component |
| R7 | Footer: logo, sections, copyright; matched to vanilla layout | MUST | Ported — structural match |
| R8 | MobileNav: hamburger toggle, slide-down overlay, nav links, footer info; hidden at ≥1024px | MUST | Ported — same behavior, React component with state |
| R9 | ErrorBoundary: catches render errors, displays fallback UI, logs to console | MUST | New — vanilla had no error boundary |
| R10 | Sonner toast provider mounted at app root | MUST | New — replaces vanilla alert() calls |

### Scenario: Dev server starts cleanly
- GIVEN Node.js 18+ and `npm install` completed
- WHEN developer runs `npm run dev`
- THEN Vite starts on port 5173 without errors
- AND import `@/components/ui/Button` resolves correctly

### Scenario: Production build succeeds
- GIVEN all source files present
- WHEN developer runs `npm run build`
- THEN Vite produces optimized bundle in `dist/`
- AND `tsc --noEmit` passes with zero errors

### Scenario: JWT interceptor attaches token
- GIVEN authStore has a valid `accessToken`
- WHEN any Axios request is made
- THEN `Authorization: Bearer <token>` header is present

### Scenario: ErrorBoundary catches crash
- GIVEN a child component throws during render
- WHEN the error propagates
- THEN ErrorBoundary renders fallback UI with "Something went wrong"
- AND error details are logged to console

### Scenario: Mobile menu toggle
- GIVEN viewport < 1024px wide
- WHEN user taps hamburger button
- THEN full-screen overlay slides down with navigation links
- AND hamburger transforms to close button

## Dependencies

- Node.js 18+, npm 9+, Vite 5.x, React 18, TypeScript 5.x, Axios, sonner
- Reference: `C:\Projects\Punto-Park-U-Web/Styles.css` + `index.html`

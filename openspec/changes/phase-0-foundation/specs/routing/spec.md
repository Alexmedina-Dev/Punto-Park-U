# Routing Specification

## Purpose

React Router v6 client-side routing with lazy-loaded page stubs, a `ProtectedRoute` guard, and a `NotFound` fallback. Provides the navigation skeleton that Phase 1+ pages will populate.

## Requirements

| # | Requirement | Strength | Migration Delta |
|---|------------|----------|-----------------|
| R1 | `BrowserRouter` wrapping the app at root level | MUST | Replaces vanilla multi-HTML-file navigation (no SPA routing) |
| R2 | Route table: `/` → Landing, `/login` → Login, `/register` → Register, `/admin/*` → AdminLayout, `/panel/*` → UserPanel | MUST | New — vanilla used separate HTML files per section |
| R3 | All page components use `React.lazy()` + `Suspense` with a loading fallback | MUST | New — vanilla had no code splitting |
| R4 | `ProtectedRoute` wrapper checks `authStore.isAuthenticated`; redirects to `/login` if false | MUST | New — vanilla had no auth gating |
| R5 | `ProtectedRoute` preserves intended destination via `state.from` so user returns after login | SHOULD | New |
| R6 | `NotFound` page renders for unmatched routes with link back to home | MUST | New — vanilla had no 404 handling |
| R7 | Route stubs render placeholder text (e.g., "Landing page — coming in Phase 1") | MUST | New |
| R8 | Navigation must not produce console errors for valid routes | MUST | New |

### Scenario: Direct navigation to home
- GIVEN the app is loaded at `/`
- WHEN the route matches
- THEN the Landing stub renders with placeholder content
- AND no console errors appear

### Scenario: Protected route — authenticated
- GIVEN `authStore.isAuthenticated` is `true`
- WHEN user navigates to `/admin`
- THEN AdminLayout stub renders

### Scenario: Protected route — unauthenticated
- GIVEN `authStore.isAuthenticated` is `false`
- WHEN user navigates to `/admin`
- THEN browser redirects to `/login`
- AND intended path `/admin` is stored in location state

### Scenario: Unknown route
- GIVEN user navigates to `/nonexistent`
- WHEN no route matches
- THEN `NotFound` component renders with "Page not found" message
- AND a link back to `/` is displayed

### Scenario: Lazy loading shows fallback
- GIVEN a lazy-loaded page is being fetched
- WHEN the chunk is loading
- THEN a loading spinner or skeleton is displayed via `Suspense` fallback

## Dependencies

- React Router DOM v6, React 18, TypeScript 5.x
- `authStore` from state-management spec (for ProtectedRoute)
- Page stubs in `pages/` directory

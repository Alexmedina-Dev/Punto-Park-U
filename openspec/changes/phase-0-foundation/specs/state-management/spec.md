# State Management Specification

## Purpose

Zustand store skeleton with typed interfaces for `appStore` (UI state, shared data) and `authStore` (user session, tokens, login/logout actions). Provides the reactive state layer consumed by routing, layout, and future phases.

## Requirements

| # | Requirement | Strength | Migration Delta |
|---|------------|----------|-----------------|
| R1 | `appStore` with typed state: `sidebarOpen`, `theme`, `isLoading`, global loading flag | MUST | New — vanilla used DOM manipulation and global variables |
| R2 | `appStore` actions: `toggleSidebar()`, `setTheme(theme)`, `setLoading(bool)` | MUST | New |
| R3 | `authStore` with typed state: `user: User \| null`, `accessToken: string \| null`, `isAuthenticated: boolean` | MUST | New — vanilla had no auth state beyond localStorage |
| R4 | `authStore` actions: `login(credentials)`, `logout()`, `setUser(user)` | MUST | New |
| R5 | `authStore.login()` calls Axios POST `/api/auth/login`, stores token + user on success | MUST | New — replaces inline fetch in vanilla login page |
| R6 | `authStore.logout()` clears user, token, `localStorage`, and Axios default header | MUST | New |
| R7 | Both stores expose TypeScript interfaces exported from `stores/` | MUST | New |
| R8 | Store state initializes with safe defaults (sidebar closed, light theme, no user) | MUST | New |

### Scenario: Auth login success
- GIVEN valid email and password
- WHEN `authStore.login({ email, password })` is called
- THEN `user` and `accessToken` are populated
- AND `isAuthenticated` is `true`
- AND token is persisted in `localStorage`

### Scenario: Auth login failure
- GIVEN invalid credentials
- WHEN `authStore.login()` is called
- THEN API error is caught
- AND `user` remains `null`, `isAuthenticated` remains `false`
- AND error message is surfaced (via sonner toast or return value)

### Scenario: Logout clears session
- GIVEN an authenticated user
- WHEN `authStore.logout()` is called
- THEN `user` → `null`, `accessToken` → `null`, `isAuthenticated` → `false`
- AND token is removed from `localStorage`
- AND Axios `Authorization` header is cleared

### Scenario: Sidebar toggle
- GIVEN `sidebarOpen` is `false`
- WHEN `appStore.toggleSidebar()` is called
- THEN `sidebarOpen` becomes `true`
- AND calling again sets it back to `false`

### Scenario: Theme switch
- GIVEN current theme is `"light"`
- WHEN `appStore.setTheme("dark")` is called
- THEN `theme` updates to `"dark"`
- AND `.dark` class toggles on `<html>` element (via subscription)

## Dependencies

- Zustand v4+, Axios, React 18, TypeScript 5.x
- Type definitions from `app-shell` spec (User interface)
- `services/api.ts` (Axios instance from app-shell)

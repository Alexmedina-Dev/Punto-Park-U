# Delta: Auth — Simple Role-Based Access Control (RBAC)

## ADDED Requirements

### Requirement: Extended Role Enum

The system MUST support four roles: `admin`, `operator`, `user`, and `guest`. The User model's role field SHALL be updated to include all four roles with hierarchical permissions.

| Role | Permissions |
|------|------------|
| `admin` | Full access: manage users, roles, tariffs, reports, all CRUD |
| `operator` | Parking operations: manage spots, entries/exits, reservations, view reports |
| `user` | Self-service: own profile, vehicles, reservations, view own history |
| `guest` | Read-only: view landing page, check availability (unauthenticated) |

### Requirement: Role-Based Middleware

The system MUST provide middleware functions to enforce role-based access control.

#### Scenario: requireRole — authorized

- **GIVEN** an authenticated user with role `admin`
- **WHEN** they access a route protected by `requireRole('admin')`
- **THEN** the request proceeds to the handler

#### Scenario: requireRole — unauthorized

- **GIVEN** an authenticated user with role `user`
- **WHEN** they access a route protected by `requireRole('admin')`
- **THEN** the server returns `403 { error: "Insufficient permissions" }`

#### Scenario: requireRoles — multiple accepted roles

- **GIVEN** an authenticated user with role `operator`
- **WHEN** they access a route protected by `requireRoles(['admin', 'operator'])`
- **THEN** the request proceeds to the handler

#### Scenario: requireRoles — none match

- **GIVEN** an authenticated user with role `user`
- **WHEN** they access a route protected by `requireRoles(['admin', 'operator'])`
- **THEN** the server returns `403 { error: "Insufficient permissions" }`

#### Scenario: Unauthenticated user — requireRole

- **GIVEN** a request without a valid JWT
- **WHEN** accessing a route protected by `requireRole('admin')`
- **THEN** the server returns `401 { error: "Authentication required" }`

### Requirement: Role Management Endpoints (Admin Only)

The system MUST provide endpoints for administrators to view and change user roles.

#### Scenario: Admin lists users with roles

- **GIVEN** an authenticated admin
- **WHEN** `GET /api/users` is called
- **THEN** the response includes each user's `role` field
- **AND** the admin can filter by role: `GET /api/users?role=operator`

#### Scenario: Admin changes user role

- **GIVEN** an authenticated admin
- **WHEN** `PUT /api/users/{userId}/role` with `{ role: "operator" }` is called
- **THEN** the user's role is updated to `"operator"`
- **AND** returns `200 { message: "Role updated", user: { id, role: "operator" } }`

#### Scenario: Admin changes role — invalid role

- **GIVEN** an authenticated admin
- **WHEN** `PUT /api/users/{userId}/role` with `{ role: "superadmin" }` (invalid)
- **THEN** the server returns `400 { error: "Invalid role. Must be one of: admin, operator, user, guest" }`

#### Scenario: Non-admin attempts to change role

- **GIVEN** an authenticated user with role `operator`
- **WHEN** they call `PUT /api/users/{userId}/role`
- **THEN** the server returns `403 { error: "Admin access required" }`

#### Scenario: Admin cannot change their own role

- **GIVEN** an authenticated admin
- **WHEN** they call `PUT /api/users/{ownUserId}/role` with `{ role: "user" }`
- **THEN** the server returns `400 { error: "Cannot change your own role" }`

### Requirement: Role Hierarchy

The system MUST implement a role hierarchy where higher roles inherit lower-role permissions.

| Role | Inherits |
|------|----------|
| `admin` | operator, user |
| `operator` | user |
| `user` | — |
| `guest` | — |

#### Scenario: Admin accesses operator-protected route

- **GIVEN** an authenticated admin
- **WHEN** they access a route protected by `requireRole('operator')`
- **THEN** the request is authorized (admin inherits operator permissions)

#### Scenario: Operator accesses user-protected route

- **GIVEN** an authenticated operator
- **WHEN** they access a route protected by `requireRole('user')`
- **THEN** the request is authorized (operator inherits user permissions)

#### Scenario: User cannot access operator-protected route

- **GIVEN** an authenticated user
- **WHEN** they access a route protected by `requireRole('operator')`
- **THEN** the server returns `403 { error: "Insufficient permissions" }`

### Requirement: New User Default Role

Newly registered users MUST default to the `user` role. Guest role is reserved for unauthenticated public access and SHALL NOT be assignable via registration.

#### Scenario: Registration creates user with role "user"

- **GIVEN** a new registration via `POST /api/auth/register`
- **WHEN** the User document is created
- **THEN** `role` defaults to `"user"`

#### Scenario: Google OAuth user defaults to "user"

- **GIVEN** a new user registering via Google OAuth
- **WHEN** the User document is created
- **THEN** `role` defaults to `"user"`

## MODIFIED Requirements

### Requirement: User Model — Role Field

The User model's role enum MUST be extended.

(Previously: role enum was `['user', 'admin']`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `role` | String | Yes | Enum: `"admin"`, `"operator"`, `"user"`, `"guest"`. Default `"user"` |

#### Scenario: Existing user roles preserved

- **GIVEN** the migration runs to update the role enum
- **WHEN** existing users have `role: "user"` or `role: "admin"`
- **THEN** their roles remain unchanged

### Requirement: requireAdmin Middleware

The existing `requireAdmin` middleware MUST be refactored to use the new `requireRole('admin')` function.

(Previously: `requireAdmin` directly checked `req.user.role !== 'admin'`)

#### Scenario: requireAdmin behavior unchanged

- **GIVEN** a user with role `admin`
- **WHEN** accessing a route protected by `requireAdmin`
- **THEN** the behavior is identical to before — admin proceeds, non-admin gets 403

### Requirement: Login and Registration Responses

The login and registration responses MUST include the user's role.

(Previously: the `formatUserResponse` already includes the `role` field — no behavioral change, just documentation)

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/models/User.js` | Modify | Update role enum to `['admin', 'operator', 'user', 'guest']` |
| `backend/src/middleware/requireRole.js` | Create | New `requireRole` and `requireRoles` middleware |
| `backend/src/middleware/requireAdmin.js` | Modify | Refactor to use `requireRole('admin')` internally |
| `backend/src/controllers/authController.js` | Modify | Update `register` to set role `"user"`; add `updateUserRole` for admin |
| `backend/src/routes/auth.js` | Modify | Add `PUT /users/:id/role` (admin only) |
| `backend/src/routes/index.js` | Modify | Apply role middleware to protected routes |
| `src/services/admin.service.ts` | Modify | Add `updateUserRoleService()` |
| `src/stores/adminStore.ts` | Modify | Add role management actions |
| `src/types/index.ts` | Modify | Update `User.rol` type to `'admin' | 'operator' | 'user' | 'guest'` |

## Dependencies

- None — uses existing middleware pattern

## Acceptance Criteria

- Four roles exist: admin, operator, user, guest
- `requireRole` and `requireRoles` middleware enforce role-based access
- Role hierarchy: admin > operator > user
- Admin can view and change user roles via API
- Admin cannot change their own role (self-demotion protection)
- Existing `requireAdmin` middleware behavior is preserved via refactor

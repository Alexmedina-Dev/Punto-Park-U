# Backend Auth Specification

## Purpose

Implement JWT-based authentication with access and refresh tokens, bcryptjs password hashing, and role-based authorization middleware. Endpoints: register, login, current user, token refresh.

## Requirements

### Requirement: POST /api/auth/register

The register endpoint MUST create a new user with hashed password and return JWT tokens.

#### Scenario: Successful registration

- GIVEN valid `{ name, email, cedula, password, phone? }`
- WHEN POST `/api/auth/register` is called
- THEN a User document SHALL be created with bcryptjs-hashed password
- AND the response SHALL return `{ user: { name, email, role }, accessToken, refreshToken }` with status 201

#### Scenario: Duplicate email rejected

- GIVEN a user already exists with the email
- WHEN registering with the same email
- THEN the server SHALL return `{ error: "Email already registered" }` with status 409

#### Scenario: Validation error on missing fields

- GIVEN the request body is missing `email` or `password`
- WHEN POST `/api/auth/register` is called
- THEN the server SHALL return `{ error: "Validation error", details: [...] }` with status 400

### Requirement: POST /api/auth/login

The login endpoint MUST validate credentials and return access + refresh tokens.

#### Scenario: Successful login

- GIVEN a registered user with correct credentials
- WHEN POST `/api/auth/login` with `{ email, password }`
- THEN the server SHALL compare the password with bcryptjs
- AND return `{ user, accessToken, refreshToken }` with status 200

#### Scenario: Invalid credentials

- GIVEN a registered user
- WHEN POST `/api/auth/login` with wrong password
- THEN the server SHALL return `{ error: "Invalid credentials" }` with status 401

#### Scenario: User not found

- GIVEN no user exists with the email
- WHEN POST `/api/auth/login` is called
- THEN the server SHALL return `{ error: "Invalid credentials" }` with status 401
- AND the error message SHALL NOT distinguish between "not found" and "wrong password"

### Requirement: GET /api/auth/me

The current-user endpoint MUST return the authenticated user's profile, requiring a valid access token.

#### Scenario: Authenticated user gets profile

- GIVEN a valid JWT in the `Authorization: Bearer <token>` header
- WHEN GET `/api/auth/me` is called
- THEN the server SHALL return `{ user: { name, email, cedula, role, phone } }` with status 200
- AND the `password` field SHALL NOT be included

#### Scenario: Missing or invalid token

- GIVEN no Authorization header, or an expired/malformed token
- WHEN GET `/api/auth/me` is called
- THEN the server SHALL return `{ error: "Authentication required" }` with status 401

### Requirement: POST /api/auth/refresh

The refresh endpoint MUST issue a new access token from a valid refresh token.

#### Scenario: Valid refresh token

- GIVEN a valid refresh token in the request body `{ refreshToken }`
- WHEN POST `/api/auth/refresh` is called
- THEN the server SHALL verify the token
- AND return `{ accessToken }` with a NEW access token

#### Scenario: Expired or invalid refresh token

- GIVEN an expired refresh token
- WHEN POST `/api/auth/refresh` is called
- THEN the server SHALL return `{ error: "Invalid refresh token" }` with status 401

### Requirement: requireAuth Middleware

The `requireAuth` middleware MUST verify JWT access tokens and attach `req.user` for protected routes.

#### Scenario: Valid token passes middleware

- GIVEN a request with `Authorization: Bearer <valid-access-token>`
- WHEN the `requireAuth` middleware processes the request
- THEN `next()` SHALL be called
- AND `req.user` SHALL contain `{ id, email, role }`

#### Scenario: No token blocked

- GIVEN a request without Authorization header
- WHEN `requireAuth` processes the request
- THEN the middleware SHALL return `{ error: "Authentication required" }` with status 401

### Requirement: requireAdmin Middleware

The `requireAdmin` middleware MUST extend `requireAuth` and additionally check that the user's role is `admin`.

#### Scenario: Admin user passes

- GIVEN a request from a user with `role: "admin"`
- WHEN `requireAdmin` processes the request
- THEN `next()` SHALL be called

#### Scenario: Non-admin user blocked

- GIVEN a request from a user with `role: "user"`
- WHEN `requireAdmin` processes the request
- THEN the middleware SHALL return `{ error: "Admin access required" }` with status 403

### Acceptance Criteria

- [ ] `POST /api/auth/register` creates user with hashed password, returns JWT (201)
- [ ] `POST /api/auth/login` validates credentials, returns access + refresh tokens (200)
- [ ] `GET /api/auth/me` returns current user profile (200) or 401 if unauthenticated
- [ ] `POST /api/auth/refresh` returns new access token (200) or 401 if refresh token invalid
- [ ] Access tokens expire in 15 minutes; refresh tokens expire in 7 days
- [ ] `requireAuth` middleware blocks unauthenticated requests (401)
- [ ] `requireAdmin` middleware blocks non-admin users (403)

### Dependencies

- `jsonwebtoken`, `bcryptjs` packages
- `backend-foundation` — Express app with middleware pipeline
- `backend-models` — User model with password hashing
- `JWT_SECRET` and `JWT_REFRESH_SECRET` environment variables

# Delta: Auth — Email Verification

## ADDED Requirements

### Requirement: Send Verification Email

The system MUST send a verification email to newly registered users. Users SHALL verify their email before accessing protected features. In development, the verification link SHALL be printed to the server console.

#### Scenario: Verification email sent on registration

- **GIVEN** a user completes registration with email `juan@example.com`
- **WHEN** the User document is created
- **THEN** the server generates a verification token (32 bytes, hex)
- **AND** stores `verificationToken` and `verificationTokenExpiry` (24h) on the User document
- **AND** prints to console: `[EMAIL SIMULATION] To: juan@example.com | Verify: http://localhost:5173/verify-email/{token}`
- **AND** the registration response includes `{ message: "Registration successful. Please verify your email." }`

#### Scenario: User registered with `isVerified: false`

- **GIVEN** a newly registered user
- **WHEN** their User document is created
- **THEN** `isVerified` defaults to `false`
- **AND** `requireAuth` middleware checks `isVerified` and returns `403` if `false` (configurable)

### Requirement: Verify Email Endpoint

The system MUST provide an endpoint to verify a user's email using the token sent to them.

#### Scenario: Valid verification token

- **GIVEN** a user with a valid `verificationToken`
- **WHEN** `GET /api/auth/verify-email/{token}` is called
- **THEN** the server marks the user as `isVerified: true`
- **AND** clears `verificationToken` and `verificationTokenExpiry`
- **AND** returns `200 { message: "Email verified successfully" }`

#### Scenario: Expired verification token

- **GIVEN** a user whose `verificationTokenExpiry` is in the past
- **WHEN** `GET /api/auth/verify-email/{expiredToken}` is called
- **THEN** the server returns `400 { error: "Verification token has expired" }`
- **AND** clears the expired token fields

#### Scenario: Invalid verification token

- **GIVEN** a token that does not match any user
- **WHEN** `GET /api/auth/verify-email/invalidToken` is called
- **THEN** the server returns `400 { error: "Invalid verification token" }`

#### Scenario: Already verified user

- **GIVEN** a user whose `isVerified` is already `true`
- **WHEN** they attempt to verify again
- **THEN** the server returns `200 { message: "Email already verified" }`

### Requirement: Resend Verification Email

The system MUST allow users to request a new verification email if the original one was lost or expired. Resend SHALL be rate-limited to 2 requests per hour per user.

#### Scenario: Resend verification — unverified user

- **GIVEN** an authenticated but unverified user
- **WHEN** they call `POST /api/auth/resend-verification`
- **THEN** the server generates a new `verificationToken` with a fresh 24h expiry
- **AND** prints the new verification URL to the console
- **AND** returns `200 { message: "Verification email sent" }`

#### Scenario: Resend verification — already verified

- **GIVEN** an authenticated and already verified user
- **WHEN** they call `POST /api/auth/resend-verification`
- **THEN** the server returns `200 { message: "Email already verified" }`
- **AND** no new token is generated

#### Scenario: Resend verification — rate limited

- **GIVEN** an unverified user who has requested 2 resends in the last hour
- **WHEN** they request a third resend
- **THEN** the server returns `429 { error: "Too many requests. Try again later." }`

### Requirement: Protected Routes Block Unverified Users

The system SHALL optionally block unverified users from accessing certain protected routes. This behavior MUST be configurable per environment.

#### Scenario: Verified user accesses protected route

- **GIVEN** a user with `isVerified: true` and valid JWT
- **WHEN** they access any `requireAuth` protected route
- **THEN** the request is processed normally

#### Scenario: Unverified user accesses protected route (strict mode)

- **GIVEN** a user with `isVerified: false` and valid JWT
- **WHEN** the server is configured with `REQUIRE_EMAIL_VERIFICATION=true`
- **AND** they access a `requireAuth` protected route
- **THEN** the server returns `403 { error: "Email verification required" }`

#### Scenario: Unverified user accesses protected route (permissive mode)

- **GIVEN** a user with `isVerified: false` and valid JWT
- **WHEN** the server is configured with `REQUIRE_EMAIL_VERIFICATION=false` (or not set)
- **AND** they access a `requireAuth` protected route
- **THEN** the request is processed normally

## MODIFIED Requirements

### Requirement: User Model Schema

The User model MUST include email verification fields.

(Previously: User model had no verification fields)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `isVerified` | Boolean | No | Default `false`. Set `true` after verification or Google OAuth |
| `verificationToken` | String | No | Hashed verification token |
| `verificationTokenExpiry` | Date | No | Expires 24 hours after generation |

### Requirement: User Registration Response

The registration response MUST indicate verification status.

(Previously: registration returned tokens immediately without verification)

#### Scenario: Registration returns verification message

- **GIVEN** a successful registration
- **WHEN** the response is sent
- **THEN** it includes `{ message: "Registration successful. Please verify your email." }`
- **AND** tokens are still returned (user can browse but with limited access if strict mode is on)

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/models/User.js` | Modify | Add `isVerified`, `verificationToken`, `verificationTokenExpiry` |
| `backend/src/controllers/authController.js` | Modify | Add `verifyEmail`, `resendVerification` handlers; update `register` to generate token |
| `backend/src/routes/auth.js` | Modify | Add `GET /verify-email/:token`, `POST /resend-verification` |
| `backend/src/middleware/requireAuth.js` | Modify | Add optional `isVerified` check (env-configurable) |
| `backend/.env.example` | Modify | Add `REQUIRE_EMAIL_VERIFICATION` variable |
| `src/pages/VerifyEmailPage.tsx` | Create | Verification confirmation/failure page |
| `src/services/auth.service.ts` | Modify | Add `verifyEmailService()`, `resendVerificationService()` |
| `src/routes/AppRoutes.tsx` | Modify | Add `/verify-email/:token` route |
| `src/types/index.ts` | Modify | Add `VerificationResponse` type |

## Dependencies

- `crypto` (Node.js built-in) — for token generation

## Acceptance Criteria

- Registration triggers verification email (simulated in dev)
- Verification token works once and expires after 24h
- Resend is rate-limited to 2/hour per user
- Protected routes respect `REQUIRE_EMAIL_VERIFICATION` env var
- Google OAuth users are auto-verified

# Delta: Auth — Password Recovery

## ADDED Requirements

### Requirement: Forgot Password Flow

The system MUST support password recovery via email. Users SHALL request a reset link, receive it via email (simulated), and set a new password using a time-limited token.

#### Scenario: User requests password reset — valid email

- **GIVEN** a registered user with email `juan@example.com`
- **WHEN** they submit `POST /api/auth/forgot-password` with `{ email: "juan@example.com" }`
- **THEN** the server generates a cryptographically random reset token (32 bytes, hex-encoded)
- **AND** stores it in the User document with a 1-hour expiry (`resetToken`, `resetTokenExpiry`)
- **AND** prints the reset URL to the server console: `[EMAIL SIMULATION] Reset: http://localhost:5173/reset-password/{token}`
- **AND** returns `200 { message: "If the email exists, a reset link has been sent" }`

#### Scenario: User requests password reset — non-existent email

- **GIVEN** an email not registered in the system
- **WHEN** they submit `POST /api/auth/forgot-password` with `{ email: "unknown@example.com" }`
- **THEN** the server returns `200 { message: "If the email exists, a reset link has been sent" }`
- **AND** no token is generated
- **AND** the response is identical to prevent email enumeration

#### Scenario: User requests password reset — missing email

- **GIVEN** any request to the forgot-password endpoint
- **WHEN** `POST /api/auth/forgot-password` is called without an `email` field
- **THEN** the server returns `400 { error: "Email is required" }`

### Requirement: Reset Password with Token

The system MUST validate the reset token and allow the user to set a new password within the expiry window.

#### Scenario: Valid reset token — password updated

- **GIVEN** a user with a valid `resetToken` not yet expired
- **WHEN** they submit `POST /api/auth/reset-password/{token}` with `{ password: "newSecurePass123" }`
- **THEN** the server hashes the new password, saves it to the User document
- **AND** clears `resetToken` and `resetTokenExpiry` fields
- **AND** returns `200 { message: "Password reset successfully" }`

#### Scenario: Expired reset token

- **GIVEN** a user whose `resetTokenExpiry` is in the past
- **WHEN** they submit the reset password request with the expired token
- **THEN** the server returns `400 { error: "Reset token has expired" }`
- **AND** clears the expired token fields from the User document

#### Scenario: Invalid reset token

- **GIVEN** a reset token that does not match any user or is malformed
- **WHEN** `POST /api/auth/reset-password/fakeToken123` is called
- **THEN** the server returns `400 { error: "Invalid reset token" }`

#### Scenario: Weak password rejected

- **GIVEN** a valid reset token
- **WHEN** the new password is fewer than 6 characters
- **THEN** the server returns `400 { error: "Validation error", details: [...] }`
- **AND** the user's password remains unchanged

### Requirement: Rate Limiting on Forgot Password

The system MUST rate-limit password reset requests to prevent abuse. Each IP SHALL be limited to 3 requests per 15-minute window.

#### Scenario: Rate limit not exceeded

- **GIVEN** a client has made 2 reset requests in 15 minutes
- **WHEN** they make a third request
- **THEN** the request is processed normally

#### Scenario: Rate limit exceeded

- **GIVEN** a client has made 3 reset requests in 15 minutes
- **WHEN** they make a fourth request
- **THEN** the server returns `429 { error: "Too many requests. Try again later." }`

### Requirement: Email Simulation

In development mode, the system MUST NOT send real emails. It SHALL log the reset URL to the server console.

#### Scenario: Development mode — console log

- **GIVEN** `NODE_ENV` is `"development"` or not `"production"`
- **WHEN** a password reset is requested
- **THEN** the server prints `[EMAIL SIMULATION] To: {email} | Subject: Password Reset | Reset URL: {url}` to stdout
- **AND** no SMTP connection is attempted

#### Scenario: Production mode — real email (future)

- **GIVEN** `NODE_ENV` is `"production"` and an email provider is configured
- **WHEN** a password reset is requested
- **THEN** the server SHALL send a real email via the configured provider
- **AND** SHALL NOT expose the reset token in console logs

## MODIFIED Requirements

### Requirement: User Model Schema

The User model MUST include password reset fields.

(Previously: User model had no password reset fields)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `resetToken` | String | No | Hashed reset token |
| `resetTokenExpiry` | Date | No | Expires 1 hour after generation |

#### Scenario: Token fields added

- **GIVEN** the database migration runs
- **WHEN** existing User documents are queried
- **THEN** `resetToken` and `resetTokenExpiry` default to `undefined`/`null` for existing users

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/models/User.js` | Modify | Add `resetToken`, `resetTokenExpiry` fields |
| `backend/src/controllers/authController.js` | Modify | Add `forgotPassword`, `resetPassword` handlers |
| `backend/src/routes/auth.js` | Modify | Add `POST /forgot-password`, `POST /reset-password/:token` |
| `backend/src/middleware/rateLimiter.js` | Create | Reusable rate limiter for forgot-password |
| `backend/src/utils/emailSimulator.js` | Create | Email simulation utility |
| `src/pages/ResetPasswordPage.tsx` | Create | Reset password form page |
| `src/services/auth.service.ts` | Modify | Add `forgotPasswordService()`, `resetPasswordService()` |
| `src/routes/AppRoutes.tsx` | Modify | Add `/reset-password/:token` route |
| `src/types/index.ts` | Modify | Add `ForgotPasswordRequest`, `ResetPasswordRequest` types |

## Dependencies

- `crypto` (Node.js built-in) — for secure token generation

## Acceptance Criteria

- User can request password reset and receive a simulated email
- Reset token expires after 1 hour
- Successful reset invalidates the token (one-time use)
- Identical response for valid and non-existent emails (anti-enumeration)

# Delta: Auth — Two-Factor Authentication (TOTP)

## ADDED Requirements

### Requirement: Enable 2FA — Generate TOTP Secret and QR Code

The system MUST support TOTP-based two-factor authentication using the standard RFC 6238 algorithm. Users SHALL enable 2FA from their profile settings, which generates a shared secret and a QR code URI.

#### Scenario: Enable 2FA — first time

- **GIVEN** an authenticated user without 2FA enabled
- **WHEN** they call `POST /api/auth/2fa/enable`
- **THEN** the server generates a unique TOTP secret (base32, 32 chars)
- **AND** stores it temporarily as `twoFactorTempSecret` (not yet active)
- **AND** generates an `otpauth://` URI for QR code generation
- **AND** returns `{ secret, qrCodeUri }`
- **AND** the user MUST verify with a valid TOTP code before 2FA is fully enabled

#### Scenario: Enable 2FA — already enabled

- **GIVEN** an authenticated user with `twoFactorEnabled: true`
- **WHEN** they call `POST /api/auth/2fa/enable`
- **THEN** the server returns `400 { error: "2FA is already enabled. Disable it first to reconfigure." }`

### Requirement: Verify and Activate 2FA

After generating the secret, the user MUST verify they can produce a valid TOTP code before 2FA is activated.

#### Scenario: Verify with valid TOTP code

- **GIVEN** a user with a pending `twoFactorTempSecret`
- **WHEN** they call `POST /api/auth/2fa/verify` with `{ token: "123456" }` (valid TOTP)
- **THEN** the server promotes `twoFactorTempSecret` → `twoFactorSecret`
- **AND** sets `twoFactorEnabled: true`
- **AND** generates 8 backup codes (8 chars each), hashes them, and stores hashed versions
- **AND** returns `{ message: "2FA enabled", backupCodes: ["abcd1234", "efgh5678", ...] }` (plaintext — shown once)

#### Scenario: Verify with invalid TOTP code

- **GIVEN** a user with a pending `twoFactorTempSecret`
- **WHEN** they call `POST /api/auth/2fa/verify` with `{ token: "000000" }` (invalid)
- **THEN** the server returns `400 { error: "Invalid verification code" }`
- **AND** the `twoFactorTempSecret` is preserved (user can retry)

#### Scenario: Verify without pending secret

- **GIVEN** a user who has not called `POST /api/auth/2fa/enable`
- **WHEN** they call `POST /api/auth/2fa/verify`
- **THEN** the server returns `400 { error: "No pending 2FA setup. Call /2fa/enable first." }`

### Requirement: 2FA Challenge During Login

When a user with 2FA enabled logs in, the system MUST return a partial authentication state requiring a TOTP challenge, rather than a full JWT.

#### Scenario: Login with 2FA — challenge required

- **GIVEN** a user with `twoFactorEnabled: true` and correct credentials
- **WHEN** they call `POST /api/auth/login` with valid email + password
- **THEN** the server returns `200 { requires2FA: true, tempToken: "<short-lived-5min-token>" }`
- **AND** does NOT return access/refresh tokens
- **AND** the tempToken is signed with a separate secret and cannot access protected routes

#### Scenario: Login with 2FA — code verified

- **GIVEN** a valid `tempToken` from the 2FA challenge response
- **WHEN** they call `POST /api/auth/2fa/verify-login` with `{ tempToken, token: "123456" }` (valid TOTP)
- **THEN** the server returns full JWT access + refresh tokens
- **AND** invalidates the tempToken

#### Scenario: Login with 2FA — invalid TOTP code

- **GIVEN** a valid `tempToken`
- **WHEN** they call `POST /api/auth/2fa/verify-login` with `{ tempToken, token: "000000" }` (invalid TOTP)
- **THEN** the server returns `401 { error: "Invalid verification code" }`
- **AND** the tempToken remains valid (user can retry up to 3 times)

#### Scenario: Login with 2FA — too many attempts

- **GIVEN** a `tempToken` that has been used for 3 failed attempts
- **WHEN** a fourth attempt is made
- **THEN** the server returns `401 { error: "Too many attempts. Please log in again." }`
- **AND** the tempToken is invalidated

### Requirement: Backup Codes

The system MUST provide one-time-use backup codes that allow bypassing TOTP when the authenticator device is unavailable.

#### Scenario: Login with valid backup code

- **GIVEN** a valid `tempToken` from a 2FA login challenge
- **WHEN** the user provides a valid backup code instead of a TOTP token
- **THEN** the server accepts it, marks that backup code as used (invalidated)
- **AND** returns full JWT access + refresh tokens

#### Scenario: Login with already-used backup code

- **GIVEN** a backup code that has been previously used
- **WHEN** the user attempts to use it again
- **THEN** the server returns `401 { error: "Backup code already used" }`

#### Scenario: Generate new backup codes

- **GIVEN** an authenticated user with 2FA enabled
- **WHEN** they call `POST /api/auth/2fa/backup-codes`
- **THEN** the server generates 8 new backup codes
- **AND** invalidates all previous backup codes
- **AND** returns the new codes (plaintext, shown once)

### Requirement: Disable 2FA

The system MUST allow users to disable 2FA from their profile, requiring either their password or a valid TOTP code for confirmation.

#### Scenario: Disable 2FA with password confirmation

- **GIVEN** an authenticated user with 2FA enabled
- **WHEN** they call `DELETE /api/auth/2fa` with `{ password: "currentPassword" }` (valid)
- **THEN** the server clears `twoFactorSecret`, `twoFactorEnabled`, `backupCodes`
- **AND** returns `200 { message: "2FA disabled" }`

#### Scenario: Disable 2FA with wrong password

- **GIVEN** an authenticated user with 2FA enabled
- **WHEN** they call `DELETE /api/auth/2fa` with `{ password: "wrongPassword" }`
- **THEN** the server returns `401 { error: "Invalid password" }`

## MODIFIED Requirements

### Requirement: User Model Schema

The User model MUST include 2FA fields.

(Previously: User model had no 2FA fields)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `twoFactorSecret` | String | No | Encrypted TOTP secret (active) |
| `twoFactorTempSecret` | String | No | Temporary secret during setup (not yet active) |
| `twoFactorEnabled` | Boolean | No | Default `false` |
| `backupCodes` | [String] | No | Array of hashed backup codes |

### Requirement: Login Response

The login endpoint MUST handle 2FA challenge responses.

(Previously: login returned tokens immediately on valid credentials)

#### Scenario: Login without 2FA — direct tokens

- **GIVEN** a user with `twoFactorEnabled: false` and correct credentials
- **WHEN** they call `POST /api/auth/login`
- **THEN** the server returns access + refresh tokens as before (no behavioral change)

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/models/User.js` | Modify | Add `twoFactorSecret`, `twoFactorTempSecret`, `twoFactorEnabled`, `backupCodes` |
| `backend/src/controllers/authController.js` | Modify | Add `enable2FA`, `verify2FA`, `verify2FALogin`, `disable2FA`, `generateBackupCodes`; update `login` for 2FA challenge |
| `backend/src/routes/auth.js` | Modify | Add 2FA routes |
| `backend/package.json` | Modify | Add `speakeasy` and `qrcode` dependencies |
| `backend/src/utils/totp.js` | Create | TOTP utility (secret generation, code verification, QR URI) |
| `backend/src/utils/backupCodes.js` | Create | Backup code generation and hashing utility |
| `src/pages/TwoFactorSetup.tsx` | Create | QR code display, code verification form |
| `src/pages/TwoFactorChallenge.tsx` | Create | TOTP input after login for 2FA users |
| `src/services/auth.service.ts` | Modify | Add `enable2FAService()`, `verify2FAService()`, `verify2FALoginService()`, `disable2FAService()` |
| `src/stores/authStore.ts` | Modify | Handle `requires2FA` login response, store `tempToken` |
| `src/types/index.ts` | Modify | Add `TwoFactorSetupResponse`, `TwoFactorChallengeResponse` types |

## Dependencies

- `speakeasy` (npm) — RFC 6238 TOTP implementation
- `qrcode` (npm) — QR code generation for otpauth:// URI
- `crypto` (Node.js built-in) — for backup code generation

## Acceptance Criteria

- QR code displayed for authenticator app setup
- TOTP code verified with ±1 time step tolerance (30s window)
- Login returns `requires2FA` challenge when 2FA is enabled
- Backup codes are one-time-use, hashed at rest
- Disabling 2FA requires password confirmation

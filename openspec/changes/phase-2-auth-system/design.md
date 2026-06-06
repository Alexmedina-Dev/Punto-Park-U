# Design: Phase 2 — Auth System

## Technical Approach

Extend the existing JWT-based auth (Phase 1) with six capabilities: Google OAuth 2.0, password recovery, email verification, TOTP 2FA, session management, and RBAC. All backend work stays within the Express + Mongoose stack. Frontend additions follow the existing React + TypeScript + Zustand pattern.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| OAuth library | `google-auth-library` | Passport.js | Lighter for a single provider; direct token exchange |
| Reset/verify tokens | `crypto.randomBytes` + bcrypt hash | JWT | Hashed tokens can be revoked instantly by clearing the field |
| 2FA implementation | `speakeasy` + `qrcode` | Custom RFC 6238 | Battle-tested; generates otpauth URIs and verifies windows automatically |
| Session blacklist | MongoDB `Session` model (`isActive`) | Redis deny-list | Project already uses MongoDB; no new infrastructure |
| RBAC hierarchy | Ordered array (`guest < user < operator < admin`) | Bitmask | Readable, extensible, simple middleware check |
| Email delivery | Console simulation (dev) / SMTP stub (prod) | Real SMTP in dev | Spec requires simulation in development |
| Cleanup | `setInterval` hourly | `node-cron` | Avoid extra dependency; interval is sufficient |

## Data Flow

### Google OAuth

```
Frontend: click "Sign in with Google"
  → GET /api/auth/google
  → Backend redirects to Google consent screen
  → Google redirects to /api/auth/google/callback?code=...
  → Backend exchanges code → profile → find/link User → JWT
  → Redirects to frontend with tokens
```

### 2FA Login Challenge

```
POST /api/auth/login (valid credentials + 2FA enabled)
  → returns { requires2FA: true, tempToken: "<5min-jwt>" }

POST /api/auth/2fa/verify-login { tempToken, token: "123456" }
  → verify speakeasy → invalidate tempToken → return access + refresh tokens
```

### Session Lifecycle

```
Login/Refresh → create Session document with hashed refreshToken
Authenticated request → update Session.lastActivity
Logout/Revoke → mark Session.isActive = false
Hourly cleanup → mark inactive if lastActivity > 30 min or createdAt > 7 days
```

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/src/models/User.js` | Modify | Add `googleId`, `authProvider`, `isVerified`, `resetToken`, `resetTokenExpiry`, `verificationToken`, `verificationTokenExpiry`, `twoFactorSecret`, `twoFactorTempSecret`, `twoFactorEnabled`, `backupCodes`, update `role` enum |
| `backend/src/models/Session.js` | Create | Session schema with `userId`, `refreshTokenHash`, `ipAddress`, `userAgent`, `lastActivity`, `createdAt`, `isActive` |
| `backend/src/controllers/authController.js` | Modify | Add handlers: `googleCallback`, `forgotPassword`, `resetPassword`, `verifyEmail`, `resendVerification`, `enable2FA`, `verify2FA`, `verify2FALogin`, `disable2FA`, `generateBackupCodes`, `listSessions`, `revokeSession`, `revokeAllSessions`, `updateUserRole`; update `login`, `refresh`, `logout`, `register` |
| `backend/src/routes/auth.js` | Modify | Wire all new endpoints under `/api/auth` |
| `backend/src/middleware/requireAuth.js` | Modify | Verify JWT, lookup session, update `lastActivity`, optional `isVerified` check |
| `backend/src/middleware/requireRole.js` | Create | `requireRole(minRole)` and `requireRoles([...])` with hierarchy inheritance |
| `backend/src/middleware/requireAdmin.js` | Modify | Refactor to delegate to `requireRole('admin')` |
| `backend/src/middleware/sessionActivity.js` | Create | Updates `lastActivity` on every authenticated request |
| `backend/src/middleware/rateLimiter.js` | Create | Reusable limiters: forgot-password (3 per 15 min), resend-verify (2 per hour) |
| `backend/src/utils/totp.js` | Create | Secret generation, QR URI, code verification |
| `backend/src/utils/backupCodes.js` | Create | Generate 8 codes; hash/verify with bcrypt |
| `backend/src/utils/emailSimulator.js` | Create | Logs `[EMAIL SIMULATION]` to console in dev; SMTP stub in prod |
| `backend/src/utils/sessionCleanup.js` | Create | Hourly interval to expire stale sessions |
| `backend/package.json` | Modify | Add `google-auth-library`, `speakeasy`, `qrcode` |
| `backend/.env` | Modify | Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `REQUIRE_EMAIL_VERIFICATION`, `SESSION_INACTIVITY_TIMEOUT_MINUTES` |
| `src/pages/ResetPasswordPage.tsx` | Create | Reset password form |
| `src/pages/VerifyEmailPage.tsx` | Create | Email verification landing |
| `src/pages/TwoFactorSetup.tsx` | Create | QR display and verification input |
| `src/pages/TwoFactorChallenge.tsx` | Create | TOTP input after login |
| `src/pages/SessionManagement.tsx` | Create | Active sessions list with revoke |
| `src/services/auth.service.ts` | Modify | Add all new API service functions |
| `src/stores/authStore.ts` | Modify | Handle `requires2FA`, store `tempToken`, OAuth state |
| `src/types/index.ts` | Modify | Add `OAuthProvider`, `TwoFactorSetupResponse`, `Session`, role type |

## Interfaces / Contracts

```typescript
// Role hierarchy — higher index = more permissions
const ROLE_HIERARCHY = ['guest', 'user', 'operator', 'admin'];

// 2FA setup response
interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUri: string;
}

// Login response variant
interface LoginResponse {
  requires2FA?: boolean;
  tempToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

// Session (exposed to client)
interface Session {
  id: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  createdAt: string;
  isCurrent: boolean;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | TOTP/backup code utils, role hierarchy, token hashing | Manual verification scripts (no test runner configured) |
| Integration | OAuth callback, 2FA challenge, session revoke, RBAC enforcement | Postman / curl collection |
| E2E | Full flows: register → verify → login → 2FA → logout | Manual frontend-to-backend walkthrough |

## Migration / Rollout

1. **Schema**: Mongoose additions are backward-compatible; existing documents default new fields to `undefined`.
2. **Users**: Existing users keep current `role` (`user`/`admin`); `authProvider` becomes `'local'`; `isVerified` stays `false`.
3. **Environment**: Add new env vars before restart.
4. **Deploy**: Stop → install new npm deps → start. No data migration script required.

## Open Questions

None.

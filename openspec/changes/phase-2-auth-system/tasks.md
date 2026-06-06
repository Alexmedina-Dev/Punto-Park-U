# Tasks: Phase 2 — Auth System

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2,000–3,500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | 7 work units (1 per batch) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | OAuth Google login/link | PR 1 | Targets `feature/phase-2-auth`; includes model changes |
| 2 | Password recovery flow | PR 2 | Targets PR 1 branch; rate limiter reusable later |
| 3 | Email verification | PR 3 | Targets PR 2 branch; strict mode env-gated |
| 4 | 2FA TOTP | PR 4 | Targets PR 3 branch; new deps: speakeasy, qrcode |
| 5 | Session management | PR 5 | Targets PR 4 branch; new Session model |
| 6 | RBAC roles & middleware | PR 6 | Targets PR 5 branch; hierarchy + admin endpoints |
| 7 | Integration & verification | PR 7 | Targets PR 6 branch; tests, cleanup, docs |

---

## Batch 1: OAuth Google

**1.1** Add OAuth fields to User model (`googleId`, `authProvider`, `isVerified`)
- Files: `backend/src/models/User.js`
- Dependencies: None
- AC: Schema accepts new fields; existing docs remain valid

**1.2** Install `google-auth-library` and add OAuth env vars
- Files: `backend/package.json`, `backend/.env`, `backend/.env.example`
- Dependencies: None
- AC: `npm install` succeeds; env vars documented

**1.3** Implement `GET /api/auth/google` redirect and `GET /api/auth/google/callback` handler
- Files: `backend/src/routes/auth.js`, `backend/src/controllers/authController.js`
- Dependencies: 1.1, 1.2
- AC: Redirect to Google consent screen; callback exchanges code, creates/links user, returns JWTs

**1.4** Add Google sign-in button to LoginPage and RegisterPage
- Files: `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`
- Dependencies: 1.3
- AC: Button visible; click initiates OAuth flow; success redirects to dashboard

**1.5** Add `loginWithGoogle` action to authStore and service helpers
- Files: `src/stores/authStore.ts`, `src/services/auth.service.ts`, `src/types/index.ts`
- Dependencies: 1.4
- AC: Store handles OAuth state; types compile

---

## Batch 2: Password Recovery

**2.1** Add reset token fields to User model (`resetToken`, `resetTokenExpiry`)
- Files: `backend/src/models/User.js`
- Dependencies: 1.1
- AC: Fields optional; no impact on existing users

**2.2** Create reusable rate limiter middleware (`backend/src/middleware/rateLimiter.js`)
- Files: `backend/src/middleware/rateLimiter.js`
- Dependencies: None
- AC: 3 requests / 15 min per IP; returns 429 when exceeded

**2.3** Create email simulator utility (`backend/src/utils/emailSimulator.js`)
- Files: `backend/src/utils/emailSimulator.js`
- Dependencies: None
- AC: Logs `[EMAIL SIMULATION]` in dev; no-op stub for production

**2.4** Implement `POST /api/auth/forgot-password` and `POST /api/auth/reset-password/:token`
- Files: `backend/src/controllers/authController.js`, `backend/src/routes/auth.js`
- Dependencies: 2.1, 2.2, 2.3
- AC: 200 for any email (anti-enumeration); token valid 1h; password validated; token cleared on use

**2.5** Create ResetPasswordPage and wire route
- Files: `src/pages/ResetPasswordPage.tsx`, `src/routes/AppRoutes.tsx`, `src/services/auth.service.ts`, `src/types/index.ts`
- Dependencies: 2.4
- AC: Form validates password; calls API; shows success/error

---

## Batch 3: Email Verification

**3.1** Add verification fields to User model (`isVerified`, `verificationToken`, `verificationTokenExpiry`)
- Files: `backend/src/models/User.js`
- Dependencies: 2.1
- AC: Defaults: `isVerified: false`; token fields optional

**3.2** Update registration to generate verification token and print simulated email
- Files: `backend/src/controllers/authController.js`
- Dependencies: 2.3, 3.1
- AC: Token 32 bytes hex, 24h expiry; console logs URL; response message updated

**3.3** Implement `GET /api/auth/verify-email/:token` and `POST /api/auth/resend-verification`
- Files: `backend/src/controllers/authController.js`, `backend/src/routes/auth.js`
- Dependencies: 3.2
- AC: Valid token → verified + fields cleared; expired → 400 + cleared; resend rate-limited 2/hour

**3.4** Update `requireAuth` middleware with optional `isVerified` check
- Files: `backend/src/middleware/requireAuth.js`, `backend/.env.example`
- Dependencies: 3.1
- AC: `REQUIRE_EMAIL_VERIFICATION=true` → 403 for unverified; false → passes

**3.5** Create VerifyEmailPage and wire route
- Files: `src/pages/VerifyEmailPage.tsx`, `src/routes/AppRoutes.tsx`, `src/services/auth.service.ts`, `src/types/index.ts`
- Dependencies: 3.3
- AC: Handles token param; shows verified / expired / invalid state

---

## Batch 4: 2FA TOTP

**4.1** Add 2FA fields to User model (`twoFactorSecret`, `twoFactorTempSecret`, `twoFactorEnabled`, `backupCodes`)
- Files: `backend/src/models/User.js`
- Dependencies: 3.1
- AC: All fields optional; defaults correct

**4.2** Install `speakeasy` and `qrcode`; create TOTP and backup code utilities
- Files: `backend/package.json`, `backend/src/utils/totp.js`, `backend/src/utils/backupCodes.js`
- Dependencies: None
- AC: `generateSecret`, `verifyToken`, `generateQrUri`; backup codes 8x8 chars, hashed

**4.3** Implement `POST /api/auth/2fa/enable`, `POST /api/auth/2fa/verify`, `DELETE /api/auth/2fa`
- Files: `backend/src/controllers/authController.js`, `backend/src/routes/auth.js`
- Dependencies: 4.1, 4.2
- AC: Enable → temp secret + QR URI; verify → promote secret, backup codes shown once; disable → password check

**4.4** Update login to return 2FA challenge when enabled
- Files: `backend/src/controllers/authController.js`
- Dependencies: 4.3
- AC: 2FA enabled → `requires2FA: true` + `tempToken`; disabled → direct tokens

**4.5** Implement `POST /api/auth/2fa/verify-login` with backup code support
- Files: `backend/src/controllers/authController.js`, `backend/src/routes/auth.js`
- Dependencies: 4.4
- AC: Valid TOTP → tokens; valid backup code → tokens + mark used; 3 failures invalidate tempToken

**4.6** Create TwoFactorSetup and TwoFactorChallenge pages
- Files: `src/pages/TwoFactorSetup.tsx`, `src/pages/TwoFactorChallenge.tsx`, `src/services/auth.service.ts`, `src/stores/authStore.ts`, `src/types/index.ts`
- Dependencies: 4.5
- AC: Setup shows QR, verifies code, displays backup codes; Challenge handles tempToken + TOTP/backup

---

## Batch 5: Session Management

**5.1** Create Session model (`backend/src/models/Session.js`)
- Files: `backend/src/models/Session.js`
- Dependencies: None
- AC: Schema matches spec; indexes on `userId`, `refreshTokenHash`, `isActive`

**5.2** Update login, refresh, and logout to create/revoke sessions
- Files: `backend/src/controllers/authController.js`
- Dependencies: 5.1
- AC: Login creates Session; refresh marks old inactive + creates new; logout marks inactive

**5.3** Create session activity middleware and inactivity timeout check
- Files: `backend/src/middleware/sessionActivity.js`, `backend/src/middleware/requireAuth.js`
- Dependencies: 5.2
- AC: Updates `lastActivity` on authed requests; refresh rejects stale sessions with 401

**5.4** Implement `GET /api/auth/sessions`, `DELETE /api/auth/sessions/:id`, `DELETE /api/auth/sessions`
- Files: `backend/src/controllers/authController.js`, `backend/src/routes/auth.js`
- Dependencies: 5.3
- AC: Lists active sessions with `isCurrent`; revokes others; blocks self-revoke; 404 for others' sessions

**5.5** Create session cleanup utility and schedule hourly cleanup
- Files: `backend/src/utils/sessionCleanup.js`
- Dependencies: 5.1
- AC: Marks sessions >7 days inactive; runs every hour via `setInterval`/`node-cron`

**5.6** Create SessionManagement page and wire route
- Files: `src/pages/SessionManagement.tsx`, `src/routes/AppRoutes.tsx`, `src/services/auth.service.ts`, `src/types/index.ts`
- Dependencies: 5.4
- AC: Shows session list; revoke single / all others; refresh after action

---

## Batch 6: RBAC

**6.1** Update User model role enum to `['admin', 'operator', 'user', 'guest']`
- Files: `backend/src/models/User.js`
- Dependencies: 1.1
- AC: Default `"user"`; existing roles preserved; guest not assignable via registration

**6.2** Create `requireRole` and `requireRoles` middleware with hierarchy
- Files: `backend/src/middleware/requireRole.js`
- Dependencies: 6.1
- AC: `admin` inherits `operator` and `user`; `operator` inherits `user`; returns 403/401 as spec'd

**6.3** Refactor `requireAdmin` to use `requireRole('admin')`
- Files: `backend/src/middleware/requireAdmin.js`
- Dependencies: 6.2
- AC: Behavior unchanged; no regression on existing routes

**6.4** Add admin role endpoints `GET /api/users` and `PUT /api/users/:id/role`
- Files: `backend/src/controllers/authController.js`, `backend/src/routes/auth.js`
- Dependencies: 6.2
- AC: Filter by role; validate enum; self-demotion blocked; non-admin → 403

**6.5** Update frontend types and add admin role service helpers
- Files: `src/types/index.ts`, `src/services/admin.service.ts`, `src/stores/adminStore.ts`
- Dependencies: 6.4
- AC: Type `'admin' | 'operator' | 'user' | 'guest'`; store actions for role management

---

## Batch 7: Integration and Verification

**7.1** Write backend integration tests for all auth flows
- Files: `backend/tests/auth.test.js` (or equivalent)
- Dependencies: Batches 1–6
- AC: Covers OAuth callback simulation, password reset, email verify, 2FA challenge, session revoke, RBAC hierarchy

**7.2** Wire all new frontend routes in AppRoutes with guards
- Files: `src/routes/AppRoutes.tsx`, `src/components/ProtectedRoute.tsx` (if needed)
- Dependencies: Batches 1–6
- AC: All routes accessible; unauthenticated redirects to login; role guards applied where needed

**7.3** Final review: env examples, dependency lockfiles, and README update
- Files: `backend/.env.example`, `README.md`
- Dependencies: Batches 1–6
- AC: All env vars documented; `npm ci` passes; README describes auth features

# Delta: Auth — Google OAuth Integration

## ADDED Requirements

### Requirement: Google OAuth Login

The system MUST support authentication via Google OAuth 2.0. Users SHALL log in with their Google account, and the system MUST auto-link accounts when the Google email matches an existing registered email.

#### Scenario: New user signs up with Google

- **GIVEN** a user without an existing Punto Park U account
- **WHEN** they click "Sign in with Google" and complete Google's consent screen
- **THEN** the system creates a new User record with `authProvider: 'google'`, `googleId`, and the Google profile email/name
- **AND** returns access + refresh JWT tokens
- **AND** marks the account as `isVerified: true` (Google has verified the email)

#### Scenario: Existing user links Google account by email match

- **GIVEN** a user registered with email `juan@example.com` (password auth)
- **WHEN** they sign in with Google using the same email
- **THEN** the system finds the existing user by email, sets `googleId` and `authProvider: 'google'`
- **AND** returns valid JWT tokens without requiring password

#### Scenario: Google OAuth consent denied

- **GIVEN** a user on the login page
- **WHEN** they click "Sign in with Google" but deny consent or close the popup
- **THEN** the system returns to the login page with no state change
- **AND** shows a non-blocking message "Sign-in cancelled"

#### Scenario: Google sign-in on registration page

- **GIVEN** a user on the registration page
- **WHEN** they click "Sign in with Google"
- **THEN** the system completes OAuth and redirects to the user dashboard
- **AND** skips the manual registration form entirely

### Requirement: OAuth Endpoints

The backend MUST expose Google OAuth endpoints under `/api/auth/google`.

#### Scenario: Initiate Google OAuth

- **GIVEN** the frontend requests `GET /api/auth/google`
- **WHEN** called
- **THEN** the server redirects to Google's OAuth consent screen with configured client ID, redirect URI, and scopes (`email`, `profile`)

#### Scenario: Google OAuth callback — success

- **GIVEN** Google redirects back with a valid authorization code
- **WHEN** `GET /api/auth/google/callback?code=...` is called
- **THEN** the server exchanges the code for tokens, fetches the Google profile
- **AND** creates or links the user account
- **AND** redirects to the frontend with a short-lived token or session param for the frontend to exchange for JWT

#### Scenario: Google OAuth callback — missing code

- **GIVEN** the callback is hit without a code parameter
- **WHEN** `GET /api/auth/google/callback` is called
- **THEN** the server returns `400 Bad Request` with error `"Missing authorization code"`

### Requirement: Frontend Google Sign-In Button

The frontend MUST render a "Sign in with Google" button on both the login page and registration page.

#### Scenario: Button renders on login page

- **GIVEN** an unauthenticated user on `/login`
- **WHEN** the page loads
- **THEN** a "Sign in with Google" button is visible below the credentials form
- **AND** clicking it starts the OAuth flow

#### Scenario: Button renders on registration page

- **GIVEN** an unauthenticated user on `/register`
- **WHEN** the page loads
- **THEN** a "Sign in with Google" button is visible below the registration form

## MODIFIED Requirements

### Requirement: User Model Schema

The User model MUST include OAuth-related fields.

(Previously: User model had no OAuth fields)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `googleId` | String | No | Unique, sparse index. Set when user authenticates via Google |
| `authProvider` | String | No | Enum: `"local"`, `"google"`. Defaults to `"local"` |
| `isVerified` | Boolean | No | Default `false`. Set `true` for Google OAuth users |

#### Scenario: User created via OAuth

- **GIVEN** a new user authenticates with Google
- **WHEN** the User document is created
- **THEN** `authProvider` is `"google"`, `googleId` is set, `isVerified` is `true`
- **AND** `password` is set to a securely generated random string (user never uses it)

#### Scenario: Existing local user links Google

- **GIVEN** an existing local user with email `juan@example.com`
- **WHEN** they sign in with Google using the same email
- **THEN** the User document is updated: `googleId` is set, `authProvider` becomes `"google"`
- **AND** the existing password is preserved (user can still use password login)

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/models/User.js` | Modify | Add `googleId`, `authProvider`, `isVerified` fields |
| `backend/src/controllers/authController.js` | Modify | Add `googleCallback` handler |
| `backend/src/routes/auth.js` | Modify | Add `GET /google`, `GET /google/callback` |
| `backend/.env` | Modify | Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| `backend/package.json` | Modify | Add `google-auth-library` dependency |
| `src/pages/LoginPage.tsx` | Modify | Add Google sign-in button |
| `src/pages/RegisterPage.tsx` | Modify | Add Google sign-in button |
| `src/services/auth.service.ts` | Modify | Add `googleAuthService()` function |
| `src/stores/authStore.ts` | Modify | Add `loginWithGoogle` action |
| `src/types/index.ts` | Modify | Add `OAuthProvider` type |

## Dependencies

- `google-auth-library` (npm)
- Google Cloud Console: OAuth 2.0 Client ID configured
- Redirect URI: `{API_BASE_URL}/api/auth/google/callback`

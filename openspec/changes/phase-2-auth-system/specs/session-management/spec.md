# Delta: Auth — Session Management

## ADDED Requirements

### Requirement: Session Tracking

The system MUST track active user sessions with device information, IP address, and last activity timestamp. Each session SHALL correspond to a refresh token issuance.

#### Scenario: Session created on login

- **GIVEN** a user successfully logs in
- **WHEN** the server issues access + refresh tokens
- **THEN** a Session document is created with:
  - `userId` — reference to User
  - `refreshToken` — hashed refresh token
  - `ipAddress` — client IP from request
  - `userAgent` — browser/device info
  - `lastActivity` — current timestamp
  - `createdAt` — current timestamp
  - `isActive` — `true`

#### Scenario: Session created on token refresh

- **GIVEN** a user has a valid refresh token
- **WHEN** `POST /api/auth/refresh` is called and succeeds
- **THEN** the old session is marked inactive
- **AND** a new Session document is created for the new refresh token
- **AND** `lastActivity` is updated to the current timestamp

### Requirement: List Active Sessions

The system MUST allow authenticated users to view all their active sessions.

#### Scenario: User lists their sessions

- **GIVEN** an authenticated user
- **WHEN** `GET /api/auth/sessions` is called
- **THEN** the server returns `200` with an array of sessions:
  ```json
  {
    "sessions": [
      {
        "id": "session_id",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0 ...",
        "lastActivity": "2026-06-06T15:30:00Z",
        "createdAt": "2026-06-06T10:00:00Z",
        "isCurrent": true
      }
    ]
  }
  ```
- **AND** the current session (matching the request's refresh token) is marked `isCurrent: true`
- **AND** sensitive fields (refresh token hash) are never exposed

#### Scenario: No sessions exist

- **GIVEN** an authenticated user with no recorded sessions (edge case)
- **WHEN** `GET /api/auth/sessions` is called
- **THEN** the server returns `200 { sessions: [] }`

### Requirement: Revoke a Specific Session

The system MUST allow users to revoke a specific session, invalidating its refresh token. The current session MUST NOT be revokeable via this endpoint (use logout instead).

#### Scenario: Revoke another session

- **GIVEN** an authenticated user with 3 active sessions (Desktop, Mobile, Tablet)
- **WHEN** they call `DELETE /api/auth/sessions/{sessionId}` targeting the Mobile session
- **THEN** the server marks that Session as `isActive: false`
- **AND** the associated refresh token is invalidated (any future refresh attempts fail)
- **AND** returns `200 { message: "Session revoked" }`

#### Scenario: Revoke current session (blocked)

- **GIVEN** an authenticated user
- **WHEN** they call `DELETE /api/auth/sessions/{currentSessionId}`
- **THEN** the server returns `400 { error: "Cannot revoke the current session. Use logout instead." }`

#### Scenario: Revoke non-existent session

- **GIVEN** an authenticated user
- **WHEN** they call `DELETE /api/auth/sessions/nonexistent`
- **THEN** the server returns `404 { error: "Session not found" }`

#### Scenario: Revoke another user's session (forbidden)

- **GIVEN** User A tries to revoke a session belonging to User B
- **WHEN** `DELETE /api/auth/sessions/{userB-sessionId}` is called by User A
- **THEN** the server returns `404 { error: "Session not found" }` (not 403, to prevent session ID enumeration)

### Requirement: Revoke All Other Sessions

The system MUST allow users to revoke all sessions except the current one.

#### Scenario: Revoke all other sessions

- **GIVEN** an authenticated user with 3 active sessions
- **WHEN** they call `DELETE /api/auth/sessions` (no sessionId)
- **THEN** the server marks all sessions EXCEPT the current one as `isActive: false`
- **AND** all associated refresh tokens are invalidated
- **AND** returns `200 { revoked: 2, message: "All other sessions revoked" }`

#### Scenario: Revoke all sessions — only one active

- **GIVEN** an authenticated user with only the current session
- **WHEN** they call `DELETE /api/auth/sessions`
- **THEN** the server returns `200 { revoked: 0, message: "No other sessions to revoke" }`

### Requirement: Session Cleanup on Logout

The system MUST invalidate the current session when the user logs out.

#### Scenario: Logout invalidates session

- **GIVEN** an authenticated user with an active session
- **WHEN** they call `POST /api/auth/logout`
- **THEN** the server marks the current session as `isActive: false`
- **AND** the refresh token is invalidated
- **AND** returns `200 { message: "Logged out successfully" }`

### Requirement: Inactivity Timeout

The system SHALL enforce an inactivity timeout. Sessions with no activity for a configurable period MUST be automatically invalidated.

#### Scenario: Session within activity window

- **GIVEN** a session with `lastActivity` 10 minutes ago
- **WHEN** the inactivity threshold is configured as 30 minutes
- **THEN** the session remains active

#### Scenario: Session exceeds inactivity threshold

- **GIVEN** a session with `lastActivity` 35 minutes ago
- **WHEN** the inactivity threshold is 30 minutes
- **AND** the user attempts to use the refresh token
- **THEN** the server returns `401 { error: "Session expired due to inactivity" }`
- **AND** the session is marked `isActive: false`

#### Scenario: Activity timestamp updated on API calls

- **GIVEN** an active session
- **WHEN** the user makes any authenticated API request
- **THEN** the session's `lastActivity` is updated to the current timestamp

### Requirement: Session Expiry Cleanup

The system MUST periodically clean up expired and inactive sessions. A cleanup job SHALL run every hour to remove sessions older than the refresh token expiry (7 days).

#### Scenario: Cleanup job runs

- **GIVEN** sessions older than 7 days
- **WHEN** the scheduled cleanup job executes
- **THEN** expired sessions are marked `isActive: false`

## ADDED Requirements (New Model)

### Requirement: Session Model

The system MUST define a Session MongoDB model with the following schema.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | ObjectId | Yes | Reference to User |
| `refreshTokenHash` | String | Yes | SHA-256 hash of the refresh token |
| `ipAddress` | String | Yes | Client IP |
| `userAgent` | String | No | Browser/device user-agent string |
| `lastActivity` | Date | Yes | Updated on every authenticated request |
| `createdAt` | Date | Yes | Session creation timestamp |
| `isActive` | Boolean | Yes | Default `true` |

## File Changes

| File | Action | Purpose |
|------|--------|---------|
| `backend/src/models/Session.js` | Create | Session MongoDB model |
| `backend/src/controllers/authController.js` | Modify | Update `login`, `refresh`, `logout` to manage sessions; add `listSessions`, `revokeSession`, `revokeAllSessions` |
| `backend/src/routes/auth.js` | Modify | Add `GET /sessions`, `DELETE /sessions/:id`, `DELETE /sessions` |
| `backend/src/middleware/requireAuth.js` | Modify | Update `lastActivity` on each authenticated request |
| `backend/src/middleware/sessionActivity.js` | Create | Middleware to update session activity timestamp |
| `backend/src/utils/sessionCleanup.js` | Create | Hourly cron-like cleanup of expired sessions |
| `backend/.env.example` | Modify | Add `SESSION_INACTIVITY_TIMEOUT_MINUTES` |
| `src/pages/SessionManagement.tsx` | Create | Session list page with revoke buttons |
| `src/services/auth.service.ts` | Modify | Add `listSessionsService()`, `revokeSessionService()`, `revokeAllSessionsService()` |
| `src/routes/AppRoutes.tsx` | Modify | Add `/sessions` route (protected) |
| `src/types/index.ts` | Modify | Add `Session`, `SessionListResponse` types |

## Dependencies

- `node-cron` (npm) — for periodic session cleanup (or `setInterval` as lightweight alternative)

## Acceptance Criteria

- Sessions tracked on login and refresh
- Users can see and revoke individual sessions
- Revoking current session is explicitly blocked
- Inactivity timeout invalidates stale sessions
- Cleanup runs periodically for expired sessions

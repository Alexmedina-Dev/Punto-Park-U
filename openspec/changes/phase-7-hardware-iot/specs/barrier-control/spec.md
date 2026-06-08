# barrier-control Specification

## Purpose

HTTP-based barrier arm actuation. Node.js backend sends open/close commands to ESP32 relay modules after entry validation (QR scan or license plate match). Supports auto-close timers and admin manual override.

## Requirements

### Requirement: Barrier Open After Validation

POST `/api/hardware/barriers/{id}/open` MUST send HTTP to the barrier's ESP32 relay endpoint. Requires JWT (admin or system token). Opening SHALL only occur after successful QR reservation validation or license plate match.

#### Scenario: QR validation opens barrier

- GIVEN user scans valid QR, reservation is active
- WHEN backend calls POST `/api/hardware/barriers/entry-1/open`
- THEN barrier ESP32 relay activates for 5s
- AND response returns `{barrierId: "entry-1", status: "open", openedAt: "..."}`

#### Scenario: Invalid entry rejected

- GIVEN QR scan has no matching reservation
- WHEN backend attempts barrier open
- THEN backend returns HTTP 403, barrier stays closed, event logged

### Requirement: Barrier Auto-Close

After opening, the barrier MUST auto-close after 30 seconds. Backend SHALL start a timer on open and call POST `/api/hardware/barriers/{id}/close` on expiry. Timer SHALL cancel on vehicle passage detection.

#### Scenario: Auto-close after timeout

- GIVEN barrier "entry-1" opened at T+0s
- WHEN 30s elapse with no passage sensor trigger
- THEN backend calls close endpoint, barrier status transitions to "closed"

#### Scenario: Vehicle passes before timeout

- GIVEN barrier "entry-1" open, auto-close timer at T+12s remaining
- WHEN entry passage sensor detects vehicle at T+18s
- THEN backend calls close immediately, cancels remaining timer

### Requirement: Barrier Status Endpoint

GET `/api/hardware/barriers` MUST return all configured barriers with current status, last action, and timestamp. Open to admin and system roles.

#### Scenario: List barrier states

- GIVEN 3 barriers: entry-1 (open), entry-2 (closed), exit-1 (closed)
- WHEN admin calls GET `/api/hardware/barriers`
- THEN response array contains all 3 with `{id, status, lastAction, lastActionAt}`

### Requirement: Admin Manual Override

POST `/api/hardware/barriers/{id}/override` SHALL force open or close any barrier regardless of validation state. MUST require admin role. MUST log override with admin ID, barrier ID, action, and timestamp.

#### Scenario: Admin forces barrier open

- GIVEN barrier "exit-1" is closed, admin JWT valid
- WHEN admin calls POST `/api/hardware/barriers/exit-1/override` with `{action: "open"}`
- THEN barrier opens, override logged with admin ID and ISO timestamp

#### Scenario: Non-admin override rejected

- GIVEN user token without admin role
- WHEN user calls override endpoint
- THEN backend returns HTTP 403, barrier unchanged

### Requirement: API Route Registration

**Migration delta — modifies `api` domain.** Backend `app.js` MUST register `/api/hardware` routes. The `hardware.js` router SHALL define:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/hardware/barriers` | Admin | List all barriers |
| POST | `/api/hardware/barriers/:id/open` | System/Admin | Open barrier |
| POST | `/api/hardware/barriers/:id/close` | System/Admin | Close barrier |
| POST | `/api/hardware/barriers/:id/override` | Admin | Manual override |
| GET | `/api/hardware/sensors` | Admin | List sensor statuses |

#### Scenario: Hardware routes registered

- GIVEN backend starts successfully
- WHEN Express app mounts `/api/hardware`
- THEN all 5 routes respond to their configured methods with auth middleware applied

# Backend Public API Specification

## Purpose

Expose three public (unauthenticated) endpoints consumed by the landing page: tariffs, schedule, and parking availability. All endpoints SHALL be read-only and return JSON.

## Requirements

### Requirement: GET /api/tariffs

The tariffs endpoint MUST return pricing for all vehicle types from MongoDB, with the frontend falling back to hardcoded defaults on error.

#### Scenario: Tariffs returned from database

- GIVEN tariff documents exist in MongoDB
- WHEN GET `/api/tariffs` is called
- THEN the server SHALL return `{ car: { hour, day, month }, moto: { hour, day, month }, suv: { hour, day, month }, bike: { hour, day, month } }` with status 200

#### Scenario: Database unavailable, server returns error

- GIVEN MongoDB is unreachable
- WHEN GET `/api/tariffs` is called
- THEN the server SHALL return `{ error: "Service unavailable" }` with status 503
- AND the frontend SHALL fall back to hardcoded tariff defaults in `appStore.fetchTariffs()`

#### Scenario: Response format matches appStore contract

- GIVEN a successful tariffs response
- THEN the JSON shape SHALL match the `PricingConfig` TypeScript interface:
  - `car.hour`, `car.day`, `car.month` (numbers)
  - `moto.hour`, `moto.day`, `moto.month`
  - `bike.hour`, `bike.day`, `bike.month`

### Requirement: GET /api/schedule

The schedule endpoint MUST return operating hours for weekdays and Sundays.

#### Scenario: Schedule returned from database

- GIVEN a schedule document exists in MongoDB
- WHEN GET `/api/schedule` is called
- THEN the server SHALL return `{ weekday: { open, close }, sunday: { open, close } }` with time strings in "HH:mm" format

#### Scenario: Response format matches appStore contract

- GIVEN a successful schedule response
- THEN the JSON shape SHALL match the `Schedule` TypeScript interface:
  - `weekday.open`, `weekday.close` (strings "HH:mm")
  - `sunday.open`, `sunday.close` (strings "HH:mm")

### Requirement: GET /api/parking/availability

The availability endpoint MUST return real-time spot statistics from MongoDB for cars, motorcycles, and bicycles.

#### Scenario: Availability stats returned

- GIVEN parking spots exist in MongoDB with mixed statuses
- WHEN GET `/api/parking/availability` is called
- THEN the server SHALL return:
  - `spots`: array of `{ id, zone, status }`
  - `stats`: `{ cars: { used, total }, motos: { used, total }, bikes: { used, total } }`
  - All stats SHALL reflect current database state

#### Scenario: Stats calculate correctly

- GIVEN 15 car spots total, 8 occupied
- WHEN availability is queried
- THEN `stats.cars.used` SHALL be `8`
- AND `stats.cars.total` SHALL be `15`

#### Scenario: Response format matches appStore contract

- GIVEN a successful availability response
- THEN the JSON shape SHALL match the `AvailabilityData` TypeScript interface:
  - `spots[]` with `id`, `zone` ('A'|'B'|'C'), `status` ('libre'|'ocupado')
  - `stats.cars`, `stats.motos`, `stats.bikes` each with `used` and `total`

### Requirement: Public Endpoint Rate Limiting

Public endpoints SHOULD be rate-limited to prevent abuse while remaining accessible for landing-page traffic.

#### Scenario: Normal traffic not limited

- GIVEN the landing page loads and calls all 3 endpoints
- WHEN fewer than 60 requests per minute per IP are made
- THEN all responses SHALL return 200

#### Scenario: Excessive requests limited

- GIVEN an IP exceeds 60 requests in 1 minute
- WHEN the 61st request is made
- THEN the server SHOULD return `{ error: "Too many requests" }` with status 429

### Acceptance Criteria

- [ ] `GET /api/tariffs` returns pricing from MongoDB, frontend falls back on error
- [ ] `GET /api/schedule` returns operating hours from MongoDB
- [ ] `GET /api/parking/availability` returns live spot stats from MongoDB
- [ ] All endpoints return JSON with `Content-Type: application/json`
- [ ] No authentication required for any public endpoint
- [ ] Frontend `appStore.fetch*` methods consume these endpoints via Axios

### Dependencies

- `backend-foundation` — Express app with route registration
- `backend-models` — Tariff, Schedule, ParkingSpot schemas
- `src/stores/appStore.ts` — `fetchTariffs`, `fetchSchedule`, `fetchAvailability` already implemented with fallbacks
- `src/types/index.ts` — `PricingConfig`, `Schedule`, `AvailabilityData` interfaces

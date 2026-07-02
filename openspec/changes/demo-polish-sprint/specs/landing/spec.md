# Delta for Landing Page

## MODIFIED Requirements

### Requirement: AvailabilitySection — Live Data

The AvailabilitySection gauge widgets MUST display real-time data from the backend API. Hardcoded `??` fallback defaults MUST be removed.

(Previously: Used hardcoded defaults: `stats?.cars.used ?? 8`, `stats?.cars.total ?? 20`, etc.)

#### Scenario: API returns availability data

- GIVEN the backend `/api/parking/stats` returns `{ cars: { used: 5, total: 20 }, motos: { used: 3, total: 20 }, bikes: { used: 1, total: 10 } }`
- WHEN the AvailabilitySection mounts
- THEN the car gauge shows "5/20", motorcycles "3/20", bicycles "1/10"

#### Scenario: API returns empty or errors

- GIVEN the API returns `null` or an error
- WHEN the AvailabilitySection mounts
- THEN all three gauges show "No data yet" (empty state)
- AND the component does NOT show stale hardcoded numbers (8/20, 7/20, 3/10)

#### Scenario: Data refreshes every 30 seconds

- GIVEN the component is mounted and initial data is loaded
- WHEN 30 seconds pass
- THEN availability data is re-fetched from the API

### Requirement: Empty-State Handling

When API data is unavailable, the landing page MUST show user-facing empty states instead of stale defaults or broken counters.

#### Scenario: Availability API fails

- GIVEN `/api/parking/stats` returns a 500 error
- WHEN the AvailabilitySection renders
- THEN each gauge displays "—" for the count and "No hay datos disponibles" for the label

#### Scenario: Visits today counter fails

- GIVEN the visits API endpoint returns an error
- WHEN the landing page renders
- THEN the "visitas hoy" badge shows "—" instead of a stale or incorrect number

## RENAMED Requirements

None.

## REMOVED Requirements

None.

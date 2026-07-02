# Delta for Reservations

## ADDED Requirements

### Requirement: Parking Spot Selection in Reservation Form

The reservation form MUST let users select a specific parking spot. Spot availability MUST be fetched in real-time for the selected date/time range, and spots MUST be filterable by vehicle type.

#### Scenario: User selects a spot from available spots grid

- GIVEN the user has chosen a vehicle, date, start time, and end time
- WHEN the spot selector loads
- THEN available spots for that time window are displayed in a grid
- AND each spot shows its type icon, floor number, and accessibility tags
- AND occupied or reserved spots are shown as disabled

#### Scenario: Spots are filtered by vehicle type

- GIVEN the user selected a motorcycle vehicle
- WHEN the spot selector loads
- THEN only motorcycle-compatible spots are shown
- AND car-only and bicycle-only spots are not displayed

#### Scenario: Selected spotId is sent with reservation

- GIVEN the user has selected a spot and all form fields are valid
- WHEN the form is submitted
- THEN `onSubmit` receives `spotId` in the payload
- AND the backend creates the reservation with that spot

#### Scenario: No spots available for time window

- GIVEN all spots are occupied for the selected range
- WHEN the spot selector loads
- THEN the form SHALL display "No hay espacios disponibles para este horario"

### Requirement: Spot Selector UI Component

The spot selector MUST render inside `ReservationForm` as a visual grid or list, appearing after the vehicle selection step.

#### Scenario: Spot selector renders grid layout

- GIVEN available spots are loaded
- WHEN the spot selector is rendered
- THEN spots appear in a responsive grid (2–4 columns depending on viewport)
- AND each spot card shows: spot number, type icon (Material Symbols), floor, status badge

## MODIFIED Requirements

None. Existing reservation flow (vehicle pick, date/time, notes, submit) is unchanged. The spot selector is additive.

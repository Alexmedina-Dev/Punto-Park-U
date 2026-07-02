# Delta for User Panel

## MODIFIED Requirements

### Requirement: Membership Badge — Live Stats

The membership badge on the dashboard MUST derive its visit count and progress bar from the user's actual reservation history (fetched from the API), not hardcoded values.

(Previously: Hardcoded "24 visitas · 6 para siguiente nivel" and a fixed 80% progress bar.)

#### Scenario: Progress bar reflects actual visit count

- GIVEN the user has 12 completed reservations
- WHEN the dashboard mounts
- THEN the membership badge shows "12 visitas"
- AND the progress bar width is `(12 / nextTierThreshold) * 100` percent
- AND the label shows visits remaining to next tier

#### Scenario: Zero-visit user sees starting state

- GIVEN the user has no completed reservations
- WHEN the dashboard mounts
- THEN the badge shows "0 visitas"
- AND the progress bar is at 0%
- AND the label says how many visits needed for the first tier

#### Scenario: Visits count includes both active and completed

- GIVEN the user has 8 completed and 2 active reservations
- WHEN the membership badge renders
- THEN the visit count reflects only completed reservations (8)

### Requirement: Dashboard Stats — Reservation-Based Counts

The dashboard stats cards MUST show real counts from the reservation history store, not placeholders.

#### Scenario: Visits stat card

- GIVEN `reservationStats.completed` returns 15
- WHEN the dashboard renders
- THEN the "Visitas" stat card displays "15"

#### Scenario: Spent stat card

- GIVEN `payments` store contains 3 completed payments totaling $25,000
- WHEN the dashboard renders
- THEN the "Gastado" stat card displays "$25.000"

#### Scenario: Loading states

- GIVEN reservation or payment data is still loading
- WHEN the dashboard renders
- THEN stats display "..." instead of zero or stale values

## RENAMED Requirements

None.

## REMOVED Requirements

None.

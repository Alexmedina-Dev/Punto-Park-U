# Demo Seed Data Specification

## Purpose

Generate realistic demo data so dashboards, charts, and landing stats render live numbers for the July 3rd presentation. The seeder MUST be idempotent and MUST stay under MongoDB Atlas M0's 512MB limit.

## Requirements

### Requirement: Demo Data Generation

The seeder MUST generate the following collections with realistic, date-spread records:

| Entity | Count | Statuses / Types |
|--------|-------|-----------------|
| Parking spots | 20–30 | types: car, motorcycle, disabled, electric; statuses: available, occupied, reserved, maintenance |
| Vehicles (demo user) | 5–10 | types: car, motorcycle |
| Reservations | 10–15 | active, completed, cancelled |
| Payments | 5–10 | linked to reservations |
| Activity logs | 30+ | spread across last 30 days |
| Alerts | 5–10 | info, warning variants |
| Notifications | 10–15 | email, push variants |
| Tickets | 5–10 | for QR entry/exit |

#### Scenario: First seed run creates all data

- GIVEN an empty demo database
- WHEN `node src/utils/seeder.js` is executed
- THEN all entities in the table above are created
- AND `createdAt` dates are spread across the last 30 days

#### Scenario: Idempotent re-run does not duplicate

- GIVEN seeded data already exists
- WHEN the seeder runs again
- THEN no duplicate records are created
- AND the seeder logs "skipping" for each existing entity

#### Scenario: Seed stays under M0 limit

- GIVEN the seeder has completed
- WHEN MongoDB's `db.stats()` is checked
- THEN total data size is under 400MB (leaving headroom under 512MB)

### Requirement: Seed Teardown

The seeder MUST support a `--down` flag to remove all demo-generated data.

#### Scenario: Tear down demo data

- GIVEN demo data exists
- WHEN `node src/utils/seeder.js --down` is executed
- THEN all demo-generated records are removed
- AND core entities (admin user, tariffs, schedule) are NOT removed

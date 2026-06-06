# Backend Models Specification

## Purpose

Define Mongoose schemas for the six core entities: User, Vehicle, Reservation, ParkingSpot, Tariff, and Schedule. Schemas SHALL include validation, timestamps, and proper indexing for query performance on MongoDB Atlas M0 (512MB).

## Requirements

### Requirement: User Schema

The User model MUST store authentication credentials and profile data with password hashing handled by a pre-save hook.

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| `name` | String | Yes | No | Full name |
| `email` | String | Yes | Yes | Lowercase, trimmed, validated |
| `cedula` | String | Yes | Yes | Colombian ID number |
| `password` | String | Yes | No | bcryptjs hashed, never returned in JSON |
| `role` | String | Yes | No | Enum: `user`, `admin`. Default: `user` |
| `phone` | String | No | No | Colombian phone format |

#### Scenario: Password is hashed before save

- GIVEN a new User with plain-text password
- WHEN `user.save()` is called
- THEN the `password` field SHALL be hashed via bcryptjs with salt rounds ≥ 10
- AND the plain-text password SHALL NOT be stored

#### Scenario: Email uniqueness enforced

- GIVEN an existing user with `email = "test@test.com"`
- WHEN another user with the same email is saved
- THEN MongoDB SHALL reject with a duplicate key error (code 11000)

### Requirement: Vehicle Schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `plate` | String | Yes | Vehicle license plate, uppercase |
| `type` | String | Yes | Enum: `car`, `moto`, `suv`, `bike` |
| `brand` | String | No | Manufacturer |
| `model` | String | No | Model name |
| `color` | String | No | Vehicle color |
| `owner` | ObjectId | Yes | Reference to User |

#### Scenario: Vehicle references owner

- GIVEN a vehicle document
- WHEN `.populate('owner')` is called
- THEN the `owner` field SHALL resolve to the full User document

### Requirement: ParkingSpot Schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `code` | String | Yes | e.g., "A1", "B12" |
| `zone` | String | Yes | Enum: `A`, `B`, `C` |
| `type` | String | Yes | Enum: `car`, `moto`, `bike` |
| `status` | String | Yes | Enum: `available`, `occupied`, `reserved`. Default: `available` |

#### Scenario: Availability query filters by status

- GIVEN 20 parking spots, 5 occupied
- WHEN querying `{ status: 'available' }`
- THEN the result SHALL return 15 documents

### Requirement: Reservation Schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `user` | ObjectId | Yes | Ref User |
| `vehicle` | ObjectId | Yes | Ref Vehicle |
| `spot` | ObjectId | Yes | Ref ParkingSpot |
| `entryTime` | Date | Yes | When parked |
| `exitTime` | Date | No | When exited (null = active) |
| `status` | String | Yes | Enum: `active`, `completed`, `cancelled` |

#### Scenario: Active reservation has no exitTime

- GIVEN a reservation with `status: 'active'`
- THEN `exitTime` SHALL be `null`

### Requirement: Tariff Schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vehicleType` | String | Yes | Enum: `car`, `moto`, `suv`, `bike` |
| `hourlyRate` | Number | Yes | Price per hour in COP |
| `dailyRate` | Number | Yes | Price per day in COP |
| `monthlyRate` | Number | Yes | Price per month in COP |

#### Scenario: Tariff query by vehicle type

- GIVEN tariffs exist for all 4 vehicle types
- WHEN querying `{ vehicleType: 'car' }`
- THEN a single tariff document SHALL be returned with hourly, daily, and monthly rates

### Requirement: Schedule Schema

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `weekdayOpen` | String | Yes | Format "HH:mm" (24h) |
| `weekdayClose` | String | Yes | Format "HH:mm" |
| `sundayOpen` | String | Yes | Format "HH:mm" |
| `sundayClose` | String | Yes | Format "HH:mm" |

#### Scenario: Single schedule document

- GIVEN the schedule collection
- WHEN querying for the schedule
- THEN exactly one document SHALL be returned (singleton pattern)

### Acceptance Criteria

- [ ] All 6 schemas include Mongoose `timestamps: true`
- [ ] Indexes defined on: `User.email`, `User.cedula`, `Vehicle.plate`, `ParkingSpot.code`, `Reservation.status`
- [ ] User password hashed via `pre('save')` hook, skipped if password unchanged
- [ ] `toJSON` transform removes `password` field from User serialization

### Dependencies

- `mongoose` package
- `bcryptjs` package (for User password hashing)
- Phase: backend-foundation (Express app must exist)

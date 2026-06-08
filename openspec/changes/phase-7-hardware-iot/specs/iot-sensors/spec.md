# iot-sensors Specification

## Purpose

Real-time parking spot occupancy via MQTT pub/sub. ESP32 ultrasonic sensors publish readings; Node.js mqttService.js subscribes, updates ParkingSpot in MongoDB, and emits WebSocket events to the admin panel.

## Requirements

### Requirement: MQTT Occupancy Publishing

ESP32 devices MUST publish to `parking/spots/{spotId}/occupancy` with payload `{spotId, occupied, distanceCm, timestamp}` at configurable interval (default 2s). Occupied threshold: ultrasonic distance < 50cm.

#### Scenario: Vehicle detected

- GIVEN ultrasonic sensor reads 23cm
- WHEN ESP32 publishes to `parking/spots/A1/occupancy`
- THEN payload contains `occupied: true, distanceCm: 23`

#### Scenario: Spot empty

- GIVEN ultrasonic sensor reads 180cm (no reflection within range)
- WHEN ESP32 publishes to `parking/spots/A2/occupancy`
- THEN payload contains `occupied: false, distanceCm: 180`

### Requirement: MQTT Backend Subscription

`mqttService.js` MUST subscribe to wildcard `parking/spots/+/occupancy` on startup. On message: extract spotId, update matching ParkingSpot by hardwareId, emit `spot:updated` via Socket.IO to admin namespace.

#### Scenario: Sensor updates spot in MongoDB

- GIVEN ParkingSpot A3 has `hardwareId: "A3"`, currently free
- WHEN MQTT message arrives with `occupied: true, spotId: "A3"`
- THEN ParkingSpot A3 flips to occupied, `occupancySource` set to `"sensor"`
- AND `spot:updated` Socket.IO event fires with updated spot document

#### Scenario: Unknown hardwareId received

- GIVEN MQTT message arrives for `spotId: "ZZ9"` with no matching ParkingSpot
- THEN system MUST log warning, skip update, not crash

#### Scenario: Sensor goes silent

- GIVEN spot A1's last MQTT message was > 30s ago
- WHEN health check runs
- THEN spot status shows `sensorStatus: "offline"`, occupancy unchanged

### Requirement: ParkingSpot Hardware Mapping

**Migration delta — modifies `reservations` domain.** ParkingSpot model MUST add optional fields:

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `hardwareId` | String, unique, sparse | `null` | Maps spot to MQTT topic suffix |
| `occupancySource` | Enum `["sensor","reservation","manual"]` | `"reservation"` | Tracks which system set occupied |
| `lastSensorReading` | Date | `null` | Last MQTT message timestamp |

#### Scenario: Dual-source spot with sensor priority

- GIVEN spot A1 has `hardwareId: "A1"`, `occupancySource: "sensor"`, `occupied: true`
- WHEN a reservation QR check-in sets occupied via reservation flow
- THEN `occupied` stays `true` but `occupancySource` remains `"sensor"` (sensor wins)

### Requirement: Hardware Simulator

`scripts/hardware-simulator.js` SHALL publish mock MQTT payloads for offline development. Accepts `--spots` CSV list and `--broker` URL. Randomly toggles occupancy per spot each publish cycle.

#### Scenario: Simulator produces valid payloads

- GIVEN simulator started with `--spots A1,A2 --broker mqtt://localhost:1883`
- WHEN it publishes for spot A1
- THEN payload exactly matches ESP32 specification format

#### Scenario: Simulator toggles occupancy

- GIVEN simulator runs 10 cycles for spot A1
- WHEN reviewing published messages
- THEN at least one shows `occupied: true` and at least one `occupied: false`

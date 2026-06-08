# Proposal: Phase 7 — Hardware Integration (IoT Sensors, Barriers, Cameras)

## Intent

Automate physical parking operations — spot occupancy, barrier control, license plate recognition — so the system reacts to real-world events without human QR scanning. QR remains the manual fallback; hardware adds automation.

## Scope

### In Scope
- ESP32 + ultrasonic sensors publishing occupancy via MQTT → MongoDB → WebSocket
- Barrier actuators (relay + ESP32) controlled via HTTP from backend after validation
- Python FastAPI camera microservice (OpenCV + EasyOCR + YOLOv8) for plate recognition
- Admin dashboard: sensor health matrix, manual barrier override, camera feed preview
- `hardware-simulator.js` for offline development and testing

### Out of Scope
- Production-grade hardware (educational/demo only)
- Paid camera licenses (open-source stack only)
- Surveillance DVR integration
- Industrial sensor arrays (one ESP32 sensor per spot)

## Capabilities

### New Capabilities
- `iot-sensors`: MQTT occupancy sensing — ESP32 publishes; Node.js subscribes and updates ParkingSpot
- `barrier-control`: HTTP barrier actuation — backend sends open/close to relay ESP32 after entry validation
- `camera-ocr`: Python FastAPI + OpenCV + EasyOCR + YOLOv8 license plate microservice (port 4001)

### Modified Capabilities
- `reservations`: ParkingSpot gains `hardwareId` field; spot status sourced from sensors in addition to QR
- `admin`: New hardware control panel (sensor matrix, barrier toggle, camera feed)
- `flux-ai`: Module 1 extended from demo plan to real camera capture pipeline
- `api`: New `/api/hardware/*` routes for sensor status, barrier commands, camera results

## Approach

**Hybrid architecture** matching protocol to device:

| Device | Protocol | Rationale |
|--------|----------|-----------|
| Occupancy sensors | MQTT | Real-time pub/sub, ESP32-native, low latency |
| Barriers | HTTP | Request-response is explicit and debuggable |
| Camera/LPR | Python FastAPI | Reuses Flux AI Module 1; Python OCR ecosystem |

Node.js subscribes to MQTT topics, calls barrier HTTP endpoints post-validation, forwards plates to Python. Socket.IO bridges all events to React. Simulator script enables offline dev.

## Affected Areas

| Area | Impact |
|------|--------|
| `backend/src/config/index.js` | Add MQTT broker, barrier URLs, camera endpoint |
| `backend/src/models/ParkingSpot.js` | Add `hardwareId` field |
| `backend/src/services/mqttService.js` | New — MQTT client |
| `backend/src/services/barrierService.js` | New — barrier HTTP client |
| `backend/src/routes/hardware.js` | New — `/api/hardware` routes |
| `backend/src/app.js` | Register hardware routes |
| `packages/shared-api/src/hardware.ts` | New — frontend hardware API client |
| `src/components/admin/HardwarePanel.tsx` | New — sensor matrix, barrier controls |
| `python-flux/vision_api.py` | New — FastAPI camera OCR |
| `scripts/hardware-simulator.js` | New — mock sensor payloads |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| WiFi dead zones in parking | Medium | Demo in classroom; ESP32 external antennas |
| Student MQTT learning curve | Medium | Start with HTTP polling lab; migrate to MQTT |
| No physical hardware available | Medium | Simulator script for dev; real devices for demo |
| Camera OCR accuracy (lighting/angle) | Low | YOLOv8 pre-filter; Colombian plate format well-supported |

## Rollback Plan

- Remove `/api/hardware` routes, revert `app.js`
- Revert `ParkingSpot` schema (remove `hardwareId`)
- Stop MQTT client and Python camera service
- QR-only flow continues functioning — hardware supplements, never replaces

## Dependencies

- Mosquitto broker (local Docker) or HiveMQ free tier
- Python 3.11+, OpenCV, EasyOCR, YOLOv8n, FastAPI
- 2× ESP32, 2× ultrasonic sensors, 2× relay modules
- Existing QR validation flow (Phase 5) for barrier gating

## Success Criteria

- [ ] Sensor publishes → MongoDB updates → frontend reflects spot status within 2s
- [ ] Barrier opens via HTTP after valid QR scan or plate match
- [ ] Camera → Python OCR → plate string → backend validates against DB
- [ ] Admin panel shows sensor online/offline with manual barrier override
- [ ] Simulator produces valid MQTT payloads for offline testing

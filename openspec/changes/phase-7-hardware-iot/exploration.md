## Exploration: Phase 7 — Hardware Integration (IoT Sensors, Barriers, Cameras)

### Current State
The system handles parking entry/exit entirely through **QR code validation** (HMAC-SHA256 signed) and **Socket.IO real-time updates**. The `ParkingSpot` model tracks `status: available | occupied | reserved`. The `qrController` updates spot status and emits `spot:update` events. The frontend `ParkingMap` and `WebSocketService` already consume these events. There is **no existing hardware integration code** in the React or Node.js codebase. The vanilla reference project (`Punto-Park-U-Web`) contains UI mockups for "Barreras Automáticas" and sensor icons, but zero functional hardware logic.

The project already runs a **monorepo** with workspace packages (`shared-api`, `shared-types`, `shared-stores`). The backend uses Express, MongoDB, and Socket.IO. The `plan-flux-ai.txt` already documents a **Python FastAPI + EasyOCR** microservice for license plate recognition (Flux AI Phase 2), but this microservice is not yet implemented in the actual repo.

### Affected Areas
- `backend/src/models/ParkingSpot.js` — needs `hardwareId` / `sensorId` fields to link physical sensors
- `backend/src/models/Reservation.js` — may need `detectedPlate` or `entryMethod` enum (`qr` | `camera` | `manual`)
- `backend/src/services/socketService.js` — sensor events will feed into existing `emitSpotUpdate`
- `backend/src/routes/qr.js` & `backend/src/controllers/qrController.js` — hardware can supplement or replace manual QR scanning
- `backend/src/app.js` — needs new routes for hardware gateway (e.g., `/api/hardware/*`)
- `backend/src/server.js` — may need to initialize MQTT client or serial listener alongside Socket.IO
- `backend/src/config/index.js` — needs MQTT broker URL, camera API endpoint, barrier controller URLs
- `packages/shared-api` — new hardware status and barrier control services
- `src/components/admin/ParkingMap.tsx` — display sensor health and offline status
- `apps/mobile/src/screens/QRScanScreen.tsx` — mobile QR scanner remains, but camera/LPR at entry may bypass it

### Approaches

1. **MQTT-Centric (Node.js backend as broker client)**
   - Sensors (ESP32/Arduino) publish to topics like `sensors/zone/A/spot/1`.
   - Node.js backend uses the `mqtt` npm package to subscribe, updates MongoDB, and emits `spot:update` via Socket.IO.
   - Barriers receive commands via `barriers/entry/open` topics.
   - Camera/LPR handled by the existing Python FastAPI plan (separate microservice on port 4001).
   - Pros: Industry standard, low latency, publish/subscribe decoupling, lightweight for ESP32, excellent for real-time dashboards.
   - Cons: Requires running a broker (Mosquitto local Docker or public HiveMQ/EMQX), new concept for SENA students, potential connectivity issues in underground parking.
   - Effort: **Medium**

2. **HTTP Polling (Node.js direct with Express endpoints)**
   - Microcontrollers with WiFi modules send `POST /api/hardware/occupancy` every few seconds.
   - Backend exposes `POST /api/hardware/barrier/entry` which the microcontroller polls, or calls `POST /hardware/barrier/open` on the actuator.
   - Camera/LPR still handled by Python FastAPI.
   - Pros: Easiest for students to understand (same REST patterns they already use), no extra broker infrastructure, debugging with browser/Postman.
   - Cons: Higher latency, more power consumption, not truly event-driven, scalability issues with many sensors, firewall/NAT issues if actuators are clients.
   - Effort: **Low**

3. **Python FastAPI Gateway (all hardware through Python)**
   - Python service handles serial ports, MQTT, or HTTP directly with microcontrollers.
   - Node.js backend talks to Python gateway via REST (as it already does with Flux AI vision module).
   - Pros: Great for camera/OCR (Python ecosystem), keeps Node.js backend focused on business logic, single hardware abstraction layer.
   - Cons: Another service to deploy and maintain, overkill for simple ultrasonic sensors, adds operational complexity for a SENA project.
   - Effort: **High**

### Recommendation
Adopt a **Hybrid Architecture** that matches the right protocol to the right device and the educational context:

- **Sensors (occupancy detection) → MQTT** (Approach 1). Use the `mqtt` package on the Node.js backend. For the SENA educational setting, use a **public HiveMQ broker** (free, no hosting) or a **local Mosquitto Docker container** for demos. This teaches students IoT pub/sub without cloud costs. The backend already uses Socket.IO, so bridging MQTT → WebSocket is trivial.
- **Barriers (entry/exit actuators) → HTTP** (supplementing Approach 1). The ESP32 with relay shield exposes a simple HTTP endpoint (`POST /open`). The Node.js backend calls it after QR validation or sensor entry. This avoids MQTT retained-message complexity for actuators and makes the request-response flow explicit and easy to debug.
- **Camera (license plate recognition) → Python FastAPI** (existing Flux AI plan). Reuse the already-documented Phase 2 vision module. The Node.js backend sends the image frame to the Python service and receives the plate string.

This hybrid gives the project **real industry relevance** (MQTT for sensors) while keeping the **learning curve manageable** (HTTP for barriers, existing Python plan for OCR).

### Risks
- **WiFi/Connectivity in parking structures**: Underground or concrete parking may have poor WiFi coverage. Mitigation: demo on-ground classrooms or use ESP32 with external antennas.
- **Power supply for IoT devices**: ESP32 + ultrasonic sensors + relays need stable 5V/3.3V power. USB power banks are fine for demos but not production.
- **SENA student learning curve**: MQTT is a new paradigm. Mitigation: start with HTTP polling for the first lab, then migrate to MQTT in the next iteration.
- **No tests**: The project has no testing framework. Adding hardware means manual end-to-end testing with real devices. Mitigation: create a `hardware-simulator.js` script that mocks sensor payloads.
- **Public MQTT broker limits**: Free brokers have rate limits. For a demo with <20 sensors, this is fine.
- **Camera OCR accuracy**: EasyOCR works for Colombian plates but lighting/angle matters. The plan-flux-ai already mitigates this with YOLOv8 as a fallback.

### Ready for Proposal
**Yes.** The codebase is well-structured enough to add hardware routes and services. The WebSocket plumbing is already in place. The orchestrator should tell the user that Phase 7 is the final phase and will integrate with the existing QR flow rather than replacing it entirely — QR remains the fallback/manual method while hardware automates the detection.

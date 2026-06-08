# Tasks: Phase 7 — Hardware Integration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~950 total (~280 PR1, ~210 PR2, ~460 PR3) |
| 400-line budget risk | High (PR3 exceeds budget) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (iot-sensors) → PR 2 (barrier-control) → PR 3 (camera-ocr + admin-panel) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Est. Lines | Notes |
|------|------|-----------|------------|-------|
| 1 | MQTT sensors + simulator | PR 1 | ~280 | Base: main; includes schema migration |
| 2 | Barrier HTTP control | PR 2 | ~210 | Base: main; depends on PR 1 hardware router |
| 3 | Camera OCR + admin panel | PR 3 | ~460 | Base: main; depends on PR 1 & 2; size exception likely needed |

## PR 1: MQTT + Sensors (iot-sensors)

- [ ] 7.1.1 Migrate `backend/src/models/ParkingSpot.js`: add `hardwareId` (sparse unique), `occupancySource`, `lastSensorReading`, `sensorStatus`
- [ ] 7.1.2 Update `backend/src/config/index.js`: add `mqttBrokerUrl`, MQTT client options
- [ ] 7.1.3 Create `backend/src/services/mqttService.js`: MQTT client (mqtt.js), subscribe `parking/spots/+/occupancy`, parse JSON payload, update ParkingSpot, emit WebSocket `spot:update` and `sensor:status`
- [ ] 7.1.4 Create `backend/src/controllers/hardwareController.js`: implement `getSensors`
- [ ] 7.1.5 Create `backend/src/routes/hardware.js`: add `GET /sensors` (leave barrier/camera stubs for later PRs)
- [ ] 7.1.6 Update `backend/src/app.js`: register `app.use('/api/hardware', hardwareRoutes)`
- [ ] 7.1.7 Update `backend/src/services/socketService.js`: add `emitSensorStatus()`, enhance `emitSpotUpdate()` for MQTT origin
- [ ] 7.1.8 Create `scripts/hardware-simulator.js`: mock ESP32 MQTT publisher with CLI args `--spots`, `--broker`, random occupancy toggle
- [ ] 7.1.9 Write tests: mqttService message parsing, sensor controller, simulator CLI output

## PR 2: Barrier Control (barrier-control)

- [ ] 7.2.1 Create `backend/src/services/barrierService.js`: HTTP client (axios) for ESP32 relay, `open()` (POST `/relay/on`), `close()` (POST `/relay/off`), health check, auto-close timer (30s), cancel by passage sensor
- [ ] 7.2.2 Update `backend/src/controllers/hardwareController.js`: add `getBarriers`, `openBarrier`, `closeBarrier`, `overrideBarrier`
- [ ] 7.2.3 Update `backend/src/routes/hardware.js`: add `GET /barriers`, `POST /barriers/:id/{open,close,override}` with `requireAuth` + `requireRole(['admin','system'])`
- [ ] 7.2.4 Update `backend/src/services/socketService.js`: add `emitBarrierStatus()`
- [ ] 7.2.5 Update `backend/src/config/index.js`: add `barrierEndpoints`, `autoCloseMs`
- [ ] 7.2.6 Write tests: barrierService timer logic, HTTP timeout handling, WebSocket barrier status emit

## PR 3: Camera OCR + Admin Panel (camera-ocr)

- [ ] 7.3.1 Create `python-flux/vision_api.py`: FastAPI app, `POST /capture` (camera index or multipart), OpenCV frame capture, YOLOv8n plate detection, EasyOCR extraction, Colombian plate normalization (`^[A-Z]{3}-[0-9]{2,3}$`)
- [ ] 7.3.2 Create `python-flux/requirements.txt`: `fastapi`, `uvicorn`, `opencv-python`, `easyocr`, `ultralytics`
- [ ] 7.3.3 Update `backend/src/config/index.js`: add `cameraServiceUrl`, `ocrConfidenceThreshold` (0.60)
- [ ] 7.3.4 Create `backend/src/services/cameraService.js`: proxy to Python service, `capture()`, validate confidence, `lookupReservationByPlate()`, trigger `barrierService.open()` on match
- [ ] 7.3.5 Update `backend/src/controllers/hardwareController.js` + `backend/src/routes/hardware.js`: add `POST /camera/capture` with rate limiting
- [ ] 7.3.6 Update `backend/src/services/socketService.js`: add `emitCameraResult()`
- [ ] 7.3.7 Create `packages/shared-types/src/hardware.types.ts`: `HardwareSpot`, `BarrierState`, `CameraCaptureResult`, `SensorStatus`
- [ ] 7.3.8 Create `packages/shared-api/src/hardware.service.ts`: `getSensors`, `getBarriers`, `openBarrier`, `closeBarrier`, `overrideBarrier`, `captureCamera`
- [ ] 7.3.9 Update `packages/shared-stores/src/adminStore.ts`: add `hardwareSpots`, `barriers`, `cameraLastCapture`, `simulatorEnabled`, fetch actions
- [ ] 7.3.10 Create `src/components/admin/HardwarePanel.tsx` (tab container), `SensorMatrix.tsx` (occupancy + status dots), `BarrierControls.tsx` (status + override), `CameraPreview.tsx` (thumbnail + OCR + capture button), `SimulatorToggle.tsx` (Zustand switch)
- [ ] 7.3.11 Update `src/pages/AdminDashboard.tsx`: add `hardware` tab, import `HardwarePanel`
- [ ] 7.3.12 Write tests: Python OCR normalization (parameterized), cameraService integration, E2E simulator → SensorMatrix UI update

# Design: Phase 7 — Hardware Integration (IoT Sensors, Barriers, Cameras)

## Technical Approach

Hybrid protocol architecture: MQTT for sensor pub/sub, HTTP for barrier request-response, Python FastAPI for camera OCR. Node.js backend acts as the integration hub — subscribing to MQTT, calling barrier HTTP endpoints, and proxying to the Python microservice. Socket.IO pushes all events to React. A `hardware-simulator.js` script enables offline development by publishing mock MQTT payloads.

## Architecture Decisions

| Decision | Options | Tradeoffs | Rationale |
|----------|---------|-----------|-----------|
| MQTT for sensors | MQTT vs HTTP polling | MQTT: real-time, ESP32-native, low latency; Polling: simpler, higher latency | Sensors need sub-second updates; ESP32 has robust MQTT client libraries |
| HTTP for barriers | HTTP vs MQTT | HTTP: explicit request-response, easy to debug with curl; MQTT: fire-and-forget, harder to confirm actuation | Barrier actuation must be acknowledged; HTTP 200/500 is unambiguous |
| Python microservice for OCR | Python FastAPI vs Node.js canvas | Python: OpenCV/EasyOLO/YOLOv8 ecosystem; Node: same runtime, harder CV stack | Python dominates computer vision; isolates heavy CPU work from Node event loop |
| mqtt.js over aedes | mqtt.js (client) vs aedes (broker-in-app) | mqtt.js: connects to external Mosquitto/HiveMQ; aedes: embeds broker, simpler local dev | External broker mirrors production; aedes adds process load. Use Mosquitto Docker locally. |
| Sparse hardwareId index | Sparse vs non-sparse | Sparse: most spots won't have hardware; non-sparse: simpler queries | Only demo spots get hardware; sparse keeps index small |
| Single `/api/hardware` router | Combined vs split per device | Combined: one auth boundary, one file; Split: clearer separation | 5 endpoints total; combined is simpler and matches existing route grouping |

## Data Flow

### Sensor MQTT → MongoDB → WebSocket → React

```
ESP32 ──MQTT──→ Mosquitto ──MQTT──→ Node.js mqttService
                                    │
                                    ▼
                              ParkingSpot.updateOne()
                                    │
                                    ▼
                              socketService.emitSpotUpdate()
                                    │
                                    ▼
                              Socket.IO server
                                    │
                                    ▼
                              React SensorMatrix
```

### Barrier Open Flow (QR or Plate)

```
User/Admin ──HTTP──→ /api/hardware/barriers/:id/open
                         │
                         ▼
                   requireAuth + requireRole
                         │
                         ▼
                   barrierService.open(id)
                         │
                         ▼
                   POST http://{esp32-ip}/relay/on
                         │
                         ▼
                   ESP32 relay module (5s pulse)
                         │
                         ▼
                   Response 200 + start auto-close timer
                         │
                         ▼
                   socketService.emitBarrierStatus()
```

### Camera OCR → Plate Validation → Barrier

```
Camera/Admin ──HTTP──→ Node.js /api/hardware/camera/capture
                           │
                           ▼
                     POST http://localhost:4001/capture
                           │
                           ▼
                     Python FastAPI vision_api.py
                     OpenCV → YOLOv8n → EasyOCR → normalize
                           │
                           ▼
                     {plate, confidence, bbox}
                           │
                           ▼
                     Node.js validates confidence ≥ 0.60
                           │
                           ▼
                     Query active reservation by plate
                           │
                           ├─ Match ──→ barrierService.open()
                           └─ No match ─→ log + fallback QR
```

## File Changes

### Backend

| File | Action | Description |
|------|--------|-------------|
| `backend/src/config/index.js` | Modify | Add `mqttBrokerUrl`, `barrierEndpoints`, `cameraServiceUrl`, `ocrConfidenceThreshold` |
| `backend/src/models/ParkingSpot.js` | Modify | Add `hardwareId`, `occupancySource`, `lastSensorReading`, `sensorStatus` |
| `backend/src/services/mqttService.js` | Create | MQTT client (mqtt.js): connect, subscribe `parking/spots/+/occupancy`, parse, update DB, emit WS |
| `backend/src/services/barrierService.js` | Create | HTTP client for ESP32 relay modules: open(), close(), health check, auto-close timer management |
| `backend/src/services/cameraService.js` | Create | Proxy to Python FastAPI: capture(), validateConfidence(), lookupReservationByPlate() |
| `backend/src/routes/hardware.js` | Create | Express router: barriers CRUD, sensors list, camera capture, override |
| `backend/src/controllers/hardwareController.js` | Create | Route handlers for hardware endpoints |
| `backend/src/app.js` | Modify | Register `app.use('/api/hardware', hardwareRoutes)` |
| `backend/src/services/socketService.js` | Modify | Add `emitBarrierStatus()`, `emitCameraResult()`, `emitSensorStatus()` |
| `scripts/hardware-simulator.js` | Create | Mock MQTT publisher: cli args `--spots`, `--broker`, random occupancy toggle |

### Frontend

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/HardwarePanel.tsx` | Create | Tab container: SensorMatrix, BarrierControls, CameraPreview, SimulatorToggle |
| `src/components/admin/SensorMatrix.tsx` | Create | Grid of spots with occupancy dot + sensor online/offline indicator |
| `src/components/admin/BarrierControls.tsx` | Create | Toggle buttons per barrier: status, last action, manual override |
| `src/components/admin/CameraPreview.tsx` | Create | Last capture thumbnail + OCR result overlay + "Capture Now" button |
| `src/components/admin/SimulatorToggle.tsx` | Create | Switch to enable/disable simulator mode, persists in Zustand |
| `src/pages/AdminDashboard.tsx` | Modify | Add `hardware` tab, import HardwarePanel |
| `packages/shared-api/src/hardware.service.ts` | Create | API wrappers: getSensors, getBarriers, openBarrier, closeBarrier, overrideBarrier, captureCamera |
| `packages/shared-stores/src/adminStore.ts` | Modify | Add `hardwareSpots`, `barriers`, `cameraLastCapture`, `simulatorEnabled`, fetch actions |
| `packages/shared-types/src/hardware.types.ts` | Create | Types: `HardwareSpot`, `BarrierState`, `CameraCaptureResult`, `SensorStatus` |

### Python Microservice

| File | Action | Description |
|------|--------|-------------|
| `python-flux/vision_api.py` | Create | FastAPI app: POST `/capture` (multipart or camera index), YOLOv8n plate detection, EasyOCR extraction, Colombian format normalization |
| `python-flux/requirements.txt` | Create | `fastapi`, `uvicorn`, `opencv-python`, `easyocr`, `ultralytics` |

## Interfaces / Contracts

### MQTT Payload

```json
{
  "spotId": "A1",
  "occupied": true,
  "distanceCm": 23,
  "timestamp": "2026-06-07T14:32:01.000Z"
}
```

### Barrier ESP32 HTTP API

```
POST /relay/on   → {status: "ok", relay: 1, durationMs: 5000}
POST /relay/off  → {status: "ok", relay: 1}
GET  /status     → {relay: 1, state: "off", uptimeSec: 1240}
```

### Python FastAPI `/capture` Response

```json
{
  "plate": "ABC-123",
  "confidence": 0.94,
  "bbox": [120, 340, 210, 80],
  "processingMs": 350,
  "source": "camera"
}
```

### Node.js API Routes

```javascript
// backend/src/routes/hardware.js
router.get('/sensors', requireAuth, requireAdmin, hardwareController.getSensors);
router.get('/barriers', requireAuth, requireAdmin, hardwareController.getBarriers);
router.post('/barriers/:id/open', requireAuth, requireRole(['admin', 'system']), hardwareController.openBarrier);
router.post('/barriers/:id/close', requireAuth, requireRole(['admin', 'system']), hardwareController.closeBarrier);
router.post('/barriers/:id/override', requireAuth, requireAdmin, hardwareController.overrideBarrier);
router.post('/camera/capture', requireAuth, requireAdmin, hardwareController.captureCamera);
```

### ParkingSpot Schema Delta

```javascript
// Additions to backend/src/models/ParkingSpot.js
hardwareId: { type: String, unique: true, sparse: true, default: null },
occupancySource: { type: String, enum: ['sensor', 'reservation', 'manual'], default: 'reservation' },
lastSensorReading: { type: Date, default: null },
sensorStatus: { type: String, enum: ['online', 'offline', 'unknown'], default: 'unknown' },
```

## WebSocket Events

| Event | Direction | Payload | Purpose |
|-------|-----------|---------|---------|
| `spot:update` | Server → Client | `WsSpotUpdate` | Existing — now also triggered by MQTT sensor message |
| `barrier:status` | Server → Client | `{barrierId, status, lastAction, lastActionAt}` | Barrier open/close/override notifications |
| `sensor:status` | Server → Client | `{spotId, sensorStatus, lastSensorReading}` | Sensor online/offline heartbeat |
| `camera:result` | Server → Client | `{plate, confidence, imageUrl, timestamp}` | New OCR result available |
| `hardware:simulator` | Client → Server | `{enabled: boolean}` | Admin toggles simulator mode |

## Frontend Components

### HardwarePanel Component Tree

```
HardwarePanel
├── SimulatorToggle
│   └── Switch + warning badge
├── SensorMatrix
│   └── Grid of SensorCell
│       ├── Spot ID
│       ├── OccupancyDot (green/red)
│       └── SensorStatusDot (green/orange/red)
├── BarrierControls
│   └── List of BarrierRow
│       ├── Barrier ID + StatusBadge
│       ├── LastAction timestamp
│       ├── OpenButton → /api/hardware/barriers/{id}/override
│       └── CloseButton → /api/hardware/barriers/{id}/override
└── CameraPreview
    ├── Image thumbnail (or placeholder)
    ├── OCR overlay text
    └── CaptureNowButton → /api/hardware/camera/capture
```

### Zustand Store Extensions

```typescript
// Additions to packages/shared-stores/src/adminStore.ts
interface AdminState {
  // ... existing fields ...
  hardwareSpots: HardwareSpot[]
  barriers: BarrierState[]
  cameraLastCapture: CameraCaptureResult | null
  simulatorEnabled: boolean

  fetchHardwareSpots: () => Promise<void>
  fetchBarriers: () => Promise<void>
  toggleBarrier: (id: string, action: 'open' | 'close') => Promise<void>
  captureCamera: () => Promise<void>
  setSimulatorEnabled: (enabled: boolean) => void
}
```

## MQTT Client Design

### Connection & Topics

```javascript
// backend/src/services/mqttService.js
const mqtt = require('mqtt');

const client = mqtt.connect(config.mqttBrokerUrl, {
  clientId: `punto-park-u-${Date.now()}`,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 5000,
});

client.on('connect', () => {
  client.subscribe('parking/spots/+/occupancy', { qos: 1 });
});

client.on('message', async (topic, payload) => {
  const spotId = topic.split('/')[2];
  const data = JSON.parse(payload.toString());
  // update ParkingSpot, emit WebSocket
});
```

### QoS Levels

| Topic Pattern | QoS | Rationale |
|---------------|-----|-----------|
| `parking/spots/+/occupancy` | 1 | At-least-once delivery; duplicates are idempotent (MongoDB update) |
| `parking/barriers/+/ack` | 1 | Barrier actuation acks must not be lost |
| `parking/system/health` | 0 | Health beacons; occasional loss acceptable |

### Reconnection Logic

- `reconnectPeriod: 5000` with exponential backoff capped at 30s
- On disconnect: set all linked spots `sensorStatus: "offline"` after 30s grace
- On reconnect: re-subscribe all wildcard topics, emit `sensor:status` recovery events

## Barrier Communication

### HTTP Client Design

```javascript
// backend/src/services/barrierService.js
const axios = require('axios');

const BARRIER_TIMEOUT = 5000;
const AUTO_CLOSE_MS = 30000;

const openBarrier = async (barrierId) => {
  const endpoint = config.barrierEndpoints[barrierId];
  const res = await axios.post(`${endpoint}/relay/on`, {}, { timeout: BARRIER_TIMEOUT });
  // start auto-close timer
  const timer = setTimeout(() => closeBarrier(barrierId), AUTO_CLOSE_MS);
  activeTimers.set(barrierId, timer);
  return res.data;
};
```

### Timeout Handling

- Barrier HTTP call timeout: 5s
- On timeout: log error, emit `barrier:status` with `status: "error"`, do NOT retry (manual intervention required)
- Auto-close timer: 30s, cancellable by passage sensor MQTT message

## Camera Pipeline

### Python FastAPI Service (`python-flux/vision_api.py`)

```python
from fastapi import FastAPI, File, UploadFile
from ultralytics import YOLO
import easyocr
import cv2

app = FastAPI()
model = YOLO("yolov8n.pt")  # plate detection fine-tuned or generic
reader = easyocr.Reader(['es', 'en'])

@app.post("/capture")
async def capture(source: str = "camera", camera_index: int = 0, file: UploadFile = None):
    img = await load_image(source, camera_index, file)
    results = model(img)
    plates = []
    for r in results:
        for box in r.boxes:
            plate_img = crop(img, box.xyxy)
            ocr = reader.readtext(plate_img)
            text = normalize_colombian_plate(ocr[0][1])
            plates.append({"plate": text, "confidence": ocr[0][2], "bbox": box.xyxy.tolist()})
    if not plates:
        return {"plate": None, "confidence": 0, "error": "No plate detected"}
    best = max(plates, key=lambda p: p["confidence"])
    return {"plate": best["plate"], "confidence": best["confidence"], "bbox": best["bbox"], "processingMs": ...}
```

### Normalization Logic

1. Strip whitespace and convert to uppercase
2. Remove all non-alphanumeric characters
3. If length >= 5 and no hyphen, insert hyphen after 3rd character
4. Validate pattern: `^[A-Z]{3}-[0-9]{2,3}$`

## Database Changes

### ParkingSpot Migration

```javascript
// One-time migration script (or Mongoose defaults)
await ParkingSpot.updateMany(
  { hardwareId: { $exists: false } },
  { $set: { occupancySource: 'reservation', sensorStatus: 'unknown' } }
);
```

### New Collections (optional)

- `BarrierLog` — manual overrides, auto-close events, errors (for audit trail)
- `CameraCapture` — stored captures with plate, confidence, timestamp (optional, for review)

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | mqttService message parsing, barrierService timer logic, cameraService confidence validation | Jest mocks for mqtt.js, axios, setTimeout |
| Unit | Python OCR normalization | pytest with parameterized plate strings |
| Integration | MQTT publish → MongoDB update → WebSocket emit | MQTT broker in Docker, MongoDB memory server, Socket.IO client |
| Integration | Barrier HTTP mock → auto-close timer | Nock or local HTTP mock server |
| Integration | Python `/capture` with sample images | Post image to FastAPI, assert plate + confidence |
| E2E | Simulator → SensorMatrix UI update | Run simulator, verify React grid color change within 5s |

## Migration / Rollout

1. **Schema migration**: Run ParkingSpot field additions (backward-compatible — all new fields optional)
2. **Deploy Python service**: Start FastAPI on port 4001 independently
3. **Start Mosquitto**: `docker run -p 1883:1883 eclipse-mosquitto`
4. **Deploy Node.js changes**: Restart backend — MQTT client connects automatically
5. **Verify simulator**: Run `node scripts/hardware-simulator.js --spots A1,A2`
6. **Physical devices**: Flash ESP32s with production firmware, update config endpoints

**Rollback**: Remove `/api/hardware` routes, stop MQTT client and Python service, revert ParkingSpot schema defaults. QR-only flow continues untouched.

## Security

### MQTT Authentication

- Production: username/password or TLS client certificates in `config.mqttBrokerUrl`
- Local dev: anonymous access acceptable inside Docker network
- Topic ACL: ESP32s may only **publish** to `parking/spots/{id}/occupancy`; backend may **publish** to `parking/barriers/+/cmd` and **subscribe** to `+/ack`

### Barrier Endpoint Protection

- All barrier routes require `requireAuth` + `requireRole(['admin','system'])`
- `override` restricted to `requireAdmin` only
- Barrier ESP32 endpoints should sit on isolated VLAN or use IP allowlisting (documented in deployment guide, not code)

### Camera API Rate Limiting

- `express-rate-limit` on `/api/hardware/camera/*` — 10 requests per minute per IP
- Python service internal only (localhost:4001), no external exposure
- Admin capture button debounced (3s cooldown) in React

## Open Questions

- [ ] Do we need a `Barrier` Mongoose model, or is configuration in `config.barrierEndpoints` sufficient?
- [ ] Should camera captures be stored to disk or S3, or kept in memory only?
- [ ] What is the exact Colombian plate regex for the new 3-letter + 3-digit format vs old 3-letter + 2-digit?

## Next Recommended Phase

Ready for **sdd-tasks** to break this design into implementation tasks.

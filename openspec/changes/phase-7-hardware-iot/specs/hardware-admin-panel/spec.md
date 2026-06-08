# hardware-admin-panel Specification

## Purpose

React admin panel components for hardware monitoring and manual control. Provides real-time sensor matrix grid, barrier toggle controls, camera feed preview, and simulator enable/disable. All wired via Zustand store and Socket.IO `spot:updated` events.

**Migration delta — modifies `admin` domain.** These components extend the existing admin dashboard panel.

## ADDED Requirements

### Requirement: SensorMatrix Component

The SensorMatrix MUST render a grid of all ParkingSpots with `hardwareId` set. Each cell SHALL display: spot ID, occupancy (green dot = free, red dot = occupied), and sensor status (online within 10s, offline after 30s, unknown in between). It MUST subscribe to `spot:updated` Socket.IO events.

#### Scenario: Live occupancy grid

- GIVEN 5 spots have hardwareId: A1 occupied, A2-A5 free, all online
- WHEN admin opens HardwarePanel
- THEN SensorMatrix shows A1 cell red/"Occupied", A2-A5 green/"Free", all with green online indicator

#### Scenario: Sensor goes offline

- GIVEN spot A1's last MQTT message was 35s ago, previously occupied
- WHEN admin views SensorMatrix
- THEN A1 cell shows orange "Unknown" status with red offline dot

### Requirement: BarrierControls Component

BarrierControls MUST render toggle buttons for each configured barrier. Each row SHALL show: barrier ID, current status (open/closed with visual indicator), last action timestamp, and manual open/close action buttons. Manual actions MUST call `/api/hardware/barriers/{id}/override`.

#### Scenario: Admin toggles barrier

- GIVEN barrier "exit-1" shows status "closed" on BarrierControls
- WHEN admin clicks "Open" button for exit-1
- THEN POST override fires, button transitions to loading state
- AND on success, status updates to "open" with new timestamp

#### Scenario: Override fails gracefully

- GIVEN barrier "entry-1" ESP32 is unreachable
- WHEN admin clicks manual override
- THEN error toast appears, barrier status unchanged, retry allowed

### Requirement: CameraPreview Component

CameraPreview SHALL display the last captured license plate image or a "no capture" placeholder. It MUST show last OCR result (plate text + confidence percentage). It SHOULD include a "Capture Now" button that triggers the full camera → OCR → validation pipeline and refreshes the preview.

#### Scenario: Last capture displayed

- GIVEN camera last captured plate "ABC-123" at 94% confidence
- WHEN admin opens CameraPreview
- THEN image thumbnail rendered with overlay text "ABC-123 · 94%"

#### Scenario: No capture available

- GIVEN no camera capture has been performed
- WHEN admin opens CameraPreview
- THEN placeholder shown: "No capture yet — click Capture Now"

### Requirement: SimulatorToggle Component

SimulatorToggle MUST provide a switch to enable or disable mock sensor data mode. When ON, the backend SHALL use simulator MQTT client instead of live broker. State MUST persist in admin Zustand store and survive panel navigation. Toggle SHALL display a visible warning indicator when simulator mode is active.

#### Scenario: Enable simulator

- GIVEN simulator toggle is OFF, SensorMatrix shows real (possibly empty) data
- WHEN admin flips SimulatorToggle ON
- THEN backend switches to simulator MQTT client, SensorMatrix populates with mock spots
- AND toggle shows "⚠ Simulator: ON" in warning color

#### Scenario: Disable simulator

- GIVEN simulator toggle is ON
- WHEN admin flips SimulatorToggle OFF
- THEN backend reconnects to live MQTT broker, simulator data cleared
- AND toggle shows "Simulator: OFF" in neutral state

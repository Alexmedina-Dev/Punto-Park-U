# camera-ocr Specification

## Purpose

Python FastAPI microservice (port 4001) for license plate recognition. Accepts images, runs YOLOv8n plate detection + EasyOCR text extraction, returns plate string with confidence. Node.js backend calls this service and validates plates against active reservations.

## Requirements

### Requirement: Plate Capture Endpoint

POST `/capture` MUST accept multipart image upload or camera index (`{source: "file"|"camera", cameraIndex?: number}`). The service SHALL run YOLOv8n to detect plate regions, then EasyOCR on each detection. Returns plate string, confidence score, bounding box, and processing time.

#### Scenario: Image yields valid plate

- GIVEN image contains Colombian plate "ABC-123"
- WHEN POST `/capture` receives the image as multipart
- THEN response returns `{plate: "ABC-123", confidence: 0.94, bbox: [120,340,210,80], processingMs: 350}`

#### Scenario: No plate detected

- GIVEN image has no visible license plate
- WHEN POST `/capture` processes it
- THEN response returns `{plate: null, confidence: 0, bbox: null, error: "No plate detected"}` with HTTP 200

### Requirement: Plate Format Normalization

The service MUST normalize detected plates to Colombian format: three uppercase letters, hyphen, two or three digits. It SHALL strip whitespace, convert to uppercase, and remove non-alphanumeric characters.

#### Scenario: OCR noise cleaned

- GIVEN EasyOCR reads "A BC- 12 3" from plate region
- WHEN normalization applies
- THEN returned plate is "ABC-123"

#### Scenario: Old-format plate preserved

- GIVEN EasyOCR reads "ABC12" (old Colombian format, no hyphen)
- WHEN normalization applies
- THEN returned string is "ABC-12" (inserts hyphen after 3rd letter)

### Requirement: Confidence Threshold

The backend SHOULD reject OCR results with confidence below configurable threshold (default 0.60). Set via `OCR_CONFIDENCE_THRESHOLD` environment variable. Below-threshold results SHALL trigger manual plate entry flow.

#### Scenario: Low confidence rejected

- GIVEN camera returns plate "DEF-456" with confidence 0.45
- WHEN backend evaluates against threshold 0.60
- THEN plate treated as unrecognized, manual entry prompt appears

#### Scenario: High confidence accepted

- GIVEN camera returns plate "GHI-789" with confidence 0.92
- WHEN backend evaluates
- THEN plate accepted, reservation lookup proceeds

### Requirement: Node.js Reservation Validation

**Migration delta — modifies `flux-ai` domain (Module 1).** Node.js MUST call `POST http://localhost:4001/capture` when vehicle approaches entry. On valid plate, it SHALL query active reservations. On match, it MUST trigger barrier open. On mismatch, it SHALL log and fall back to QR scan.

#### Scenario: Plate matches active reservation

- GIVEN reservation exists for plate "ABC-123" in current time window
- WHEN camera OCR returns `{plate: "ABC-123", confidence: 0.94}`
- THEN backend calls barrier open for entry barrier via barrierService

#### Scenario: Plate has no reservation

- GIVEN no active reservation for plate "XYZ-789"
- WHEN camera OCR returns `{plate: "XYZ-789", confidence: 0.88}`
- THEN backend returns entry denied, logs event, does NOT open barrier

#### Scenario: Python service unavailable

- GIVEN FastAPI microservice is down or unreachable
- WHEN Node.js calls `/capture` and gets connection refused
- THEN backend falls back to QR-only flow, logs camera outage

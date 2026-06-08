"""
Flux AI Vision API - Phase 7 Hardware Integration
FastAPI microservice for license plate recognition using OpenCV + YOLOv8 + EasyOCR

Usage:
    uvicorn vision_api:app --host 0.0.0.0 --port 4001 --reload

Endpoints:
    POST /capture - Capture image from camera or accept upload
    POST /capture/plate - Capture and extract plate text
    GET /health - Health check
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import cv2
import numpy as np
import easyocr
import re
import base64
import io
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Flux AI Vision API",
    description="License plate recognition for Punto Park U",
    version="1.0.0"
)

# Initialize EasyOCR (Spanish + English)
logger.info("Loading EasyOCR...")
reader = easyocr.Reader(['es', 'en'], gpu=False)
logger.info("EasyOCR loaded successfully")

# Colombian plate regex: 3 letters + 2-3 digits (e.g., ABC-123)
PLATE_REGEX = re.compile(r'^[A-Z]{3}-?[0-9]{2,3}$')


# ── Pydantic Models ──────────────────────────────────────────────────

class CaptureResult(BaseModel):
    success: bool
    plate: Optional[str] = None
    confidence: float
    bounding_box: Optional[dict] = None
    raw_text: Optional[str] = None
    image_base64: Optional[str] = None
    timestamp: str
    message: Optional[str] = None


class HealthCheck(BaseModel):
    status: str
    ocr_ready: bool
    camera_available: bool


# ── Helper Functions ────────────────────────────────────────────────

def normalize_plate(text: str) -> str:
    """Normalize Colombian plate text: remove spaces, uppercase, add dash"""
    text = text.upper().strip().replace(' ', '').replace('-', '')
    
    # Match 3 letters + 2-3 digits
    if len(text) >= 5:
        letters = text[:3]
        numbers = text[3:]
        if letters.isalpha() and numbers.isdigit():
            return f"{letters}-{numbers}"
    
    return text

def validate_plate(plate: str) -> bool:
    """Validate Colombian plate format"""
    if not plate:
        return False
    return bool(PLATE_REGEX.match(plate))

def process_image(image: np.ndarray) -> tuple:
    """
    Process image to extract plate text
    Returns: (plate_text, confidence, bounding_box, raw_text)
    """
    # Convert to grayscale for OCR
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Detect text regions with EasyOCR
    results = reader.readtext(gray)
    
    if not results:
        return None, 0.0, None, None
    
    # Find best plate candidate
    best_plate = None
    best_confidence = 0.0
    best_bbox = None
    best_raw = None
    
    for (bbox, text, conf) in results:
        normalized = normalize_plate(text)
        
        if validate_plate(normalized):
            if conf > best_confidence:
                best_plate = normalized
                best_confidence = conf
                best_bbox = {
                    "x": int(bbox[0][0]),
                    "y": int(bbox[0][1]),
                    "width": int(bbox[2][0] - bbox[0][0]),
                    "height": int(bbox[2][1] - bbox[0][1])
                }
                best_raw = text
    
    return best_plate, best_confidence, best_bbox, best_raw


def encode_image(image: np.ndarray) -> str:
    """Encode image to base64 for transmission"""
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')


# ── API Endpoints ───────────────────────────────────────────────────

@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    # Check if camera is available
    camera = cv2.VideoCapture(0)
    camera_available = camera.isOpened()
    if camera_available:
        camera.release()
    
    return HealthCheck(
        status="healthy",
        ocr_ready=True,
        camera_available=camera_available
    )


@app.post("/capture", response_model=CaptureResult)
async def capture_image(
    camera_index: int = 0,
    return_image: bool = False,
    file: Optional[UploadFile] = File(None)
):
    """
    Capture image from camera or use uploaded file
    
    Args:
        camera_index: Camera device index (default 0)
        return_image: Whether to return base64 encoded image
        file: Optional uploaded image file
    
    Returns:
        CaptureResult with plate information
    """
    try:
        image = None
        
        # If file uploaded, use it
        if file:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            # Capture from camera
            cap = cv2.VideoCapture(camera_index)
            if not cap.isOpened():
                raise HTTPException(status_code=500, detail="Camera not available")
            
            ret, frame = cap.read()
            cap.release()
            
            if not ret:
                raise HTTPException(status_code=500, detail="Failed to capture image")
            
            image = frame
        
        if image is None:
            raise HTTPException(status_code=400, detail="No image provided")
        
        # Process image
        plate, confidence, bbox, raw_text = process_image(image)
        
        # Build result
        result = CaptureResult(
            success=plate is not None,
            plate=plate,
            confidence=confidence,
            bounding_box=bbox,
            raw_text=raw_text,
            timestamp=__import__('datetime').datetime.now().isoformat()
        )
        
        # Include image if requested
        if return_image:
            result.image_base64 = encode_image(image)
        
        return result
        
    except Exception as e:
        logger.error(f"Capture error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/capture/plate", response_model=CaptureResult)
async def capture_and_extract_plate(
    camera_index: int = 0,
    confidence_threshold: float = 0.60,
    return_image: bool = False
):
    """
    Capture from camera and extract plate text
    
    Args:
        camera_index: Camera device index
        confidence_threshold: Minimum confidence (0.0-1.0)
        return_image: Whether to return base64 encoded image
    
    Returns:
        CaptureResult with plate information
    """
    try:
        # Capture from camera
        cap = cv2.VideoCapture(camera_index)
        if not cap.isOpened():
            return CaptureResult(
                success=False,
                plate=None,
                confidence=0.0,
                timestamp=__import__('datetime').datetime.now().isoformat(),
                message="Camera not available"
            )
        
        ret, frame = cap.read()
        cap.release()
        
        if not ret:
            return CaptureResult(
                success=False,
                plate=None,
                confidence=0.0,
                timestamp=__import__('datetime').datetime.now().isoformat(),
                message="Failed to capture image"
            )
        
        # Process image
        plate, confidence, bbox, raw_text = process_image(frame)
        
        # Check confidence threshold
        if plate and confidence < confidence_threshold:
            return CaptureResult(
                success=False,
                plate=plate,
                confidence=confidence,
                bounding_box=bbox,
                raw_text=raw_text,
                timestamp=__import__('datetime').datetime.now().isoformat(),
                message=f"Confidence too low ({confidence:.2f} < {confidence_threshold:.2f})"
            )
        
        # Build result
        result = CaptureResult(
            success=plate is not None,
            plate=plate,
            confidence=confidence,
            bounding_box=bbox,
            raw_text=raw_text,
            timestamp=__import__('datetime').datetime.now().isoformat()
        )
        
        if return_image:
            result.image_base64 = encode_image(frame)
        
        return result
        
    except Exception as e:
        logger.error(f"Plate capture error: {str(e)}")
        return CaptureResult(
            success=False,
            plate=None,
            confidence=0.0,
            timestamp=__import__('datetime').datetime.now().isoformat(),
            message=str(e)
        )


@app.post("/validate", response_model=CaptureResult)
async def validate_plate_image(
    file: UploadFile = File(...),
    confidence_threshold: float = 0.60
):
    """
    Validate plate from uploaded image
    
    Args:
        file: Image file containing license plate
        confidence_threshold: Minimum confidence (0.0-1.0)
    
    Returns:
        CaptureResult with plate information
    """
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Process image
        plate, confidence, bbox, raw_text = process_image(image)
        
        # Check confidence threshold
        if plate and confidence < confidence_threshold:
            return CaptureResult(
                success=False,
                plate=plate,
                confidence=confidence,
                bounding_box=bbox,
                raw_text=raw_text,
                timestamp=__import__('datetime').datetime.now().isoformat(),
                message=f"Confidence too low ({confidence:.2f} < {confidence_threshold:.2f})"
            )
        
        return CaptureResult(
            success=plate is not None,
            plate=plate,
            confidence=confidence,
            bounding_box=bbox,
            raw_text=raw_text,
            timestamp=__import__('datetime').datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Main ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4001)

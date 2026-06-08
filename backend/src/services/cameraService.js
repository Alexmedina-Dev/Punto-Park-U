const axios = require('axios');
const config = require('../config');

/**
 * Camera Service — Phase 7 Hardware Integration
 * Node.js client for Python FastAPI vision service
 */

const VISION_API_URL = config.cameraServiceUrl || 'http://localhost:4001';
const CONFIDENCE_THRESHOLD = config.ocrConfidenceThreshold || 0.60;
const TIMEOUT_MS = 10000;

/**
 * Capture image from camera and extract plate
 * @param {number} cameraIndex - Camera device index (default 0)
 * @param {boolean} returnImage - Whether to return base64 image
 * @returns {Promise<Object>} Capture result
 */
async function capturePlate(cameraIndex = 0, returnImage = false) {
  try {
    const response = await axios.post(
      `${VISION_API_URL}/capture/plate`,
      null,
      {
        params: {
          camera_index: cameraIndex,
          confidence_threshold: CONFIDENCE_THRESHOLD,
          return_image: returnImage,
        },
        timeout: TIMEOUT_MS,
      }
    );

    return response.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.error('[camera] Python vision service not available at', VISION_API_URL);
      return {
        success: false,
        plate: null,
        confidence: 0,
        message: 'Camera service not available. Is Python FastAPI running?',
        timestamp: new Date().toISOString(),
      };
    }
    console.error('[camera] Capture error:', err.message);
    return {
      success: false,
      plate: null,
      confidence: 0,
      message: err.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Validate plate from uploaded image
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Validation result
 */
async function validatePlateImage(imageBuffer, filename = 'upload.jpg') {
  try {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', imageBuffer, { filename });

    const response = await axios.post(
      `${VISION_API_URL}/validate`,
      form,
      {
        headers: form.getHeaders(),
        params: {
          confidence_threshold: CONFIDENCE_THRESHOLD,
        },
        timeout: TIMEOUT_MS,
      }
    );

    return response.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return {
        success: false,
        plate: null,
        confidence: 0,
        message: 'Camera service not available.',
      };
    }
    console.error('[camera] Validation error:', err.message);
    return {
      success: false,
      plate: null,
      confidence: 0,
      message: err.message,
    };
  }
}

/**
 * Check if camera service is healthy
 * @returns {Promise<Object>} Health status
 */
async function checkCameraHealth() {
  try {
    const response = await axios.get(`${VISION_API_URL}/health`, {
      timeout: 5000,
    });
    return response.data;
  } catch (err) {
    return {
      status: 'unhealthy',
      ocr_ready: false,
      camera_available: false,
      error: err.message,
    };
  }
}

/**
 * Lookup reservation by plate number
 * @param {string} plate - License plate
 * @returns {Promise<Object|null>} Reservation or null
 */
async function lookupReservationByPlate(plate) {
  const Reservation = require('../models/Reservation');
  const Vehicle = require('../models/Vehicle');

  // Find vehicle by plate
  const vehicle = await Vehicle.findOne({
    plate: { $regex: new RegExp(`^${plate}$`, 'i') },
  });

  if (!vehicle) {
    return null;
  }

  // Find active reservation for this vehicle
  const reservation = await Reservation.findOne({
    vehicle: vehicle._id,
    status: { $in: ['pending', 'active'] },
  }).populate('vehicle spot', 'plate code zone');

  return reservation;
}

/**
 * Process entry with camera
 * @param {string} barrierId - Barrier ID
 * @returns {Promise<Object>} Entry result
 */
async function processCameraEntry(barrierId) {
  try {
    // Capture plate
    const capture = await capturePlate(0, false);

    if (!capture.success || !capture.plate) {
      return {
        success: false,
        message: capture.message || 'No plate detected',
        capture,
      };
    }

    // Lookup reservation
    const reservation = await lookupReservationByPlate(capture.plate);

    if (!reservation) {
      return {
        success: false,
        message: `No reservation found for plate ${capture.plate}`,
        capture,
      };
    }

    // Success - return reservation and capture data
    return {
      success: true,
      plate: capture.plate,
      confidence: capture.confidence,
      reservation,
      capture,
    };
  } catch (err) {
    console.error('[camera] Process entry error:', err.message);
    return {
      success: false,
      message: err.message,
    };
  }
}

module.exports = {
  capturePlate,
  validatePlateImage,
  checkCameraHealth,
  lookupReservationByPlate,
  processCameraEntry,
  CONFIDENCE_THRESHOLD,
  VISION_API_URL,
};

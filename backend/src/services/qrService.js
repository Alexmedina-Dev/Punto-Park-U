const crypto = require('crypto');
const QRCode = require('qrcode');
const config = require('../config');

// ── HMAC helpers ──────────────────────────────────────────────────────

/**
 * Generate an HMAC-SHA256 signature for the given payload.
 * @param {Object} payload - The data to sign
 * @returns {string} Hex-encoded HMAC signature
 */
const generateSignature = (payload) => {
  const data = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', config.qrSecret)
    .update(data)
    .digest('hex');
};

/**
 * Verify an HMAC-SHA256 signature against a payload.
 * @param {Object} payload - The original data
 * @param {string} signature - The HMAC signature to verify
 * @returns {boolean} True if signature is valid
 */
const verifySignature = (payload, signature) => {
  const expected = generateSignature(payload);
  // Use timing-safe comparison
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

// ── QR code generation ───────────────────────────────────────────────

/**
 * Build the QR payload for a reservation.
 * @param {Object} reservation - Populated reservation document
 * @returns {Object} { reservationId, plate, timestamp, hmac }
 */
const buildQRPayload = (reservation) => {
  const vehiclePlate =
    (reservation.vehicle && reservation.vehicle.plate) || 'N/A';

  const payload = {
    reservationId: reservation._id.toString(),
    plate: vehiclePlate,
    timestamp: new Date().toISOString(),
  };

  // Sign with HMAC
  const hmac = generateSignature(payload);

  return {
    ...payload,
    hmac,
  };
};

/**
 * Generate a QR code data URL (base64 PNG) for a reservation.
 * @param {Object} reservation - Populated reservation document
 * @returns {Promise<string>} Base64 data URL of the QR code
 */
const generateQRCode = async (reservation) => {
  const payload = buildQRPayload(reservation);

  // Encode the full payload as JSON string inside the QR
  const qrContent = JSON.stringify(payload);

  const dataUrl = await QRCode.toDataURL(qrContent, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
  });

  return dataUrl;
};

/**
 * Decode and validate a QR code content string.
 * @param {string} qrContent - The JSON string read from a QR code
 * @returns {Object} { valid: boolean, payload: Object|null, error: string|null }
 */
const validateQRContent = (qrContent) => {
  try {
    const payload = JSON.parse(qrContent);

    // Required fields
    if (!payload.reservationId || !payload.plate || !payload.timestamp || !payload.hmac) {
      return { valid: false, payload: null, error: 'Invalid QR code: missing required fields' };
    }

    // Verify HMAC signature
    const { hmac, ...dataToVerify } = payload;
    const isValid = verifySignature(dataToVerify, hmac);

    if (!isValid) {
      return { valid: false, payload: null, error: 'Invalid QR code: signature mismatch' };
    }

    // Check timestamp freshness (±5 minutes tolerance)
    const qrTime = new Date(payload.timestamp).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (Math.abs(now - qrTime) > fiveMinutes) {
      // QR is stale — still return payload but mark as warning
      return {
        valid: true,
        payload,
        error: 'QR code timestamp is outside the 5-minute tolerance window',
        stale: true,
      };
    }

    return { valid: true, payload, error: null };
  } catch (err) {
    return { valid: false, payload: null, error: `Invalid QR format: ${err.message}` };
  }
};

/**
 * Calculate billing amount for a parking session.
 * @param {Date} entryTime - When the vehicle entered
 * @param {Date} exitTime - When the vehicle exits
 * @param {number} hourlyRate - Tariff hourly rate in COP
 * @returns {number} Billing amount rounded to nearest COP
 */
const calculateBilling = (entryTime, exitTime, hourlyRate) => {
  const durationMs = exitTime.getTime() - entryTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // Minimum charge: 1 hour
  const billableHours = Math.max(1, Math.ceil(durationHours));
  return Math.round(billableHours * hourlyRate);
};

module.exports = {
  generateSignature,
  verifySignature,
  buildQRPayload,
  generateQRCode,
  validateQRContent,
  calculateBilling,
};

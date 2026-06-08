const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// All QR routes require authentication
router.use(requireAuth);

// POST /api/qr/generate — Generate QR code for a reservation
router.post('/generate', qrController.generateQR);

// POST /api/qr/validate — Validate QR code at entry
router.post('/validate', qrController.validateEntry);

// POST /api/qr/exit — Process exit with QR code
router.post('/exit', qrController.processExit);

// GET /api/qr/ticket/:reservationId — Get stored QR code for display
router.get('/ticket/:reservationId', qrController.getQRCode);

module.exports = router;

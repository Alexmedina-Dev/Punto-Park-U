const express = require('express');
const router = express.Router();
const hardwareController = require('../controllers/hardwareController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// All hardware routes require authentication
router.use(requireAuth);

// GET /api/hardware/sensors — List all sensors (admin/operator)
router.get('/sensors', hardwareController.getSensors);

// GET /api/hardware/sensors/:id — Get sensor details (admin/operator)
router.get('/sensors/:id', hardwareController.getSensorById);

// GET /api/hardware/status — Hardware system status (admin only)
router.get('/status', requireAdmin, hardwareController.getHardwareStatus);

// ── Barrier routes ───────────────────────────────────────────────────

// GET /api/hardware/barriers — List all barriers (admin/operator)
router.get('/barriers', hardwareController.getBarriers);

// POST /api/hardware/barriers/:id/open — Open barrier (admin/operator)
router.post('/barriers/:id/open', hardwareController.openBarrier);

// POST /api/hardware/barriers/:id/close — Close barrier (admin/operator)
router.post('/barriers/:id/close', hardwareController.closeBarrier);

// POST /api/hardware/barriers/:id/override — Admin override (admin only)
router.post('/barriers/:id/override', requireAdmin, hardwareController.overrideBarrier);

// ── Camera routes ───────────────────────────────────────────────────

// POST /api/hardware/camera/capture — Capture and recognize plate
router.post('/camera/capture', hardwareController.captureCamera);

// POST /api/hardware/camera/entry — Process camera entry with plate
router.post('/camera/entry', hardwareController.processCameraEntry);

// GET /api/hardware/camera/health — Camera service health
router.get('/camera/health', hardwareController.getCameraHealth);

module.exports = router;

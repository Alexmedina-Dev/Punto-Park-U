const express = require('express');
const router = express.Router();
const anomalyController = require('../controllers/anomalyController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// All anomaly routes require authentication + admin role
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/anomalies/stats — Anomaly statistics
router.get('/stats', anomalyController.getAnomalyStats);

// GET /api/anomalies/recent — Recent unresolved anomalies
router.get('/recent', anomalyController.getRecentAnomalies);

// POST /api/anomalies/run — Trigger manual anomaly detection
router.post('/run', anomalyController.runDetection);

// PUT /api/anomalies/:id/resolve — Resolve anomaly
router.put('/:id/resolve', anomalyController.resolveAnomaly);

module.exports = router;

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const alertController = require('../controllers/alertController');
const adminController = require('../controllers/adminController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// All admin routes require authentication + admin role
router.use(requireAuth);
router.use(requireAdmin);

// ── Activity Log ──────────────────────────────────────────────────────

// GET /api/admin/activity/stats — must come before /:id
router.get('/activity/stats', activityController.getActivityStats);

// GET /api/admin/activity — List activity log
router.get('/activity', activityController.getActivities);

// ── Alerts ────────────────────────────────────────────────────────────

// GET /api/admin/alerts/stats — must come before /:id
router.get('/alerts/stats', alertController.getAlertStats);

// GET /api/admin/alerts — List alerts
router.get('/alerts', alertController.getAlerts);

// POST /api/admin/alerts — Create alert
router.post('/alerts', alertController.createAlert);

// GET /api/admin/alerts/:id — Get alert details
router.get('/alerts/:id', alertController.getAlert);

// PUT /api/admin/alerts/:id/resolve — Resolve alert
router.put('/alerts/:id/resolve', alertController.resolveAlert);

// DELETE /api/admin/alerts/:id — Delete alert
router.delete('/alerts/:id', alertController.deleteAlert);

// ── Dashboard Stats ────────────────────────────────────────────────────

// GET /api/admin/stats — Dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// ── Reports ────────────────────────────────────────────────────────────

// GET /api/admin/reports/:type — Report data (financial, occupancy, users)
router.get('/reports/:type', adminController.getReportData);

// GET /api/admin/entries — All parking entries
router.get('/entries', adminController.getAllEntries);

// GET /api/admin/occupancy — Hourly occupancy data
router.get('/occupancy', adminController.getOccupancy);

// GET /api/admin/parked-vehicles — Currently parked vehicles
router.get('/parked-vehicles', adminController.getParkedVehicles);

// ── Analytics (Flux AI Real) ───────────────────────────────────────────

// GET /api/admin/analytics/peak-hours — Peak hours prediction
router.get('/analytics/peak-hours', adminController.getPeakHours);

// GET /api/admin/analytics/occupancy-forecast — Next 24h occupancy forecast
router.get('/analytics/occupancy-forecast', adminController.getOccupancyForecast);

// GET /api/admin/analytics/revenue-trends — Revenue trends (7d, 30d, 90d)
router.get('/analytics/revenue-trends', adminController.getRevenueTrends);

// GET /api/admin/analytics/vehicle-insights — Vehicle type insights
router.get('/analytics/vehicle-insights', adminController.getVehicleInsights);

// GET /api/admin/analytics/occupancy-prediction — Prophet AI prediction
router.get('/analytics/occupancy-prediction', adminController.getOccupancyPrediction);

// GET /api/admin/analytics/ai-insights — Prophet AI insights & recommendations
router.get('/analytics/ai-insights', adminController.getAIInsights);

// ── Tariffs ────────────────────────────────────────────────────────────

// PUT /api/admin/tariffs — Update parking tariffs
router.put('/tariffs', adminController.updateTariffs);

// ── Schedule ───────────────────────────────────────────────────────────

// PUT /api/admin/schedule — Update parking schedule
router.put('/schedule', adminController.updateSchedule);

module.exports = router;

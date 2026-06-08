const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// Public route — current pricing (no auth needed)
router.get('/current', pricingController.getCurrentPricing);

// Protected routes
router.use(requireAuth);

// Forecast (admin + operator)
router.get('/forecast', pricingController.getPricingForecast);

// Stats (admin + operator)
router.get('/stats', pricingController.getPricingStats);

// Smart assignment (admin + operator)
router.get('/assignment/:reservationId', pricingController.getOptimalAssignment);

// Settings update (admin only)
router.put('/settings', requireAdmin, pricingController.updateSettings);

module.exports = router;

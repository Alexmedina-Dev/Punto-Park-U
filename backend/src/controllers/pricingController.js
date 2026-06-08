const pricingEngine = require('../services/pricingEngine');

// ── GET /api/pricing/current ─────────────────────────────────────────
const getCurrentPricing = async (req, res, next) => {
  try {
    const vehicleType = req.query.vehicleType || 'car';
    const data = await pricingEngine.getCurrentPricing(vehicleType);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Tarifa no encontrada' });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/pricing/forecast ──────────────────────────────────────────
const getPricingForecast = async (req, res, next) => {
  try {
    const vehicleType = req.query.vehicleType || 'car';
    const data = await pricingEngine.getPricingForecast(vehicleType);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/pricing/stats ─────────────────────────────────────────────
const getPricingStats = async (req, res, next) => {
  try {
    const data = await pricingEngine.getPricingStats();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/pricing/assignment/:reservationId ───────────────────────
const getOptimalAssignment = async (req, res, next) => {
  try {
    const data = await pricingEngine.getOptimalSpotAssignment(req.params.reservationId);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Reserva o spots no encontrados' });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/pricing/settings ────────────────────────────────────────
const updateSettings = async (req, res, next) => {
  try {
    const { enabled, rules } = req.body;
    const data = await pricingEngine.updateDynamicPricingSettings(enabled, rules);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCurrentPricing,
  getPricingForecast,
  getPricingStats,
  getOptimalAssignment,
  updateSettings,
};

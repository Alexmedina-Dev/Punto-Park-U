const anomalyService = require('../services/anomalyService');

// ── GET /api/anomalies/stats ───────────────────────────────────────────
const getAnomalyStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = await anomalyService.getAnomalyStats(days);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/anomalies/recent ──────────────────────────────────────────
const getRecentAnomalies = async (req, res, next) => {
  try {
    const Alert = require('../models/Alert');
    const limit = parseInt(req.query.limit) || 20;
    const data = await Alert.find({ resolved: false })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/anomalies/run ───────────────────────────────────────────
const runDetection = async (req, res, next) => {
  try {
    const anomalies = await anomalyService.runAnomalyDetection();
    res.json({
      success: true,
      data: {
        count: anomalies.length,
        anomalies: anomalies.map(a => ({
          type: a.type,
          severity: a.severity,
          message: a.message,
          score: a.score
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/anomalies/:id/resolve ─────────────────────────────────────
const resolveAnomaly = async (req, res, next) => {
  try {
    const Alert = require('../models/Alert');
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    }
    res.json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnomalyStats,
  getRecentAnomalies,
  runDetection,
  resolveAnomaly,
};

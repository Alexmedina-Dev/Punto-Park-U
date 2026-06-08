const Alert = require('../models/Alert');
const ActivityLog = require('../models/ActivityLog');
const { emitNewAlert } = require('../services/socketService');

// ── Helpers ──────────────────────────────────────────────────────────

const formatAlertResponse = (alert) => ({
  id: alert._id,
  type: alert.type,
  message: alert.message,
  severity: alert.severity,
  zone: alert.zone,
  timestamp: alert.timestamp,
  resolved: alert.resolved,
  createdAt: alert.createdAt,
  updatedAt: alert.updatedAt,
});

const logActivity = async (userId, action, type, details = {}) => {
  try {
    await ActivityLog.create({ user: userId, action, type, details });
  } catch (err) {
    console.error('[activity] Failed to log activity:', err.message);
  }
};

/**
 * Build a filter object from query params for alert listing.
 */
const buildAlertFilter = (query) => {
  const filter = {};

  if (query.type && ['system', 'occupancy', 'hardware', 'security'].includes(query.type)) {
    filter.type = query.type;
  }

  if (query.severity && ['info', 'warning', 'critical'].includes(query.severity)) {
    filter.severity = query.severity;
  }

  if (query.resolved !== undefined) {
    filter.resolved = query.resolved === 'true';
  }

  if (query.zone) {
    filter.zone = { $regex: query.zone, $options: 'i' };
  }

  if (query.dateFrom || query.dateTo) {
    filter.timestamp = {};
    if (query.dateFrom) filter.timestamp.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.timestamp.$lte = new Date(query.dateTo);
  }

  return filter;
};

// ── GET /api/admin/alerts ─────────────────────────────────────────────
const getAlerts = async (req, res, next) => {
  try {
    const filter = buildAlertFilter(req.query);

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      Alert.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: alerts.map(formatAlertResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/alerts/:id ─────────────────────────────────────────
const getAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.status(200).json({ success: true, data: formatAlertResponse(alert) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/admin/alerts ────────────────────────────────────────────
const createAlert = async (req, res, next) => {
  try {
    const { type, message, severity, zone } = req.body;

    const alert = await Alert.create({
      type,
      message,
      severity,
      zone: zone || '',
    });

    // Log activity
    logActivity(req.user.id, `Alert created: ${alert.type}`, 'user', {
      alertId: alert._id,
      severity: alert.severity,
    });

    // Emit real-time event
    emitNewAlert(formatAlertResponse(alert));

    res.status(201).json({ success: true, data: formatAlertResponse(alert) });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/admin/alerts/:id/resolve ──────────────────────────────────
const resolveAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndUpdate(
      id,
      { resolved: true },
      { new: true, runValidators: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Log activity
    logActivity(req.user.id, 'Alert resolved', 'user', {
      alertId: alert._id,
      type: alert.type,
    });

    res.status(200).json({ success: true, data: formatAlertResponse(alert) });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/admin/alerts/:id ──────────────────────────────────────
const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const alert = await Alert.findByIdAndDelete(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Log activity
    logActivity(req.user.id, 'Alert deleted', 'user', {
      alertId: id,
      type: alert.type,
    });

    res.status(200).json({ success: true, message: 'Alert deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/alerts/stats ────────────────────────────────────────
const getAlertStats = async (req, res, next) => {
  try {
    const [byType, bySeverity, unresolved] = await Promise.all([
      Alert.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Alert.countDocuments({ resolved: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byType,
        bySeverity,
        unresolved,
        total: byType.reduce((acc, t) => acc + t.count, 0),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAlerts,
  getAlert,
  createAlert,
  resolveAlert,
  deleteAlert,
  getAlertStats,
};

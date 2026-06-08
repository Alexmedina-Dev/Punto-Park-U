const ActivityLog = require('../models/ActivityLog');

// ── Helpers ──────────────────────────────────────────────────────────

const formatActivityResponse = (activity) => ({
  id: activity._id,
  action: activity.action,
  userId: activity.user,
  type: activity.type,
  details: activity.details,
  timestamp: activity.timestamp,
  createdAt: activity.createdAt,
});

// ── GET /api/admin/activity ───────────────────────────────────────────
const getActivities = async (req, res, next) => {
  try {
    const filter = {};

    // Filter by type
    if (req.query.type && ['vehicle', 'reservation', 'payment', 'tariff', 'schedule', 'user'].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    // Filter by user
    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    // Filter by action
    if (req.query.action) {
      filter.action = { $regex: req.query.action, $options: 'i' };
    }

    // Filter by date range
    if (req.query.dateFrom || req.query.dateTo) {
      filter.timestamp = {};
      if (req.query.dateFrom) filter.timestamp.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.timestamp.$lte = new Date(req.query.dateTo);
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email'),
      ActivityLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: activities.map(formatActivityResponse),
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

// ── GET /api/admin/activity/stats ─────────────────────────────────────
const getActivityStats = async (req, res, next) => {
  try {
    const [typeStats, actionStats] = await Promise.all([
      // Count by type
      ActivityLog.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Recent unique actions (last 24h)
      ActivityLog.aggregate([
        { $match: { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        byType: typeStats,
        recentActions: actionStats,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActivities,
  getActivityStats,
};

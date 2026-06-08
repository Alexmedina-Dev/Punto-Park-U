const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const ActivityLog = require('../models/ActivityLog');

// ── Helpers ──────────────────────────────────────────────────────────

const formatPaymentResponse = (payment) => ({
  id: payment._id,
  userId: payment.user,
  vehicleId: payment.vehicle,
  reservationId: payment.reservation,
  amount: payment.amount,
  method: payment.method,
  status: payment.status,
  date: payment.date,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const logActivity = async (userId, action, type, details = {}) => {
  try {
    await ActivityLog.create({ user: userId, action, type, details });
  } catch (err) {
    console.error('[activity] Failed to log activity:', err.message);
  }
};

/**
 * Build a filter object from query params for payment listing.
 */
const buildPaymentFilter = (query, userId, role) => {
  const filter = {};

  // Non-admin/non-operator users see only their own payments
  if (role !== 'admin' && role !== 'operator') {
    filter.user = userId;
  } else if (query.userId) {
    filter.user = query.userId;
  }

  // Filter by status
  if (query.status && ['pending', 'completed', 'failed'].includes(query.status)) {
    filter.status = query.status;
  }

  // Filter by method
  if (query.method && ['cash', 'pos', 'epayco'].includes(query.method)) {
    filter.method = query.method;
  }

  // Filter by date range
  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.date.$lte = new Date(query.dateTo);
  }

  // Filter by reservation
  if (query.reservationId) {
    filter.reservation = query.reservationId;
  }

  return filter;
};

// ── GET /api/payments ─────────────────────────────────────────────────
const getPayments = async (req, res, next) => {
  try {
    const filter = buildPaymentFilter(req.query, req.user.id, req.user.role);

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('vehicle', 'plate type')
        .populate('reservation', 'status'),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: payments.map(formatPaymentResponse),
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

// ── GET /api/payments/:id ─────────────────────────────────────────────
const getPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate('user', 'name email')
      .populate('vehicle', 'plate type brand model')
      .populate('reservation', 'status date');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Non-admin/non-operator users can only view their own payments
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      if (payment.user._id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own payments' });
      }
    }

    res.status(200).json({ success: true, data: formatPaymentResponse(payment) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments ────────────────────────────────────────────────
const createPayment = async (req, res, next) => {
  try {
    const { vehicle, reservation, amount, method } = req.body;

    const payment = await Payment.create({
      user: req.user.id,
      vehicle,
      reservation: reservation || null,
      amount,
      method,
      status: 'pending',
    });

    const populated = await Payment.findById(payment._id)
      .populate('user', 'name email')
      .populate('vehicle', 'plate type')
      .populate('reservation', 'status');

    // Link payment to reservation if provided
    if (reservation) {
      await Reservation.findByIdAndUpdate(reservation, {
        payment: payment._id,
        status: 'active',
      });
    }

    // Log activity
    logActivity(req.user.id, 'Payment created', 'payment', {
      paymentId: payment._id,
      amount: payment.amount,
      method: payment.method,
    });

    res.status(201).json({ success: true, data: formatPaymentResponse(populated) });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/payments/:id ─────────────────────────────────────────────
const updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Only admin can update payments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update payments' });
    }

    // Allowed fields for update
    const allowedFields = ['amount', 'method', 'status'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await Payment.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('user', 'name email')
      .populate('vehicle', 'plate type')
      .populate('reservation', 'status');

    if (!updated) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Log activity
    logActivity(req.user.id, 'Payment updated', 'payment', {
      paymentId: updated._id,
      changes: updates,
    });

    res.status(200).json({ success: true, data: formatPaymentResponse(updated) });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/payments/:id ──────────────────────────────────────────
const deletePayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Only admin can delete payments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete payments' });
    }

    await Payment.findByIdAndDelete(id);

    // Log activity
    logActivity(req.user.id, 'Payment deleted', 'payment', {
      paymentId: id,
      amount: payment.amount,
    });

    res.status(200).json({ success: true, message: 'Payment deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/payments/my ───────────────────────────────────────────────
const getMyPayments = async (req, res, next) => {
  try {
    const filter = { user: req.user.id };

    // Filter by status
    if (req.query.status && ['pending', 'completed', 'failed'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    // Filter by date range
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) filter.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.date.$lte = new Date(req.query.dateTo);
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('vehicle', 'plate type')
        .populate('reservation', 'status'),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: payments.map(formatPaymentResponse),
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

// ── GET /api/payments/stats ────────────────────────────────────────────
const getPaymentStats = async (req, res, next) => {
  try {
    const filter = {};

    // Non-admin/non-operator see only their own stats
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      filter.user = req.user.id;
    }

    // Optional date range filter
    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) filter.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.date.$lte = new Date(req.query.dateTo);
    }

    const [statusStats, methodStats, totalAgg] = await Promise.all([
      // Count by status
      Payment.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      // Count by method
      Payment.aggregate([
        { $match: filter },
        { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      // Overall totals
      Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' },
            minAmount: { $min: '$amount' },
          },
        },
      ]),
    ]);

    const statusBreakdown = {
      pending: { count: 0, total: 0 },
      completed: { count: 0, total: 0 },
      failed: { count: 0, total: 0 },
    };
    statusStats.forEach(({ _id, count, total }) => {
      if (statusBreakdown[_id]) {
        statusBreakdown[_id] = { count, total };
      }
    });

    const methodBreakdown = {};
    methodStats.forEach(({ _id, count, total }) => {
      methodBreakdown[_id] = { count, total };
    });

    const totals = totalAgg[0] || { count: 0, totalAmount: 0, avgAmount: 0, maxAmount: 0, minAmount: 0 };

    res.status(200).json({
      success: true,
      data: {
        totals: {
          count: totals.count,
          totalAmount: totals.totalAmount,
          avgAmount: Math.round(totals.avgAmount * 100) / 100,
          maxAmount: totals.maxAmount,
          minAmount: totals.minAmount,
        },
        byStatus: statusBreakdown,
        byMethod: methodBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getMyPayments,
  getPaymentStats,
};

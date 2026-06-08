const Reservation = require('../models/Reservation');
const Schedule = require('../models/Schedule');
const ActivityLog = require('../models/ActivityLog');

// ── Helpers ──────────────────────────────────────────────────────────

const formatReservationResponse = (reservation) => ({
  id: reservation._id,
  userId: reservation.user,
  vehicleId: reservation.vehicle,
  spotId: reservation.spot,
  entryTime: reservation.entryTime,
  exitTime: reservation.exitTime,
  date: reservation.date,
  startTime: reservation.startTime,
  endTime: reservation.endTime,
  notes: reservation.notes,
  status: reservation.status,
  payment: reservation.payment,
  createdAt: reservation.createdAt,
  updatedAt: reservation.updatedAt,
});

const logActivity = async (userId, action, type, details = {}) => {
  try {
    await ActivityLog.create({ user: userId, action, type, details });
  } catch (err) {
    console.error('[activity] Failed to log activity:', err.message);
  }
};

/**
 * Build a filter object from query params for reservation listing.
 */
const buildReservationFilter = (query, userId, role) => {
  const filter = {};

  // Non-admin/non-operator users see only their own reservations
  if (role !== 'admin' && role !== 'operator') {
    filter.user = userId;
  } else if (query.userId) {
    // Admin/operator can filter by userId
    filter.user = query.userId;
  }

  // Filter by status
  if (query.status && ['pending', 'active', 'completed', 'cancelled'].includes(query.status)) {
    filter.status = query.status;
  }

  // Filter by date range
  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }

  // Filter by vehicle
  if (query.vehicleId) {
    filter.vehicle = query.vehicleId;
  }

  return filter;
};

// ── GET /api/reservations ─────────────────────────────────────────────
const getReservations = async (req, res, next) => {
  try {
    const filter = buildReservationFilter(req.query, req.user.id, req.user.role);

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      Reservation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('vehicle', 'plate type')
        .populate('spot', 'code zone'),
      Reservation.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: reservations.map(formatReservationResponse),
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

// ── GET /api/reservations/:id ─────────────────────────────────────────
const getReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id)
      .populate('user', 'name email')
      .populate('vehicle', 'plate type brand model color')
      .populate('spot', 'code zone type');

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Non-admin/non-operator users can only view their own reservations
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      if (reservation.user._id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own reservations' });
      }
    }

    res.status(200).json({ success: true, data: formatReservationResponse(reservation) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/reservations ────────────────────────────────────────────
const createReservation = async (req, res, next) => {
  try {
    const { vehicle, spot, entryTime, exitTime, date, startTime, endTime, notes } = req.body;

    // Validate future date
    if (date) {
      const resDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (resDate < today) {
        return res.status(400).json({ error: 'Reservation date cannot be in the past' });
      }
    }

    // Validate schedule hours
    if (date && startTime) {
      const schedule = await Schedule.findOne().lean();
      const defaultSchedule = {
        weekday: { open: '07:00', close: '19:00' },
        sunday: { open: '09:00', close: '17:00' },
      };

      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1-6 = weekday
      const isSunday = dayOfWeek === 0;

      const hours = isSunday
        ? schedule
          ? { open: schedule.sundayOpen, close: schedule.sundayClose }
          : defaultSchedule.sunday
        : schedule
          ? { open: schedule.weekdayOpen, close: schedule.weekdayClose }
          : defaultSchedule.weekday;

      if (startTime < hours.open || startTime >= hours.close) {
        return res.status(400).json({
          error: `Start time must be within operating hours (${hours.open} - ${hours.close})`,
        });
      }
    }

    // Check active reservation limit
    const activeReservation = await Reservation.findOne({
      user: req.user.id,
      status: { $in: ['pending', 'active'] },
    });
    if (activeReservation) {
      return res.status(409).json({ error: 'You already have an active or pending reservation' });
    }

    const reservation = await Reservation.create({
      user: req.user.id,
      vehicle,
      spot,
      entryTime: entryTime || null,
      exitTime: exitTime || null,
      date: date || null,
      startTime: startTime || null,
      endTime: endTime || null,
      notes: notes || '',
      status: 'pending',
    });

    const populated = await Reservation.findById(reservation._id)
      .populate('user', 'name email')
      .populate('vehicle', 'plate type')
      .populate('spot', 'code zone');

    // Log activity
    logActivity(req.user.id, 'Reservation created', 'reservation', {
      reservationId: reservation._id,
      status: reservation.status,
    });

    res.status(201).json({ success: true, data: formatReservationResponse(populated) });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/reservations/:id ─────────────────────────────────────────
const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Non-admin users can only update their own reservations
    if (req.user.role !== 'admin') {
      if (reservation.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own reservations' });
      }
    }

    // Cannot update completed or cancelled reservations
    if (reservation.status === 'completed' || reservation.status === 'cancelled') {
      return res.status(400).json({
        error: `Cannot update a ${reservation.status} reservation`,
      });
    }

    // Allowed fields for update
    const allowedFields = ['vehicle', 'spot', 'entryTime', 'exitTime', 'date', 'startTime', 'endTime', 'notes', 'status'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await Reservation.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('user', 'name email')
      .populate('vehicle', 'plate type')
      .populate('spot', 'code zone');

    if (!updated) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Log activity
    logActivity(req.user.id, 'Reservation updated', 'reservation', {
      reservationId: updated._id,
      status: updated.status,
      changes: updates,
    });

    res.status(200).json({ success: true, data: formatReservationResponse(updated) });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/reservations/:id ───────────────────────────────────────
const deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    // Non-admin users can only cancel their own reservations
    if (req.user.role !== 'admin') {
      if (reservation.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only cancel your own reservations' });
      }
    }

    // Soft delete: set status to cancelled instead of hard delete for non-admin
    if (req.user.role === 'admin' && req.query.hard === 'true') {
      await Reservation.findByIdAndDelete(id);
    } else {
      reservation.status = 'cancelled';
      await reservation.save();
    }

    // Log activity
    logActivity(req.user.id, 'Reservation cancelled', 'reservation', {
      reservationId: id,
    });

    res.status(200).json({ success: true, message: 'Reservation cancelled successfully' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/reservations/stats ────────────────────────────────────────
const getReservationStats = async (req, res, next) => {
  try {
    const filter = {};

    // Non-admin/non-operator see only their own stats
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      filter.user = req.user.id;
    }

    const stats = await Reservation.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusCounts = {
      pending: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      total: 0,
    };

    stats.forEach(({ _id, count }) => {
      if (statusCounts[_id] !== undefined) {
        statusCounts[_id] = count;
      }
      statusCounts.total += count;
    });

    res.status(200).json({ success: true, data: statusCounts });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReservations,
  getReservation,
  createReservation,
  updateReservation,
  deleteReservation,
  getReservationStats,
};

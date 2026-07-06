const Vehicle = require('../models/Vehicle');
const ActivityLog = require('../models/ActivityLog');
const { emitSpotUpdate, emitNewActivity } = require('../services/socketService');

// ── Helpers ──────────────────────────────────────────────────────────

const formatVehicleResponse = (vehicle) => ({
  id: vehicle._id,
  plate: vehicle.plate,
  type: vehicle.type,
  brand: vehicle.brand,
  model: vehicle.model,
  color: vehicle.color,
  ownerId: vehicle.owner,
  isActive: vehicle.isActive,
  createdAt: vehicle.createdAt,
  updatedAt: vehicle.updatedAt,
});

const logActivity = async (userId, action, type, details = {}) => {
  try {
    const entry = await ActivityLog.create({ user: userId, action, type, details });

    // Emit real-time activity event
    emitNewActivity({
      id: entry._id,
      action: entry.action,
      userId: entry.user,
      type: entry.type,
      details: entry.details,
      timestamp: entry.timestamp,
    });

    return entry;
  } catch (err) {
    console.error('[activity] Failed to log activity:', err.message);
  }
};

// ── GET /api/vehicles ─────────────────────────────────────────────────
// List vehicles for current user (or all for admin/operator)
const getVehicles = async (req, res, next) => {
  try {
    const filter = {};

    // Non-admin/non-operator users see only their own vehicles
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      filter.owner = req.user.id;
    } else if (req.query.userId) {
      // Admin/operator can filter by userId
      filter.owner = req.query.userId;
    }

    // Filter by active status (default: active vehicles only)
    if (req.query.isActive !== undefined) {
      if (req.query.isActive !== 'all') {
        filter.isActive = req.query.isActive === 'true';
      }
      // 'all' — no isActive filter applied (admin/operator use case)
    } else {
      filter.isActive = true;
    }

    // Filter by type
    if (req.query.type && ['car', 'moto', 'bike'].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    // Search by plate
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.plate = searchRegex;
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('owner', 'name email'),
      Vehicle.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: vehicles.map(formatVehicleResponse),
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

// ── GET /api/vehicles/:id ─────────────────────────────────────────────
const getVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id).populate('owner', 'name email');
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Non-admin/non-operator users can only view their own vehicles
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      if (vehicle.owner._id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own vehicles' });
      }
    }

    res.status(200).json({ success: true, data: formatVehicleResponse(vehicle) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/vehicles ────────────────────────────────────────────────
const createVehicle = async (req, res, next) => {
  try {
    const { plate, type, brand, model, color } = req.body;

    // Check for duplicate active plate
    const existing = await Vehicle.findOne({ plate, isActive: true });
    if (existing) {
      return res.status(409).json({ error: 'A vehicle with this plate is already registered' });
    }

    const vehicle = await Vehicle.create({
      plate,
      type,
      brand,
      model,
      color,
      owner: req.user.id,
    });

    // Log activity
    logActivity(req.user.id, 'Vehicle registered', 'vehicle', {
      vehicleId: vehicle._id,
      plate: vehicle.plate,
    });

    // Emit spot update (vehicle entry implies a spot was occupied)
    emitSpotUpdate({
      id: vehicle.plate,
      code: vehicle.plate,
      zone: req.body.zone || 'A',
      status: 'ocupado',
      vehicleType: vehicle.type,
      plate: vehicle.plate,
    });

    res.status(201).json({ success: true, data: formatVehicleResponse(vehicle) });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/vehicles/:id ─────────────────────────────────────────────
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Non-admin users can only update their own vehicles
    if (req.user.role !== 'admin') {
      if (vehicle.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only update your own vehicles' });
      }
    }

    // Allowed fields for update
    const allowedFields = ['plate', 'type', 'brand', 'model', 'color', 'isActive'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updated = await Vehicle.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email');

    if (!updated) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Log activity
    logActivity(req.user.id, 'Vehicle updated', 'vehicle', {
      vehicleId: updated._id,
      plate: updated.plate,
      changes: updates,
    });

    res.status(200).json({ success: true, data: formatVehicleResponse(updated) });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/vehicles/:id ──────────────────────────────────────────
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Non-admin users can only delete their own vehicles
    if (req.user.role !== 'admin') {
      if (vehicle.owner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own vehicles' });
      }
    }

    // Soft delete: set isActive to false
    await Vehicle.findByIdAndUpdate(id, { isActive: false });

    // Log activity
    logActivity(req.user.id, 'Vehicle deactivated', 'vehicle', {
      vehicleId: id,
      plate: vehicle.plate,
    });

    res.status(200).json({ success: true, message: 'Vehicle deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};

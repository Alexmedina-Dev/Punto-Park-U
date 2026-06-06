const User = require('../models/User');

const ASSIGNABLE_ROLES = ['admin', 'operator', 'user'];

// ── Helpers ──────────────────────────────────────────────────────────

const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username || user.email?.split('@')[0],
  name: user.name,
  nombres: user.name?.split(' ').slice(0, -1).join(' ') || user.name,
  apellidos: user.name?.split(' ').slice(-1).join(' ') || '',
  email: user.email,
  cedula: user.cedula,
  rol: user.role,
  role: user.role,
  phone: user.phone,
  isVerified: user.isVerified,
  authProvider: user.authProvider,
  googlePicture: user.googlePicture,
  createdAt: user.createdAt,
});

/**
 * Build a filter object from query params for user listing.
 */
const buildUserFilter = (query) => {
  const filter = {};

  if (query.role && ['admin', 'operator', 'user', 'guest'].includes(query.role)) {
    filter.role = query.role;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { username: searchRegex },
      { cedula: searchRegex },
    ];
  }

  return filter;
};

// ── GET /api/users ────────────────────────────────────────────────────
// Admin/operator: list all users with optional filters and pagination
const getUsers = async (req, res, next) => {
  try {
    const filter = buildUserFilter(req.query);

    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password -twoFactorSecret -twoFactorTempSecret -backupCodes -resetToken -resetTokenExpiry -verificationToken -verificationTokenExpiry'),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: users.map(formatUserResponse),
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

// ── GET /api/users/stats ──────────────────────────────────────────────
// Admin only: count users by role
const getUserStats = async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const roleCounts = {
      admin: 0,
      operator: 0,
      user: 0,
      guest: 0,
      total: 0,
    };

    stats.forEach(({ _id, count }) => {
      if (roleCounts[_id] !== undefined) {
        roleCounts[_id] = count;
      }
      roleCounts.total += count;
    });

    res.status(200).json({ success: true, data: roleCounts });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/users/:id ────────────────────────────────────────────────
// Admin/operator: get any user. User: get own profile only.
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Non-admin/non-operator users can only view their own profile
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      if (req.user.id !== id) {
        return res.status(403).json({ error: 'You can only view your own profile' });
      }
    }

    const user = await User.findById(id).select('-password -twoFactorSecret -twoFactorTempSecret -backupCodes -resetToken -resetTokenExpiry -verificationToken -verificationTokenExpiry');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ success: true, data: formatUserResponse(user) });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/users/:id ────────────────────────────────────────────────
// Admin: update any user. User: update own profile only.
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Non-admin users can only update their own profile
    if (req.user.role !== 'admin') {
      if (req.user.id !== id) {
        return res.status(403).json({ error: 'You can only update your own profile' });
      }
    }

    // Fields allowed for update
    const allowedFields = ['name', 'email', 'phone', 'cedula', 'username'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -twoFactorSecret -twoFactorTempSecret -backupCodes -resetToken -resetTokenExpiry -verificationToken -verificationTokenExpiry');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ success: true, data: formatUserResponse(user) });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/users/:id/role ───────────────────────────────────────────
// Admin only: change user role. Cannot change own role.
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    if (!role || !ASSIGNABLE_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Invalid role. Must be one of: ${ASSIGNABLE_ROLES.join(', ')}`,
      });
    }

    // Prevent self-demotion
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -twoFactorSecret -twoFactorTempSecret -backupCodes -resetToken -resetTokenExpiry -verificationToken -verificationTokenExpiry');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Role updated',
      data: { id: user._id, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/users/:id ─────────────────────────────────────────────
// Admin only: delete user. Cannot delete self.
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUser,
  updateUser,
  updateRole,
  deleteUser,
  getUserStats,
};

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
    },
    refreshToken: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    device: {
      type: String,
      default: 'unknown',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: { expireAfterSeconds: 0 },
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

// ── Compound indexes ─────────────────────────────────────────────────

sessionSchema.index({ userId: 1, lastActiveAt: -1 });
sessionSchema.index({ token: 1 }, { unique: true });

// ── Instance methods ──────────────────────────────────────────────────

/**
 * Check if the session has been revoked.
 * @returns {boolean}
 */
sessionSchema.methods.isRevoked = function () {
  return !!this.revokedAt;
};

/**
 * Check if the session is expired.
 * @returns {boolean}
 */
sessionSchema.methods.isExpired = function () {
  return this.expiresAt <= new Date();
};

/**
 * Check if the session is still valid (not revoked, not expired).
 * @returns {boolean}
 */
sessionSchema.methods.isValid = function () {
  return !this.isRevoked() && !this.isExpired();
};

/**
 * Revoke the session by setting revokedAt to now.
 * @returns {Promise<Document>}
 */
sessionSchema.methods.revoke = function () {
  this.revokedAt = new Date();
  return this.save();
};

/**
 * Update lastActiveAt to now.
 * @returns {Promise<Document>}
 */
sessionSchema.methods.updateActivity = function () {
  this.lastActiveAt = new Date();
  return this.save();
};

// ── Statics ───────────────────────────────────────────────────────────

/**
 * Find all active (non-revoked, non-expired) sessions for a user.
 * @param {string} userId
 * @returns {Promise<Array>}
 */
sessionSchema.statics.findActiveByUser = function (userId) {
  return this.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActiveAt: -1 });
};

/**
 * Count active sessions for a user.
 * @param {string} userId
 * @returns {Promise<number>}
 */
sessionSchema.statics.countActiveByUser = function (userId) {
  return this.countDocuments({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
};

/**
 * Delete all expired sessions (used by cleanup job).
 * @returns {Promise<{deletedCount: number}>}
 */
sessionSchema.statics.deleteExpired = function () {
  return this.deleteMany({
    $or: [{ expiresAt: { $lte: new Date() } }, { revokedAt: { $ne: null }, expiresAt: { $lte: new Date() } }],
  });
};

/**
 * Get session stats (admin only).
 * @returns {Promise<{total: number, active: number, revoked: number, expired: number}>}
 */
sessionSchema.statics.getStats = async function () {
  const now = new Date();
  const [total, active, revoked, expired] = await Promise.all([
    this.countDocuments({}),
    this.countDocuments({ revokedAt: null, expiresAt: { $gt: now } }),
    this.countDocuments({ revokedAt: { $ne: null } }),
    this.countDocuments({ expiresAt: { $lte: now } }),
  ]);
  return { total, active, revoked, expired };
};

module.exports = mongoose.model('Session', sessionSchema);

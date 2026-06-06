const Session = require('../models/Session');
const config = require('../config');

const SESSION_TIMEOUT_MS = (config.sessionTimeout || 30) * 60 * 1000; // default 30 min

// ── Helper: build session document from request ──────────────────────

const buildSessionData = (req, token, refreshToken = null) => ({
  userId: req.user.id,
  token,
  refreshToken,
  ipAddress: req.ip || req.connection?.remoteAddress || '',
  userAgent: req.headers['user-agent'] || '',
  device: parseDevice(req.headers['user-agent'] || ''),
  lastActiveAt: new Date(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
});

/**
 * Parse a user-agent string into a simple device label.
 * @param {string} ua
 * @returns {string}
 */
function parseDevice(ua) {
  if (!ua) return 'unknown';
  const uaLower = ua.toLowerCase();
  if (uaLower.includes('mobile') || uaLower.includes('android') || uaLower.includes('iphone')) return 'mobile';
  if (uaLower.includes('tablet') || uaLower.includes('ipad')) return 'tablet';
  if (uaLower.includes('bot') || uaLower.includes('crawler')) return 'bot';
  return 'desktop';
}

/**
 * Create a new session record for a user.
 * Called after login, register, OAuth, etc.
 */
const createSession = async (req, userId, token, refreshToken = null) => {
  try {
    const sessionData = {
      userId,
      token,
      refreshToken,
      ipAddress: req.ip || req.connection?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      device: parseDevice(req.headers['user-agent'] || ''),
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    return await Session.create(sessionData);
  } catch (err) {
    console.error('[session] Failed to create session:', err.message);
    return null;
  }
};

// ── GET /api/sessions ────────────────────────────────────────────────

const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.findActiveByUser(req.user.id);
    const now = new Date();

    const result = sessions.map((s) => ({
      id: s._id,
      userId: s.userId,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      device: s.device,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      expiresAt: s.expiresAt,
      isCurrent: s.token === getTokenFromRequest(req),
      isExpired: s.expiresAt <= now,
      isInactive: now - s.lastActiveAt > SESSION_TIMEOUT_MS,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/sessions/:id ──────────────────────────────────────────

const revokeSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Don't allow revoking current session through this endpoint
    if (session.token === getTokenFromRequest(req)) {
      return res.status(400).json({ error: 'Cannot revoke current session. Use logout instead.' });
    }

    await session.revoke();

    res.status(200).json({ success: true, message: 'Session revoked successfully' });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/sessions ─────────────────────────────────────────────

const revokeAllSessions = async (req, res, next) => {
  try {
    const currentToken = getTokenFromRequest(req);

    const result = await Session.updateMany(
      {
        userId: req.user.id,
        token: { $ne: currentToken },
        revokedAt: null,
      },
      { $set: { revokedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: `Revoked ${result.modifiedCount} session(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/sessions/activity ──────────────────────────────────────

const updateActivity = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = await Session.findOne({ token, userId: req.user.id });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.isRevoked()) {
      return res.status(401).json({ error: 'Session has been revoked' });
    }

    await session.updateActivity();

    res.status(200).json({ success: true, lastActiveAt: session.lastActiveAt });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/sessions/stats ───────────────────────────────────────────

const getSessionStats = async (req, res, next) => {
  try {
    const stats = await Session.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Extract the JWT token from the Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
}

module.exports = {
  createSession,
  getSessions,
  revokeSession,
  revokeAllSessions,
  updateActivity,
  getSessionStats,
};

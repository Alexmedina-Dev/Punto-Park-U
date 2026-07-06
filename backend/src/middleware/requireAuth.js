const jwt = require('jsonwebtoken');
const config = require('../config');
const Session = require('../models/Session');
const User = require('../models/User');

const SESSION_TIMEOUT_MS = (config.sessionTimeout || 30) * 60 * 1000;

/**
 * Middleware: requireAuth
 * Verifies JWT access token from Authorization: Bearer <token> header.
 * Also checks that the session exists, is not revoked, and is not expired.
 * Updates lastActiveAt on each request.
 * Returns 401 on missing, expired, invalid token, or invalid session.
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify JWT first
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // Skip session check for activity endpoint (to avoid recursion)
    if (req.path === '/api/sessions/activity' && req.method === 'POST') {
      return next();
    }

    // Look up session in database
    const session = await Session.findOne({ token });

    if (!session) {
      return res.status(401).json({ error: 'Session not found. Please log in again.' });
    }

    // Check if session has been revoked
    if (session.revokedAt) {
      return res.status(401).json({ error: 'Session has been revoked. Please log in again.' });
    }

    // Check if session is expired (7 day absolute expiry)
    if (session.expiresAt <= new Date()) {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    // Check inactivity timeout (30 min default)
    const inactiveMs = Date.now() - new Date(session.lastActiveAt).getTime();
    if (inactiveMs > SESSION_TIMEOUT_MS) {
      session.revokedAt = new Date();
      await session.save();
      return res.status(401).json({ error: 'Session inactive for too long. Please log in again.' });
    }

    // Update lastActiveAt asynchronously (fire-and-forget, don't block the request)
    session.lastActiveAt = new Date();
    session.save().catch((err) => {
      console.error('[requireAuth] Failed to update session activity:', err.message);
    });

    // Update user lastActivity asynchronously (fire-and-forget)
    User.updateOne({ _id: decoded.id }, { lastActivity: new Date() }).catch((err) => {
      console.error('[requireAuth] Failed to update user lastActivity:', err.message);
    });

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Authentication required' });
  }
};

module.exports = requireAuth;

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware: requireAuth
 * Verifies JWT access token from Authorization: Bearer <token> header.
 * Attaches { id, email, role } to req.user on success.
 * Returns 401 on missing, expired, or invalid token.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Authentication required' });
  }
};

module.exports = requireAuth;

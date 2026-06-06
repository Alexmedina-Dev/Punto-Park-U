const requireAuth = require('./requireAuth');

/**
 * Middleware: requireAdmin
 * Extends requireAuth — first verifies the JWT, then checks admin role.
 * Returns 403 if the user is not an admin.
 */
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  });
};

module.exports = requireAdmin;

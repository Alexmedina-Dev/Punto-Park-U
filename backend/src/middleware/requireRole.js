const requireAuth = require('./requireAuth');

/**
 * Role hierarchy — higher index = more permissions.
 * @type {string[]}
 */
const ROLE_HIERARCHY = ['guest', 'user', 'operator', 'admin'];

/**
 * Check if a given role meets or exceeds the minimum required role.
 * @param {string} userRole - The current user's role
 * @param {string} minRole - The minimum role required
 * @returns {boolean}
 */
function hasMinimumRole(userRole, minRole) {
  const userIdx = ROLE_HIERARCHY.indexOf(userRole);
  const minIdx = ROLE_HIERARCHY.indexOf(minRole);
  if (userIdx === -1 || minIdx === -1) return false;
  return userIdx >= minIdx;
}

/**
 * Middleware: requireRole(minRole)
 * Authenticates the user first, then checks if their role meets the minimum.
 * Returns 403 if the role is insufficient, 401 if not authenticated.
 *
 * @param {string} minRole - Minimum role required (e.g., 'admin', 'operator', 'user')
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/admin/users', requireAuth, requireRole('admin'), handler);
 * router.get('/operator/data', requireAuth, requireRole('operator'), handler);
 */
function requireRole(minRole) {
  return (req, res, next) => {
    requireAuth(req, res, (err) => {
      if (err) return;

      if (!hasMinimumRole(req.user.role, minRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    });
  };
}

/**
 * Middleware: requireRoles(roles)
 * Authenticates the user first, then checks if their role is one of the accepted roles.
 * Returns 403 if the role is not in the list, 401 if not authenticated.
 *
 * @param {string[]} roles - Array of accepted roles (e.g., ['admin', 'operator'])
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/users', requireAuth, requireRoles(['admin', 'operator']), handler);
 */
function requireRoles(roles) {
  return (req, res, next) => {
    requireAuth(req, res, (err) => {
      if (err) return;

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    });
  };
}

/**
 * Pre-built middleware: requireAdmin
 * Checks that the authenticated user has the 'admin' role.
 *
 * @example
 * router.delete('/users/:id', requireAdmin, handler);
 */
const requireAdmin = requireRole('admin');

/**
 * Pre-built middleware: requireOperator
 * Checks that the authenticated user has at least 'operator' role (admin or operator).
 *
 * @example
 * router.get('/users', requireOperator, handler);
 */
const requireOperator = requireRole('operator');

module.exports = {
  requireRole,
  requireRoles,
  requireAdmin,
  requireOperator,
  hasMinimumRole,
};

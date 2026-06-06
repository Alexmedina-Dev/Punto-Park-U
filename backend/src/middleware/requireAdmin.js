const { requireAdmin } = require('./requireRole');

/**
 * Middleware: requireAdmin
 * Re-exported from requireRole for backward compatibility.
 * Checks that the authenticated user has the 'admin' role.
 * Returns 403 if the user is not an admin.
 */
module.exports = requireAdmin;

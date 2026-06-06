const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireRole, requireRoles, requireAdmin } = require('../middleware/requireRole');
const requireAuth = require('../middleware/requireAuth');

// All user management routes require authentication
router.use(requireAuth);

// GET /api/users/stats — Admin only (must be before :id to avoid matching 'stats' as an id)
router.get('/stats', requireAdmin, userController.getUserStats);

// GET /api/users — Admin/operator: list all users with filters
router.get('/', requireRoles(['admin', 'operator']), userController.getUsers);

// GET /api/users/:id — Admin/operator/self
router.get('/:id', userController.getUser);

// PUT /api/users/:id/role — Admin only (must be before generic :id)
router.put('/:id/role', requireAdmin, userController.updateRole);

// PUT /api/users/:id — Admin/self
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id — Admin only
router.delete('/:id', requireAdmin, userController.deleteUser);

module.exports = router;

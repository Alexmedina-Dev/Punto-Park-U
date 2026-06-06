const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// All session routes require authentication
router.use(requireAuth);

// GET /api/sessions/stats — must come before /:id to avoid matching "stats" as an id
router.get('/stats', requireAdmin, sessionController.getSessionStats);

// GET /api/sessions — list all active sessions for current user
router.get('/', sessionController.getSessions);

// POST /api/sessions/activity — update lastActiveAt
router.post('/activity', sessionController.updateActivity);

// DELETE /api/sessions — revoke all sessions except current
router.delete('/', sessionController.revokeAllSessions);

// DELETE /api/sessions/:id — revoke a specific session
router.delete('/:id', sessionController.revokeSession);

module.exports = router;

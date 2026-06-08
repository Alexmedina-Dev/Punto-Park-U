const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const requireAuth = require('../middleware/requireAuth');

// All notification routes require authentication
router.use(requireAuth);

// GET /api/notifications/unread-count — must come before /:id
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH /api/notifications/read-all — must come before /:id
router.patch('/read-all', notificationController.markAllAsRead);

// GET /api/notifications/vapid-public-key
router.get('/vapid-public-key', notificationController.getVapidPublicKey);

// POST /api/notifications/subscribe
router.post('/subscribe', notificationController.subscribe);

// DELETE /api/notifications/subscribe
router.delete('/subscribe', notificationController.unsubscribe);

// POST /api/notifications/push-token — Register Expo push token
router.post('/push-token', notificationController.registerPushToken);

// DELETE /api/notifications/push-token — Unregister Expo push token
router.delete('/push-token', notificationController.unregisterPushToken);

// GET /api/notifications — List notifications
router.get('/', notificationController.getNotifications);

// PATCH /api/notifications/:id/read — Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// DELETE /api/notifications/:id — Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;

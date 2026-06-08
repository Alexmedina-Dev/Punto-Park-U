const notificationService = require('../services/notificationService');
const PushSubscription = require('../models/PushSubscription');
const PushToken = require('../models/PushToken');
const expoPushService = require('../services/expoPushService');

// ── GET /api/notifications ─────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    const unreadOnly = req.query.unread === 'true';

    const result = await notificationService.getUserNotifications(req.user.id, {
      limit,
      offset,
      unreadOnly,
    });

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: {
        limit,
        offset,
        total: result.total,
        unreadCount: result.unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/notifications/unread-count ─────────────────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.status(200).json({ success: true, data: { unreadCount: count } });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/:id/read ──────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: { id: notification._id, read: true } });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/notifications/read-all ──────────────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notifications/:id ──────────────────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.deleteNotification(id, req.user.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/notifications/subscribe ──────────────────────────────────
const subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription: endpoint and keys are required' });
    }

    // Upsert subscription
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user.id,
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: userAgent || '',
        active: true,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      data: { id: subscription._id },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notifications/subscribe ─────────────────────────────────
const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    await PushSubscription.findOneAndDelete({ endpoint, user: req.user.id });

    res.status(200).json({ success: true, message: 'Unsubscribed successfully' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/notifications/vapid-public-key ────────────────────────────
const getVapidPublicKey = async (req, res, next) => {
  try {
    const publicKey = notificationService.getVapidPublicKey();
    res.status(200).json({ success: true, data: { publicKey } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/notifications/push-token ───────────────────────────────────
const registerPushToken = async (req, res, next) => {
  try {
    const { expoPushToken, platform } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({ error: 'Expo push token is required' });
    }

    if (!expoPushService.isValidPushToken(expoPushToken)) {
      return res.status(400).json({ error: 'Invalid Expo push token format' });
    }

    const validPlatform = ['ios', 'android', 'web'].includes(platform) ? platform : 'ios';

    // Upsert push token
    const pushToken = await PushToken.findOneAndUpdate(
      { expoPushToken },
      {
        user: req.user.id,
        expoPushToken,
        platform: validPlatform,
        active: true,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      data: { id: pushToken._id, expoPushToken: pushToken.expoPushToken, platform: pushToken.platform },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/notifications/push-token ─────────────────────────────────
const unregisterPushToken = async (req, res, next) => {
  try {
    const { expoPushToken } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({ error: 'Expo push token is required' });
    }

    const result = await PushToken.findOneAndDelete({
      expoPushToken,
      user: req.user.id,
    });

    if (!result) {
      return res.status(404).json({ error: 'Push token not found' });
    }

    res.status(200).json({ success: true, message: 'Push token unregistered successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribe,
  unsubscribe,
  getVapidPublicKey,
  registerPushToken,
  unregisterPushToken,
};

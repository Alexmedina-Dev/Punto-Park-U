const webpush = require('web-push');
const config = require('../config');
const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const { getIO, ROOMS } = require('./socketService');

// ── VAPID setup ───────────────────────────────────────────────────────

let vapidConfigured = false;

const configureVapid = () => {
  if (vapidConfigured) return true;

  const { vapidPublicKey, vapidPrivateKey, vapidSubject } = config;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[notifications] VAPID keys not configured — push notifications disabled');
    return false;
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  vapidConfigured = true;
  console.log('[notifications] VAPID configured');
  return true;
};

// ── Notification types ─────────────────────────────────────────────────

const NOTIFICATION_TEMPLATES = {
  reservation_reminder: (data = {}) => ({
    title: 'Recordatorio de Reserva',
    message: `Tu reserva para ${data.plate || 'tu vehículo'} comienza en 15 minutos. ¡No olvides llegar a tiempo!`,
  }),
  payment_confirmed: (data = {}) => ({
    title: 'Pago Confirmado',
    message: `Pago de $${data.amount ? data.amount.toLocaleString() : '0'} COP confirmado para tu reserva.`,
  }),
  entry_alert: (data = {}) => ({
    title: 'Ingreso Registrado',
    message: `Tu vehículo ${data.plate || ''} ha ingresado al parqueadero.`,
  }),
  exit_alert: (data = {}) => ({
    title: 'Salida Registrada',
    message: `Tu vehículo ${data.plate || ''} ha salido del parqueadero. ¡Gracias por usar Punto Park U!`,
  }),
  system_alert: (data = {}) => ({
    title: 'Alerta del Sistema',
    message: data.message || 'Notificación del sistema de Punto Park U.',
  }),
};

// ── Create notification (DB) ───────────────────────────────────────────

const createNotification = async ({ userId, type, title, message, data = {} }) => {
  // Use template if title/message not provided
  const template = NOTIFICATION_TEMPLATES[type];
  const finalTitle = title || (template ? template(data).title : 'Notificación');
  const finalMessage = message || (template ? template(data).message : '');

  const notification = await Notification.create({
    user: userId,
    type,
    title: finalTitle,
    message: finalMessage,
    data,
  });

  // Emit real-time notification via WebSocket
  try {
    const io = getIO();
    io.to(ROOMS.user(userId)).emit('notification:new', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt,
    });
  } catch (err) {
    console.error('[notifications] Failed to emit WebSocket event:', err.message);
  }

  return notification;
};

// ── Send push notification ─────────────────────────────────────────────

const sendPushNotification = async (userId, { title, message, data = {} }) => {
  if (!configureVapid()) return;

  try {
    const subscriptions = await PushSubscription.find({ user: userId, active: true }).lean();

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      message,
      data,
      timestamp: Date.now(),
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payload
        )
      )
    );

    // Mark inactive subscriptions for cleanup
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const statusCode = result.reason?.statusCode;
        // 410 Gone / 404 Not Found — subscription is invalid
        if (statusCode === 410 || statusCode === 404) {
          await PushSubscription.findByIdAndUpdate(subscriptions[i]._id, { active: false });
          console.log(`[notifications] Deactivated invalid subscription for user ${userId}`);
        }
      }
    }
  } catch (err) {
    console.error('[notifications] Failed to send push notification:', err.message);
  }
};

// ── Full notify (DB + Push + WebSocket) ────────────────────────────────

const notifyUser = async ({ userId, type, title, message, data = {} }) => {
  const notification = await createNotification({ userId, type, title, message, data });

  // Send push notification asynchronously (fire-and-forget)
  sendPushNotification(userId, {
    title: notification.title,
    message: notification.message,
    data: { ...data, notificationId: notification._id.toString(), type },
  }).catch((err) => {
    console.error('[notifications] Push send error:', err.message);
  });

  return notification;
};

// ── Get notifications for user ─────────────────────────────────────────

const getUserNotifications = async (userId, { limit = 50, offset = 0, unreadOnly = false } = {}) => {
  const filter = { user: userId };
  if (unreadOnly) filter.read = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, read: false }),
  ]);

  return {
    notifications: notifications.map((n) => ({
      id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      read: n.read,
      readAt: n.readAt,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
    total,
    unreadCount,
    limit,
    offset,
  };
};

// ── Mark notification as read ──────────────────────────────────────────

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) return null;

  // Emit update via WebSocket
  try {
    const io = getIO();
    io.to(ROOMS.user(userId)).emit('notification:read', { id: notification._id.toString() });
  } catch (err) {
    // Socket may not be initialized
  }

  return notification;
};

// ── Mark all notifications as read ─────────────────────────────────────

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, read: false },
    { read: true, readAt: new Date() }
  );

  // Emit update via WebSocket
  try {
    const io = getIO();
    io.to(ROOMS.user(userId)).emit('notification:all-read', { userId });
  } catch (err) {
    // Socket may not be initialized
  }

  return result;
};

// ── Delete notification ────────────────────────────────────────────────

const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    user: userId,
  });

  if (!notification) return null;

  // Emit update via WebSocket
  try {
    const io = getIO();
    io.to(ROOMS.user(userId)).emit('notification:deleted', { id: notification._id.toString() });
  } catch (err) {
    // Socket may not be initialized
  }

  return notification;
};

// ── Get unread count ───────────────────────────────────────────────────

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, read: false });
};

// ── Get VAPID public key ───────────────────────────────────────────────

const getVapidPublicKey = () => {
  return config.vapidPublicKey || null;
};

module.exports = {
  configureVapid,
  createNotification,
  sendPushNotification,
  notifyUser,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getVapidPublicKey,
  NOTIFICATION_TEMPLATES,
};

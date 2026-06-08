const { Expo } = require('expo-server-sdk');
const config = require('../config');
const PushToken = require('../models/PushToken');

// ── Expo SDK client ──────────────────────────────────────────────────

let expoClient = null;

const getExpoClient = () => {
  if (!expoClient) {
    expoClient = new Expo({ accessToken: config.expoAccessToken });
  }
  return expoClient;
};

// ── Validate Expo push token ─────────────────────────────────────────

const isValidPushToken = (token) => {
  return Expo.isExpoPushToken(token);
};

// ── Send Expo push notification ──────────────────────────────────────

const sendPushNotification = async (userId, { title, message, data = {} }) => {
  try {
    // Get all active push tokens for this user
    const tokens = await PushToken.find({ user: userId, active: true }).lean();

    if (tokens.length === 0) return [];

    // Build messages for each valid token
    const messages = [];

    for (const tokenDoc of tokens) {
      const { expoPushToken } = tokenDoc;

      if (!isValidPushToken(expoPushToken)) {
        console.warn(`[expoPush] Invalid push token: ${expoPushToken}`);
        continue;
      }

      messages.push({
        to: expoPushToken,
        sound: 'default',
        title,
        body: message,
        data: {
          ...data,
          type: data.type || 'notification',
          screen: data.screen || null,
        },
        priority: 'high',
        badge: data.badge || 1,
      });
    }

    if (messages.length === 0) return [];

    // Send in chunks (Expo SDK handles chunking internally)
    const client = getExpoClient();
    const chunks = client.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await client.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (chunkErr) {
        console.error('[expoPush] Error sending chunk:', chunkErr.message);
      }
    }

    // Process receipts for any errors
    const receiptIds = [];
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error('[expoPush] Ticket error:', ticket.message);
        // If the token is invalid, deactivate it
        if (ticket.details?.error === 'DeviceNotRegistered') {
          const invalidToken = messages[tickets.indexOf(ticket)]?.to;
          if (invalidToken) {
            await PushToken.findOneAndUpdate(
              { expoPushToken: invalidToken },
              { active: false }
            );
          }
        }
      } else if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }

    // Check receipts after a short delay
    if (receiptIds.length > 0) {
      checkReceipts(client, receiptIds);
    }

    return tickets;
  } catch (err) {
    console.error('[expoPush] Failed to send push notification:', err.message);
    return [];
  }
};

// ── Check push receipts ──────────────────────────────────────────────

const checkReceipts = async (client, receiptIds) => {
  try {
    // Expo recommends waiting at least 30s before checking receipts
    // We use a fire-and-forget pattern with a delay
    setTimeout(async () => {
      try {
        const receiptIdChunks = client.chunkPushNotificationReceiptIds(receiptIds);

        for (const chunk of receiptIdChunks) {
          try {
            const receipts = await client.getPushNotificationReceiptsAsync(chunk);

            for (const [receiptId, receipt] of Object.entries(receipts)) {
              if (receipt.status === 'error') {
                console.error(`[expoPush] Receipt error for ${receiptId}:`, receipt.message);

                if (receipt.details?.error === 'DeviceNotRegistered') {
                  // Look up the token from the original message and deactivate it
                  // This is best-effort from the receipt data
                  console.warn(`[expoPush] Device not registered for receipt ${receiptId}`);
                }
              }
            }
          } catch (chunkErr) {
            console.error('[expoPush] Error checking receipt chunk:', chunkErr.message);
          }
        }
      } catch (err) {
        console.error('[expoPush] Error in receipt check:', err.message);
      }
    }, 30000); // 30 second delay
  } catch (err) {
    console.error('[expoPush] Failed to schedule receipt check:', err.message);
  }
};

// ── Full notify (DB + Expo Push + WebSocket) ─────────────────────────

const notifyUser = async ({ userId, type, title, message, data = {} }) => {
  // Reuse the existing notificationService for DB + WebSocket
  const notificationService = require('./notificationService');
  const notification = await notificationService.createNotification({
    userId,
    type,
    title,
    message,
    data,
  });

  // Send Expo push notification asynchronously (fire-and-forget)
  sendPushNotification(userId, {
    title: notification.title,
    message: notification.message,
    data: { ...data, notificationId: notification._id.toString(), type },
  }).catch((err) => {
    console.error('[expoPush] Push send error:', err.message);
  });

  return notification;
};

module.exports = {
  sendPushNotification,
  isValidPushToken,
  notifyUser,
};

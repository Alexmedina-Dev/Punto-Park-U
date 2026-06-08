const cron = require('node-cron');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const { notifyUser } = require('../services/notificationService');

let reminderTask = null;

/**
 * Check for upcoming reservations and send reminders.
 * Runs every minute — finds reservations starting in ~15 minutes
 * that haven't been notified yet.
 */
const checkUpcomingReservations = async () => {
  try {
    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60 * 1000);

    // Find pending reservations where start time matches ~15 min from now
    // Match by date field + startTime, or by entryTime
    const reservations = await Reservation.find({
      status: 'pending',
      $or: [
        // Match by date + startTime
        {
          date: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
          startTime: { $ne: null },
        },
        // Match by entryTime (legacy)
        {
          entryTime: {
            $gte: now,
            $lte: in15Min,
          },
        },
      ],
    }).populate('user', 'email nombre apellidos').populate('vehicle', 'plate type');

    for (const reservation of reservations) {
      // Check if start time falls within the next 15 minutes
      if (reservation.startTime && reservation.date) {
        const [hours, minutes] = reservation.startTime.split(':').map(Number);
        const resDate = new Date(reservation.date);
        resDate.setHours(hours, minutes, 0, 0);

        const diff = resDate.getTime() - now.getTime();
        // Notify if within 14-16 minutes range (to catch the ~15 min mark)
        if (diff < 14 * 60 * 1000 || diff > 16 * 60 * 1000) {
          continue;
        }
      }

      try {
        await notifyUser({
          userId: reservation.user._id || reservation.user,
          type: 'reservation_reminder',
          data: {
            plate: reservation.vehicle?.plate || '',
            reservationId: reservation._id.toString(),
            date: reservation.date,
            startTime: reservation.startTime,
          },
        });

        console.log(`[reminder] Sent reminder for reservation ${reservation._id}`);
      } catch (err) {
        console.error(`[reminder] Failed to notify for reservation ${reservation._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[reminder] Error checking upcoming reservations:', err.message);
  }
};

// ── Test notification job ──────────────────────────────────────────────

/**
 * Send a test notification to a specific user.
 * @param {string} userId
 */
const sendTestNotification = async (userId) => {
  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      console.error('[reminder] Test notification failed: user not found');
      return;
    }

    await notifyUser({
      userId,
      type: 'system_alert',
      title: '🔔 Notificación de Prueba',
      message: 'Esta es una notificación de prueba del sistema Punto Park U.',
      data: { test: true },
    });

    console.log(`[reminder] Test notification sent to user ${userId}`);
  } catch (err) {
    console.error('[reminder] Failed to send test notification:', err.message);
  }
};

// ── Start ──────────────────────────────────────────────────────────────

/**
 * Start the reminder cron job.
 * Runs every minute to check for upcoming reservations.
 */
const startReminderJob = () => {
  if (reminderTask) {
    console.warn('[reminder] Reminder job already running');
    return;
  }

  // Run every minute: * * * * *
  reminderTask = cron.schedule('* * * * *', () => {
    checkUpcomingReservations();
  });

  console.log('[reminder] Reminder job started (every minute)');
};

/**
 * Stop the reminder cron job.
 */
const stopReminderJob = () => {
  if (reminderTask) {
    reminderTask.stop();
    reminderTask = null;
    console.log('[reminder] Reminder job stopped');
  }
};

module.exports = { startReminderJob, stopReminderJob, sendTestNotification };

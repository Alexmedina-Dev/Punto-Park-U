const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const PushToken = require('../models/PushToken');

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~180 days

/**
 * Delete users who have been inactive for 6+ months.
 * Only deletes users with role 'user' (never admin/operator).
 * Also cleans up all related data: vehicles, reservations, payments, sessions, push tokens.
 */
async function cleanupInactiveUsers() {
  const cutoffDate = new Date(Date.now() - SIX_MONTHS_MS);

  try {
    // Find inactive users (role = user only)
    const inactiveUsers = await User.find({
      role: 'user',
      lastActivity: { $lt: cutoffDate },
    }).select('_id email');

    if (inactiveUsers.length === 0) {
      console.log('[cleanupInactiveUsers] No inactive users found');
      return 0;
    }

    const userIds = inactiveUsers.map((u) => u._id.toString());
    console.log(`[cleanupInactiveUsers] Found ${inactiveUsers.length} inactive users: ${inactiveUsers.map((u) => u.email).join(', ')}`);

    // Delete related data in bulk
    const vehicleResult = await Vehicle.deleteMany({ user: { $in: userIds } });
    const reservationResult = await Reservation.deleteMany({ user: { $in: userIds } });
    const paymentResult = await Payment.deleteMany({ user: { $in: userIds } });
    const sessionResult = await Session.deleteMany({ user: { $in: userIds } });
    const pushTokenResult = await PushToken.deleteMany({ user: { $in: userIds } });

    // Delete users
    const userResult = await User.deleteMany({ _id: { $in: userIds } });

    console.log(
      `[cleanupInactiveUsers] Deleted ${userResult.deletedCount} users, ` +
        `${vehicleResult.deletedCount} vehicles, ` +
        `${reservationResult.deletedCount} reservations, ` +
        `${paymentResult.deletedCount} payments, ` +
        `${sessionResult.deletedCount} sessions, ` +
        `${pushTokenResult.deletedCount} push tokens`
    );

    return userResult.deletedCount;
  } catch (err) {
    console.error('[cleanupInactiveUsers] Error:', err.message);
    return 0;
  }
}

/**
 * Start the cleanup job. Runs every 24 hours at 3:00 AM.
 */
function startInactiveUserCleanupJob() {
  const now = new Date();
  const next3am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0);
  if (next3am <= now) {
    next3am.setDate(next3am.getDate() + 1);
  }
  const msUntil3am = next3am.getTime() - now.getTime();

  // Run first time at next 3 AM
  setTimeout(() => {
    cleanupInactiveUsers();
    // Then every 24 hours
    setInterval(cleanupInactiveUsers, 24 * 60 * 60 * 1000);
  }, msUntil3am);

  console.log(`[cleanupInactiveUsers] Scheduled to run daily at 3:00 AM (first run in ${Math.round(msUntil3am / 3600000)}h)`);
}

module.exports = { cleanupInactiveUsers, startInactiveUserCleanupJob };

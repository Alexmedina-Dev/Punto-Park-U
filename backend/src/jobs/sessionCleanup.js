const Session = require('../models/Session');

let cleanupInterval = null;

/**
 * Run a single cleanup cycle:
 * - Delete all expired sessions from the database.
 * - Log the number of deleted records.
 */
const runCleanup = async () => {
  try {
    const result = await Session.deleteExpired();
    if (result.deletedCount > 0) {
      console.log(`[session-cleanup] Deleted ${result.deletedCount} expired session(s)`);
    }
    return result;
  } catch (err) {
    console.error('[session-cleanup] Error during cleanup:', err.message);
    return { deletedCount: 0 };
  }
};

/**
 * Start the periodic cleanup job.
 * Runs every `intervalMinutes` minutes (default: 60).
 * @param {number} intervalMinutes
 */
const startCleanupJob = (intervalMinutes = 60) => {
  if (cleanupInterval) {
    console.warn('[session-cleanup] Cleanup job already running');
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;

  console.log(`[session-cleanup] Starting cleanup job every ${intervalMinutes} minute(s)`);

  // Run an initial cleanup immediately
  runCleanup();

  // Schedule periodic cleanup
  cleanupInterval = setInterval(runCleanup, intervalMs);
  cleanupInterval.unref(); // Don't prevent process exit
};

/**
 * Stop the periodic cleanup job.
 */
const stopCleanupJob = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[session-cleanup] Cleanup job stopped');
  }
};

module.exports = { startCleanupJob, stopCleanupJob, runCleanup };

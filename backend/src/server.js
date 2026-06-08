const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');
const { startCleanupJob } = require('./jobs/sessionCleanup');
const { startReminderJob } = require('./jobs/reminderJob');
const { startAnomalyCheckJob } = require('./jobs/anomalyCheckJob');
const { configureVapid } = require('./services/notificationService');
const { initSocketIO } = require('./services/socketService');
const { connectMQTT, disconnectMQTT } = require('./services/mqttService');

const startServer = async () => {
  // Attempt MongoDB connection (graceful on failure)
  await connectDB();

  // Start session cleanup job
  startCleanupJob(config.cleanupInterval || 60);

  // Start notification reminder job (PR 4)
  startReminderJob();

  // Start anomaly detection job (PR 2 - Phase 6)
  startAnomalyCheckJob();

  // Configure VAPID for push notifications
  configureVapid();

  const server = app.listen(config.port, () => {
    console.log(`[server] Punto Park U API running on port ${config.port} (${config.nodeEnv})`);
  });

  // Initialize Socket.IO on the same HTTP server
  initSocketIO(server);

  // Start MQTT client (Phase 7 — Hardware)
  connectMQTT();

  // ── Graceful shutdown ─────────────────────────────────────────
  const gracefulShutdown = (signal) => {
    console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);
    disconnectMQTT();
    server.close(() => {
      console.log('[server] HTTP server closed');
      process.exit(0);
    });

    // Force shutdown after 10s if graceful close hangs
    setTimeout(() => {
      console.error('[server] Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
};

startServer().catch((err) => {
  console.error(`[server] Failed to start: ${err.message}`);
  process.exit(1);
});

module.exports = startServer;

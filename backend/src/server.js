const app = require('./app');
const config = require('./config');
const connectDB = require('./config/database');

const startServer = async () => {
  // Attempt MongoDB connection (graceful on failure)
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`[server] Punto Park U API running on port ${config.port} (${config.nodeEnv})`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────
  const gracefulShutdown = (signal) => {
    console.log(`\n[server] Received ${signal}. Shutting down gracefully...`);
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

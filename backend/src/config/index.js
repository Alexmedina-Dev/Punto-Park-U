require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/punto-park-u',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-change-in-production',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/oauth/google/callback',
  // Email Verification
  strictEmailVerification: process.env.STRICT_EMAIL_VERIFICATION === 'true' || false,
  // Session Management
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT, 10) || 30,           // minutes
  activityHeartbeatInterval: parseInt(process.env.ACTIVITY_HEARTBEAT_INTERVAL, 10) || 5, // minutes
  cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL, 10) || 60, // minutes
  // Admin
  adminEmail: process.env.ADMIN_EMAIL || 'admin@puntoparku.com',
};

const requiredVars = ['jwtSecret', 'jwtRefreshSecret'];
const missing = requiredVars.filter((key) => !config[key]);

if (missing.length > 0) {
  console.warn(`[config] Missing required environment variables: ${missing.join(', ')}`);
  if (config.nodeEnv === 'production') {
    console.error('[config] Fatal: required env vars missing in production');
    process.exit(1);
  }
}

// Google OAuth validation
if (!config.googleClientId || !config.googleClientSecret) {
  console.warn('[config] GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET not set — Google OAuth will be disabled');
}

module.exports = config;

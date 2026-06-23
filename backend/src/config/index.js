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
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'https://punto-park-u.onrender.com/api/oauth/google/callback',
  // Email Verification
  strictEmailVerification: process.env.STRICT_EMAIL_VERIFICATION === 'true' || false,
  // Session Management
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT, 10) || 30,           // minutes
  activityHeartbeatInterval: parseInt(process.env.ACTIVITY_HEARTBEAT_INTERVAL, 10) || 5, // minutes
  cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL, 10) || 60, // minutes
  // Admin
  adminEmail: process.env.ADMIN_EMAIL || 'admin@puntoparku.com',
  // QR Secret for HMAC-signed QR codes (PR 3)
  qrSecret: process.env.QR_SECRET || 'dev-qr-secret-change-in-production',
  // ePayco Sandbox
  epayco: {
    apiKey: process.env.EPAYCO_API_KEY || '',
    privateKey: process.env.EPAYCO_PRIVATE_KEY || '',
    publicKey: process.env.EPAYCO_PUBLIC_KEY || '',
    test: process.env.EPAYCO_TEST !== 'false', // default true (sandbox)
    enabled: process.env.EPAYCO_ENABLED === 'true' || false,
  },
  // VAPID Keys for Web Push Notifications (PR 4)
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@puntoparku.com',
  // Expo Push Notifications (PR 5 — Mobile)
  expoAccessToken: process.env.EXPO_ACCESS_TOKEN || '',
  // MQTT Configuration (Phase 7 — Hardware)
  mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  mqttTopicPrefix: process.env.MQTT_TOPIC_PREFIX || 'parking/spots',
  // Barrier Configuration (Phase 7 — Hardware)
  barrierEndpoints: process.env.BARRIER_ENDPOINTS ? JSON.parse(process.env.BARRIER_ENDPOINTS) : null,
  barrierAutoCloseMs: parseInt(process.env.BARRIER_AUTO_CLOSE_MS, 10) || 30000,
  barrierTimeoutMs: parseInt(process.env.BARRIER_TIMEOUT_MS, 10) || 5000,
  // Camera Configuration (Phase 7 — Hardware)
  cameraServiceUrl: process.env.CAMERA_SERVICE_URL || 'http://localhost:4001',
  ocrConfidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD) || 0.60,
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

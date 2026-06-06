require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/punto-park-u',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-change-in-production',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

module.exports = config;

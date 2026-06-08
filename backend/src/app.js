const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth');
const twoFactorRoutes = require('./routes/twoFactor');
const sessionRoutes = require('./routes/sessions');

const app = express();

// ── Security headers ──────────────────────────────────────────────
// helmet is deferred to Phase 2 per design decision; placeholder for future use

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({ origin: config.corsOrigin }));

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logging ───────────────────────────────────────────────
app.use(morgan('dev'));

// ── Rate limiting ─────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Webhook routes (before auth — no JWT required) ─────────────────
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);

// ── Routes ────────────────────────────────────────────────────────

// Welcome / root
app.get('/', (req, res) => {
  res.json({
    name: 'Punto Park U API',
    version: '1.0.0',
    status: 'running',
  });
});

// Health check
app.use('/api', indexRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// OAuth routes (Google, etc.)
app.use('/api/oauth', oauthRoutes);

// 2FA routes (under /api/auth/2fa)
app.use('/api/auth/2fa', twoFactorRoutes);

// Session routes
app.use('/api/sessions', sessionRoutes);

// User management routes (admin/operator)
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// Vehicle routes
const vehicleRoutes = require('./routes/vehicles');
app.use('/api/vehicles', vehicleRoutes);

// Reservation routes
const reservationRoutes = require('./routes/reservations');
app.use('/api/reservations', reservationRoutes);

// Payment routes
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// QR Entry/Exit routes (PR 3)
const qrRoutes = require('./routes/qr');
app.use('/api/qr', qrRoutes);

// Admin routes (activity log, alerts, reports)
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Notification routes (PR 4)
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Anomaly routes (PR 2 - Phase 6)
const anomalyRoutes = require('./routes/anomaly');
app.use('/api/anomalies', anomalyRoutes);

// Pricing routes (PR 3 - Phase 6)
const pricingRoutes = require('./routes/pricing');
app.use('/api/pricing', pricingRoutes);

// Hardware routes (PR 1 - Phase 7)
const hardwareRoutes = require('./routes/hardware');
app.use('/api/hardware', hardwareRoutes);

// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const oauthController = require('../controllers/oauthController');

// ── Rate limiting ────────────────────────────────────────────────────
// Stricter limits for OAuth endpoints to prevent abuse
const oauthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many OAuth requests, please try again later.' },
});

router.use(oauthLimiter);

// ── Routes ───────────────────────────────────────────────────────────

// GET /api/oauth/google — Initiate Google OAuth flow
router.get('/google', oauthController.googleAuth);

// GET /api/oauth/google/callback — Handle Google OAuth callback
router.get('/google/callback', oauthController.googleCallback);

module.exports = router;

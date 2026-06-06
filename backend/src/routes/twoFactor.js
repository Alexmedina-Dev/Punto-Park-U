const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const twoFactorController = require('../controllers/twoFactorController');

// ── Rate limiters ────────────────────────────────────────────────────

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many 2FA verification attempts. Please try again in 15 minutes.' },
});

const verifySetupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification attempts. Please try again in 15 minutes.' },
});

// ── Routes ───────────────────────────────────────────────────────────

// Protected routes (require auth)
router.get('/status', requireAuth, twoFactorController.status2FA);
router.post('/setup', requireAuth, twoFactorController.setup2FA);
router.post('/verify-setup', requireAuth, verifySetupLimiter, twoFactorController.verifySetup);
router.post('/disable', requireAuth, twoFactorController.disable2FA);
router.post('/backup-codes', requireAuth, twoFactorController.generateBackupCodes);

// Public routes (require tempToken from login)
router.post('/verify', verifyLimiter, twoFactorController.verify2FA);
router.post('/verify-backup', verifyLimiter, twoFactorController.verifyBackupCode);

module.exports = router;

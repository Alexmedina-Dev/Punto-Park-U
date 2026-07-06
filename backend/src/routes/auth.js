const express = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

// ── Validation rules ─────────────────────────────────────────────────

const registerValidation = [
  body('name')
    .optional({ values: 'falsy' })
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('nombres')
    .optional({ values: 'falsy' })
    .isLength({ min: 2 })
    .withMessage('Nombres must be at least 2 characters'),
  body('email')
    .optional({ values: 'falsy' })
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('cedula')
    .notEmpty()
    .withMessage('Cédula is required')
    .matches(/^\d{6,10}$/)
    .withMessage('Cédula must be between 6 and 10 digits'),
  body('username')
    .optional({ values: 'falsy' })
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('phone')
    .optional({ values: 'falsy' })
    .matches(/^3\d{9}$/)
    .withMessage('Phone must be a valid Colombian number (e.g., 3001234567)'),
  body('fechaNacimiento')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Fecha de nacimiento must be a valid date')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        throw new Error('Debes ser mayor de 18 años');
      }
      if (age > 85) {
        throw new Error('La edad máxima permitida es 85 años');
      }
      return true;
    }),
  body().custom((_, { req }) => {
    if (!req.body.name && !req.body.nombres) {
      throw new Error('Either name or nombres is required');
    }
    return true;
  }),
];

const loginValidation = [
  body('email')
    .optional({ values: 'falsy' })
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('username')
    .optional({ values: 'falsy' })
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body().custom((_, { req }) => {
    if (!req.body.email && !req.body.username) {
      throw new Error('Either email or username is required');
    }
    return true;
  }),
];

// ── Password reset validation ────────────────────────────────────────

const forgotPasswordValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

// ── Rate limiters ────────────────────────────────────────────────────

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,                   // 3 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset requests. Please try again in 15 minutes.' },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,                   // 3 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset attempts. Please try again in 15 minutes.' },
});

// ── Routes ───────────────────────────────────────────────────────────

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/admin/login', loginValidation, authController.adminLogin);
router.get('/me', requireAuth, authController.me);
router.get('/profile', requireAuth, authController.me);
router.delete('/me', requireAuth, authController.deleteAccount);
router.post('/refresh', authController.refresh);
router.post('/logout', requireAuth, authController.logout);

// ── Email verification rate limiters ───────────────────────────────

const verificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2,                   // 2 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification requests. Please try again in 1 hour.' },
});

const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2,                   // 2 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many resend attempts. Please try again in 1 hour.' },
});

// ── Email verification routes (rate limited) ──────────────────────

router.post('/verify/send', verificationLimiter, authController.sendVerification);
router.get('/verify/:token', authController.verifyEmail);
router.get('/verify', authController.verifyEmail); // also accept ?token= query param
router.post('/verify/resend', resendVerificationLimiter, authController.resendVerification);

// Password recovery (rate limited)
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidation, authController.resetPassword);

module.exports = router;

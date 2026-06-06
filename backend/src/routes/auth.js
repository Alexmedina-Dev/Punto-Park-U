const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

// ── Validation rules ─────────────────────────────────────────────────

const registerValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('cedula')
    .notEmpty()
    .withMessage('Cédula is required')
    .matches(/^\d{6,10}$/)
    .withMessage('Cédula must be between 6 and 10 digits'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional({ values: 'falsy' })
    .matches(/^3\d{9}$/)
    .withMessage('Phone must be a valid Colombian number (e.g., 3001234567)'),
];

const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// ── Routes ───────────────────────────────────────────────────────────

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/refresh', authController.refresh);

module.exports = router;

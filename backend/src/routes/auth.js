const express = require('express');
const { body } = require('express-validator');
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
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional({ values: 'falsy' })
    .matches(/^3\d{9}$/)
    .withMessage('Phone must be a valid Colombian number (e.g., 3001234567)'),
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

// ── Routes ───────────────────────────────────────────────────────────

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', requireAuth, authController.me);
router.get('/profile', requireAuth, authController.me);
router.post('/refresh', authController.refresh);
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;

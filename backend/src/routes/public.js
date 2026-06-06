const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  getTariffs,
  getSchedule,
  getAvailability,
  getParkingSpots,
} = require('../controllers/publicController');

// ── Rate limiting ────────────────────────────────────────────────────
// Public endpoints get higher limits since the landing page can be
// hit many times by anonymous users, search engines, etc.

const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(publicLimiter);

// ── Caching headers middleware ───────────────────────────────────────

const setCache = (maxAge) => (req, res, next) => {
  res.set('Cache-Control', `public, max-age=${maxAge}`);
  next();
};

// ── Routes ───────────────────────────────────────────────────────────
// All mounted at /api/public in app.js

router.get('/tariffs', setCache(120), getTariffs);
router.get('/schedule', setCache(300), getSchedule);  // Schedule changes rarely
router.get('/availability', setCache(30), getAvailability);
router.get('/spots', setCache(30), getParkingSpots);

module.exports = router;

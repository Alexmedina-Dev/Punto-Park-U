const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// Public routes (landing page endpoints — no auth required)
const publicRoutes = require('./public');
router.use('/public', publicRoutes);

module.exports = router;

const express = require('express');
const router = express.Router();

// Placeholder — will be implemented in Batch 3
router.get('/tariffs', (req, res) => {
  res.json({ message: 'Public routes — to be implemented' });
});

router.get('/schedule', (req, res) => {
  res.json({ message: 'Public routes — to be implemented' });
});

router.get('/parking/availability', (req, res) => {
  res.json({ message: 'Public routes — to be implemented' });
});

module.exports = router;

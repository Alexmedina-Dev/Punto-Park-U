const express = require('express');
const router = express.Router();

// Placeholder — will be implemented in Batch 2
router.post('/register', (req, res) => {
  res.status(201).json({ message: 'Auth routes — to be implemented' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Auth routes — to be implemented' });
});

router.get('/me', (req, res) => {
  res.json({ message: 'Auth routes — to be implemented' });
});

router.post('/refresh', (req, res) => {
  res.json({ message: 'Auth routes — to be implemented' });
});

module.exports = router;

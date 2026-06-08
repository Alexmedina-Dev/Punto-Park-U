const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// All reservation routes require authentication
router.use(requireAuth);

// GET /api/reservations/stats — must come before /:id to avoid matching "stats" as an id
router.get('/stats', reservationController.getReservationStats);

// GET /api/reservations — List reservations
router.get('/', reservationController.getReservations);

// POST /api/reservations — Create a reservation
router.post('/', reservationController.createReservation);

// GET /api/reservations/:id — Get reservation details
router.get('/:id', reservationController.getReservation);

// PUT /api/reservations/:id — Update reservation
router.put('/:id', reservationController.updateReservation);

// DELETE /api/reservations/:id — Cancel reservation
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;

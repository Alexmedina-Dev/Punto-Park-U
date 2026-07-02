const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const epaycoController = require('../controllers/epaycoController');
const requireAuth = require('../middleware/requireAuth');

// All payment routes require authentication
router.use(requireAuth);

// ── ePayco-specific routes (must come before /:id) ─────────────────────

// POST /api/payments/epayco/checkout — Create ePayco checkout session
router.post('/epayco/checkout', epaycoController.createCheckout);

// GET /api/payments/epayco/:id/status — Poll ePayco payment status
router.get('/epayco/:id/status', epaycoController.getPaymentStatus);

// POST /api/payments/epayco/:id/refund — Refund ePayco payment (admin)
router.post('/epayco/:id/refund', epaycoController.refundPayment);

// POST /api/payments/:id/confirm — Confirm manual payment (admin/operator)
router.post('/:id/confirm', paymentController.confirmManualPayment);

// ── Standard payment routes ────────────────────────────────────────────

// GET /api/payments/stats — must come before /:id to avoid matching "stats" as an id
router.get('/stats', paymentController.getPaymentStats);

// GET /api/payments/my — Get current user's payments (must come before /:id)
router.get('/my', paymentController.getMyPayments);

// GET /api/payments — List payments
router.get('/', paymentController.getPayments);

// POST /api/payments — Create a payment
router.post('/', paymentController.createPayment);

// GET /api/payments/:id — Get payment details
router.get('/:id', paymentController.getPayment);

// PUT /api/payments/:id — Update payment (admin)
router.put('/:id', paymentController.updatePayment);

// DELETE /api/payments/:id — Delete payment (admin)
router.delete('/:id', paymentController.deletePayment);

module.exports = router;

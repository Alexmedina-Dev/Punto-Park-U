const express = require('express');
const router = express.Router();
const epaycoController = require('../controllers/epaycoController');

// ── ePayco Webhook ─────────────────────────────────────────────────────
// This endpoint receives callbacks from ePayco when payment status changes.
// NO auth middleware — security is via signature verification.
//
// ePayco sandbox test URLs:
//   HTTP:  https://sandbox.epayco.co/restpago/test/
//   HTTPS: https://secure.epayco.co/restpago/test/
//
// For local development, use ngrok or similar to expose this endpoint.

// POST /api/webhooks/epayco — Process ePayco payment notification
router.post('/epayco', epaycoController.handleWebhook);

module.exports = router;

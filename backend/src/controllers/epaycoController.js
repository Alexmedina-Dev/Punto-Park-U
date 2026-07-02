const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const ActivityLog = require('../models/ActivityLog');
const epaycoService = require('../services/epaycoService');
const { emitNewActivity } = require('../services/socketService');
const { notifyUser } = require('../services/notificationService');

// ── Helpers ────────────────────────────────────────────────────────────

const formatPaymentResponse = (payment) => ({
  id: payment._id,
  userId: payment.user,
  vehicleId: payment.vehicle,
  reservationId: payment.reservation,
  amount: payment.amount,
  method: payment.method,
  status: payment.status,
  date: payment.date,
  epaycoRef: payment.epaycoRef,
  checkoutUrl: payment.checkoutUrl,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const logActivity = async (userId, action, type, details = {}) => {
  try {
    await ActivityLog.create({ user: userId, action, type, details });
  } catch (err) {
    console.error('[activity] Failed to log activity:', err.message);
  }
};

// ── POST /api/payments/epayco/checkout ─────────────────────────────────

/**
 * Create an ePayco checkout session.
 * Requires auth. Body: { vehicle, reservation?, amount, email }
 */
const createCheckout = async (req, res, next) => {
  try {
    const { vehicle, reservation, amount, email } = req.body;

    let finalAmount = amount;

    // Auto-fill amount from reservation billingAmount if not provided
    if (!finalAmount && reservation) {
      const reservationDoc = await Reservation.findById(reservation).populate('vehicle', 'plate type');
      if (!reservationDoc) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      if (reservationDoc.billingAmount && reservationDoc.billingAmount > 0) {
        finalAmount = reservationDoc.billingAmount;
      } else {
        return res.status(400).json({ error: 'Reservation has no billing amount — complete the reservation first' });
      }
    }

    if (!vehicle || !finalAmount || finalAmount <= 0) {
      return res.status(400).json({ error: 'Vehicle and valid amount are required' });
    }

    const userEmail = email || req.user.email || '';

    // Create a pending_epayco payment in our DB
    const payment = await Payment.create({
      user: req.user.id,
      vehicle,
      reservation: reservation || null,
      amount: finalAmount,
      method: 'epayco',
      status: 'pending_epayco',
    });

    // Call ePayco to get a checkout URL
    const checkout = await epaycoService.createCheckout({
      amount: finalAmount,
      description: `Pago Punto Park U — ${finalAmount} COP`,
      email: userEmail,
      extra: {
        paymentId: payment._id.toString(),
        userId: req.user.id,
      },
    });

    // Update payment with ePayco reference data
    payment.epaycoRef = checkout.ref;
    payment.checkoutUrl = checkout.url;
    await payment.save();

    const populated = await Payment.findById(payment._id)
      .populate('user', 'name email')
      .populate('vehicle', 'plate type')
      .populate('reservation', 'status');

    // Log activity
    logActivity(req.user.id, 'ePayco checkout created', 'payment', {
      paymentId: payment._id,
      epaycoRef: checkout.ref,
      amount: finalAmount,
    });

    res.status(201).json({
      success: true,
      data: {
        payment: formatPaymentResponse(populated),
        checkoutUrl: checkout.url,
        ref: checkout.ref,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/webhooks/epayco ──────────────────────────────────────────

/**
 * Handle incoming ePayco webhook notifications.
 * This endpoint is called by ePayco after a payment is processed.
 * NO auth middleware — relies on signature verification.
 */
const handleWebhook = async (req, res, next) => {
  try {
    const payload = req.body;

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'Empty webhook payload' });
    }

    // Log the raw webhook for audit
    console.log('[epayco:webhook] Received:', JSON.stringify(payload).slice(0, 500));

    // Process and verify the webhook
    const result = epaycoService.processWebhook(payload);

    if (!result.valid && epaycoService.IS_ENABLED) {
      console.warn('[epayco:webhook] Invalid signature — rejecting');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Find the payment by epaycoRef
    const payment = await Payment.findOne({ epaycoRef: result.refPayco });
    if (!payment) {
      // Fallback: try to find by transaction in webhookLogs
      console.warn(`[epayco:webhook] No payment found for ref: ${result.refPayco}`);
      return res.status(200).json({ success: true, message: 'Received (no matching payment)' });
    }

    // Store the webhook in logs
    payment.webhookLogs.push({
      status: result.status,
      body: payload,
      receivedAt: new Date(),
    });

    // If signature is valid or we're in mock mode, update the payment
    const prevStatus = payment.status;

    if (result.status === 'completed') {
      payment.status = 'completed';
      payment.epaycoResponse = result.raw;
    } else if (result.status === 'failed') {
      payment.status = 'failed';
      payment.epaycoResponse = result.raw;
    }
    // pending_epayco — leave as-is (still waiting)

    await payment.save();

    // If status changed, emit WebSocket event
    if (prevStatus !== payment.status) {
      // Emit to user's personal room
      try {
        const { getIO, ROOMS } = require('../services/socketService');
        const io = getIO();
        io.to(ROOMS.user(payment.user.toString())).emit('payment:update', {
          paymentId: payment._id,
          status: payment.status,
          amount: payment.amount,
          method: 'epayco',
          epaycoRef: payment.epaycoRef,
        });
      } catch (wsErr) {
        // Socket not initialized yet — non-critical
        console.warn('[epayco:webhook] Failed to emit WS event:', wsErr.message);
      }

      // Log activity
      logActivity(payment.user, `Payment ${payment.status}`, 'payment', {
        paymentId: payment._id,
        epaycoRef: result.refPayco,
        status: payment.status,
        amount: payment.amount,
      });

      // Send push notification on successful payment
      if (payment.status === 'completed') {
        try {
          await notifyUser({
            userId: payment.user.toString(),
            type: 'payment_confirmed',
            title: 'Pago confirmado',
            message: `Tu pago de $${payment.amount.toLocaleString()} COP ha sido procesado exitosamente.`,
            data: { paymentId: payment._id.toString(), amount: payment.amount },
          });
        } catch (notifErr) {
          console.warn('[epayco:webhook] Failed to send payment notification:', notifErr.message);
        }
      }
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/payments/:id/status ───────────────────────────────────────

/**
 * Poll payment status (fallback when webhook not received).
 * Calls ePayco to get current status, then updates local DB.
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Non-admin can only view their own payments
    if (req.user.role !== 'admin' && req.user.role !== 'operator') {
      if (payment.user.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only view your own payments' });
      }
    }

    // If already completed or failed, return current status
    if (payment.status === 'completed' || payment.status === 'failed') {
      return res.status(200).json({
        success: true,
        data: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          epaycoRef: payment.epaycoRef,
        },
      });
    }

    // Poll ePayco for updated status
    if (payment.epaycoRef) {
      try {
        const remoteStatus = await epaycoService.getPaymentStatus(payment.epaycoRef);

        // If we got a definitive status, update local
        if (remoteStatus.status === 'completed' || remoteStatus.status === 'failed') {
          const prevStatus = payment.status;
          payment.status = remoteStatus.status;
          payment.epaycoResponse = remoteStatus;
          await payment.save();

          // Emit WS event on change
          if (prevStatus !== payment.status) {
            try {
              const { getIO, ROOMS } = require('../services/socketService');
              const io = getIO();
              io.to(ROOMS.user(payment.user.toString())).emit('payment:update', {
                paymentId: payment._id,
                status: payment.status,
                amount: payment.amount,
                method: 'epayco',
              });
            } catch (wsErr) {
              console.warn('[epayco:status] Failed to emit WS event:', wsErr.message);
            }
          }
        }
      } catch (pollErr) {
        console.warn('[epayco:status] Poll failed:', pollErr.message);
        // Return current local status even if poll fails
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        epaycoRef: payment.epaycoRef,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/payments/:id/refund ──────────────────────────────────────

/**
 * Refund an ePayco payment (admin only).
 */
const refundPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can refund payments' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed payments can be refunded' });
    }

    if (!payment.epaycoRef) {
      return res.status(400).json({ error: 'Payment has no ePayco reference to refund' });
    }

    const refund = await epaycoService.refundPayment(payment.epaycoRef);

    payment.status = 'refunded';
    await payment.save();

    // Emit WS event
    try {
      const { getIO, ROOMS } = require('../services/socketService');
      const io = getIO();
      io.to(ROOMS.user(payment.user.toString())).emit('payment:update', {
        paymentId: payment._id,
        status: 'refunded',
        amount: payment.amount,
        method: 'epayco',
      });
    } catch (wsErr) {
      console.warn('[epayco:refund] Failed to emit WS event:', wsErr.message);
    }

    logActivity(req.user.id, 'Payment refunded', 'payment', {
      paymentId: payment._id,
      refundId: refund.refundId,
    });

    res.status(200).json({
      success: true,
      data: {
        id: payment._id,
        status: 'refunded',
        refundId: refund.refundId,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCheckout,
  handleWebhook,
  getPaymentStatus,
  refundPayment,
};

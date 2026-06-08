const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['cash', 'pos', 'epayco'],
        message: '{VALUE} is not a valid payment method',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'pending_epayco', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // ── ePayco-specific fields ──────────────────────────────────
    epaycoRef: {
      type: String,
      default: null,
    },
    epaycoResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    checkoutUrl: {
      type: String,
      default: null,
    },
    webhookLogs: {
      type: [
        {
          status: String,
          body: mongoose.Schema.Types.Mixed,
          receivedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
paymentSchema.index({ user: 1 });
paymentSchema.index({ reservation: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ date: -1 });
paymentSchema.index({ method: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

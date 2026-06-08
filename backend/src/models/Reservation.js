const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
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
    spot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpot',
      default: null,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    entryTime: {
      type: Date,
      required: [true, 'Entry time is required'],
    },
    exitTime: {
      type: Date,
      default: null,
    },
    billingAmount: {
      type: Number,
      default: null,
      min: [0, 'Billing amount cannot be negative'],
    },
    // ── User Panel fields (Phase 3) ──────────────────────────────────
    date: {
      type: Date,
      default: null,
    },
    startTime: {
      type: String,
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format (24h)'],
      default: null,
    },
    endTime: {
      type: String,
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format (24h)'],
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
reservationSchema.index({ status: 1 });
reservationSchema.index({ user: 1, status: 1 });
reservationSchema.index({ spot: 1, status: 1 });
reservationSchema.index({ date: 1 });
reservationSchema.index({ entryTime: -1 });
reservationSchema.index({ status: 1, entryTime: -1 });
reservationSchema.index({ status: 1, exitTime: -1 });
reservationSchema.index({ vehicle: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);

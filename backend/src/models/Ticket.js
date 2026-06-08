const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, 'Reservation is required'],
      unique: true,
    },
    qrData: {
      type: String,
      required: [true, 'QR data is required'],
    },
    qrHash: {
      type: String,
      required: [true, 'QR HMAC hash is required'],
    },
    validatedEntry: {
      type: Boolean,
      default: false,
    },
    entryValidatedAt: {
      type: Date,
      default: null,
    },
    validatedExit: {
      type: Boolean,
      default: false,
    },
    exitValidatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
ticketSchema.index({ reservation: 1 });
ticketSchema.index({ qrHash: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      enum: {
        values: ['system', 'occupancy', 'hardware', 'security'],
        message: '{VALUE} is not a valid alert type',
      },
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: ['info', 'warning', 'critical'],
        message: '{VALUE} is not a valid severity level',
      },
    },
    zone: {
      type: String,
      trim: true,
      maxlength: [50, 'Zone cannot exceed 50 characters'],
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
alertSchema.index({ type: 1 });
alertSchema.index({ severity: 1 });
alertSchema.index({ resolved: 1 });
alertSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Alert', alertSchema);

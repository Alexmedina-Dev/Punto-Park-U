const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    endpoint: {
      type: String,
      required: [true, 'Endpoint is required'],
      unique: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: [true, 'p256dh key is required'],
      },
      auth: {
        type: String,
        required: [true, 'Auth key is required'],
      },
    },
    userAgent: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
pushSubscriptionSchema.index({ user: 1 });
// endpoint index is handled by field-level `unique: true`

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);

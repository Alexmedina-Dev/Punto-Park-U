const mongoose = require('mongoose');

const pushTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    expoPushToken: {
      type: String,
      required: [true, 'Expo push token is required'],
      unique: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      default: 'ios',
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
pushTokenSchema.index({ user: 1, active: 1 });

module.exports = mongoose.model('PushToken', pushTokenSchema);

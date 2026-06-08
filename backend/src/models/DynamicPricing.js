const mongoose = require('mongoose');

const dynamicPricingSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    rules: {
      lowThreshold: { type: Number, default: 30 },
      highThreshold: { type: Number, default: 60 },
      peakThreshold: { type: Number, default: 80 },
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DynamicPricing', dynamicPricingSchema);

const mongoose = require('mongoose');

const tariffSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      unique: true,
      enum: {
        values: ['car', 'moto', 'camioneta', 'bike'],
        message: '{VALUE} is not a valid vehicle type',
      },
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
      min: [0, 'Hourly rate cannot be negative'],
    },
    dailyRate: {
      type: Number,
      required: [true, 'Daily rate is required'],
      min: [0, 'Daily rate cannot be negative'],
    },
    monthlyRate: {
      type: Number,
      required: [true, 'Monthly rate is required'],
      min: [0, 'Monthly rate cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
tariffSchema.index({ vehicleType: 1 });

module.exports = mongoose.model('Tariff', tariffSchema);

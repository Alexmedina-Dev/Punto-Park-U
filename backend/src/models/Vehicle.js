const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    plate: {
      type: String,
      required: [true, 'Plate is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9-]{4,10}$/, 'Plate format is invalid'],
    },
    type: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: ['car', 'moto', 'suv', 'bike'],
        message: '{VALUE} is not a valid vehicle type',
      },
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, 'Brand cannot exceed 50 characters'],
    },
    model: {
      type: String,
      trim: true,
      maxlength: [50, 'Model cannot exceed 50 characters'],
    },
    color: {
      type: String,
      trim: true,
      maxlength: [30, 'Color cannot exceed 30 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
vehicleSchema.index({ plate: 1 });
vehicleSchema.index({ owner: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);

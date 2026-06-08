const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    plate: {
      type: String,
      required: [true, 'Plate is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [5, 'Plate must be between 5 and 6 characters'],
      maxlength: [6, 'Plate must be between 5 and 6 characters'],
      match: [/^([A-Z]{3}[0-9]{2,3}[A-Z]?$|[A-Z]{2}[0-9]{4}$)/, 'Plate format is invalid. Examples: ABC123, ABC12D, ABC12, AB1234'],
    },
    type: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: {
        values: ['car', 'moto', 'bike'],
        message: '{VALUE} is not a valid vehicle type',
      },
    },
    entryCount: {
      type: Number,
      default: 0,
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
// plate has an implicit index from `unique: true` in the schema definition
vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ isActive: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);

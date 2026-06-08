const mongoose = require('mongoose');

const parkingSpotSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Spot code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-C]\d{1,2}$/, 'Code must be like A1, B12, C3'],
    },
    zone: {
      type: String,
      required: [true, 'Zone is required'],
      enum: {
        values: ['A', 'B', 'C'],
        message: '{VALUE} is not a valid zone',
      },
    },
    type: {
      type: String,
      required: [true, 'Spot type is required'],
      enum: {
        values: ['car', 'moto', 'bike'],
        message: '{VALUE} is not a valid spot type',
      },
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
      default: 'available',
    },
    hardwareId: {
      type: String,
      default: null,
      trim: true,
    },
    sensorStatus: {
      type: String,
      enum: ['online', 'offline', 'unknown'],
      default: 'unknown',
    },
    lastSensorUpdate: {
      type: Date,
      default: null,
    },
    sensorValue: {
      type: Number,
      default: null,
      min: 0,
      max: 400,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ─────────────────────────────────────────────────────────
parkingSpotSchema.index({ code: 1 });
parkingSpotSchema.index({ status: 1 });
parkingSpotSchema.index({ zone: 1, type: 1 });

module.exports = mongoose.model('ParkingSpot', parkingSpotSchema);

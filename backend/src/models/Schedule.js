const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    weekdayOpen: {
      type: String,
      required: [true, 'Weekday opening time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format (24h)'],
    },
    weekdayClose: {
      type: String,
      required: [true, 'Weekday closing time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format (24h)'],
    },
    sundayOpen: {
      type: String,
      required: [true, 'Sunday opening time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format (24h)'],
    },
    sundayClose: {
      type: String,
      required: [true, 'Sunday closing time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format (24h)'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Schedule', scheduleSchema);

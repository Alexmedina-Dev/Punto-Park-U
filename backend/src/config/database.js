const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`[database] MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[database] MongoDB connection error: ${error.message}`);
    // Don't crash — allow server to run without DB for development
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[database] MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`[database] MongoDB error: ${err.message}`);
});

module.exports = connectDB;

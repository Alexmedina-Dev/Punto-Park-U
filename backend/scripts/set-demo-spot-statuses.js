/**
 * Quick script to set realistic parking spot statuses for demo.
 * Run: node backend/scripts/set-demo-spot-statuses.js
 */
const mongoose = require('mongoose');
const ParkingSpot = require('../src/models/ParkingSpot');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const DEMO_STATUSES = [
  'available', 'available', 'available', 'available',
  'occupied', 'occupied',
  'reserved',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  if (!MONGO_URI) {
    console.error('ERROR: Set MONGODB_URI or MONGO_URI environment variable');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('[set-demo-statuses] Connected to MongoDB');

  const spots = await ParkingSpot.find();
  console.log(`[set-demo-statuses] Found ${spots.length} parking spots`);

  let updated = 0;
  for (const spot of spots) {
    const newStatus = randomItem(DEMO_STATUSES);
    await ParkingSpot.updateOne({ _id: spot._id }, { status: newStatus });
    console.log(`  ${spot.code}: ${spot.status} → ${newStatus}`);
    updated++;
  }

  console.log(`[set-demo-statuses] Done — updated ${updated} spots`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[set-demo-statuses] Error:', err.message);
  process.exit(1);
});

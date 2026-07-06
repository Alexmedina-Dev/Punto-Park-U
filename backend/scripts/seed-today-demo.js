/**
 * Seed realistic TODAY data for the admin parking map and daily report.
 * Creates active/pending reservations for today and updates spot statuses.
 *
 * Run: node backend/scripts/seed-today-demo.js
 * Requires: MONGODB_URI env var
 */
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Vehicle = require('../src/models/Vehicle');
const ParkingSpot = require('../src/models/ParkingSpot');
const Reservation = require('../src/models/Reservation');
const Payment = require('../src/models/Payment');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Colombian plates format
const DEMO_PLATES = [
  { plate: 'ABC123', type: 'car', brand: 'Toyota', model: 'Corolla', color: 'Blanco' },
  { plate: 'DEF456', type: 'car', brand: 'Chevrolet', model: 'Spark', color: 'Gris' },
  { plate: 'GHI789', type: 'car', brand: 'Mazda', model: '3', color: 'Negro' },
  { plate: 'JKL012', type: 'car', brand: 'Hyundai', model: 'i10', color: 'Azul' },
  { plate: 'MNO345', type: 'car', brand: 'Kia', model: 'Picanto', color: 'Rojo' },
  { plate: 'PQR678', type: 'moto', brand: 'Yamaha', model: 'FZ', color: 'Negro' },
  { plate: 'STU901', type: 'moto', brand: 'Honda', model: 'CB190', color: 'Rojo' },
  { plate: 'VWX234', type: 'moto', brand: 'Suzuki', model: 'Gixxer', color: 'Azul' },
  { plate: 'YZA567', type: 'bike', brand: 'GW', model: 'MTB', color: 'Verde' },
  { plate: 'BCD890', type: 'car', brand: 'Nissan', model: 'Versa', color: 'Plata' },
  { plate: 'EFG123', type: 'car', brand: 'Renault', model: 'Logan', color: 'Blanco' },
  { plate: 'HIJ456', type: 'moto', brand: 'Bajaj', model: 'Pulsar', color: 'Negro' },
];

// Time slots for today (realistic parking times)
const TIME_SLOTS = [
  { start: '07:00', end: '12:00', status: 'active' },    // Morning - currently parked
  { start: '08:00', end: '14:00', status: 'active' },    // Half day
  { start: '09:00', end: '17:00', status: 'active' },    // Full day
  { start: '06:30', end: '10:00', status: 'completed' },  // Already left
  { start: '10:00', end: '15:00', status: 'active' },    // Mid-morning
  { start: '11:00', end: '18:00', status: 'active' },    // Late morning
  { start: '13:00', end: '17:00', status: 'pending' },   // Afternoon reservation
  { start: '14:00', end: '19:00', status: 'pending' },   // Late afternoon
  { start: '07:30', end: '13:00', status: 'active' },    // Early bird
  { start: '08:30', end: '16:00', status: 'active' },    // Standard
  { start: '09:30', end: '15:30', status: 'active' },    // Mid-morning
  { start: '07:00', end: '11:00', status: 'completed' },  // Early bird done
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount() {
  return Math.floor(Math.random() * 25000) + 5000; // $5,000 - $30,000 COP
}

async function main() {
  if (!MONGO_URI) {
    console.error('ERROR: Set MONGODB_URI or MONGO_URI environment variable');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('[seed-today] Connected to MongoDB');

  // ── Step 1: Get existing data ──────────────────────────────────
  const users = await User.find({ role: 'user' }).limit(5);
  if (users.length === 0) {
    console.error('[seed-today] No users found. Run seeder first: node src/utils/seeder.js --demo');
    process.exit(1);
  }
  console.log(`[seed-today] Found ${users.length} users`);

  const spots = await ParkingSpot.find().sort({ code: 1 });
  if (spots.length === 0) {
    console.error('[seed-today] No parking spots found. Run seeder first.');
    process.exit(1);
  }
  console.log(`[seed-today] Found ${spots.length} parking spots`);

  // ── Step 2: Create or find vehicles ────────────────────────────
  const vehicles = [];
  for (const vData of DEMO_PLATES) {
    let vehicle = await Vehicle.findOne({ plate: vData.plate });
    if (!vehicle) {
      // Assign to a random user
      const owner = randomItem(users);
      vehicle = await Vehicle.create({
        plate: vData.plate,
        type: vData.type,
        brand: vData.brand,
        model: vData.model,
        color: vData.color,
        owner: owner._id,
        isActive: true,
      });
      console.log(`[seed-today] Vehicle created: ${vData.plate} (${vData.type})`);
    }
    vehicles.push(vehicle);
  }

  // ── Step 3: Remove old today reservations (idempotent) ─────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const oldTodayReservations = await Reservation.find({
    date: { $gte: today, $lt: tomorrow },
  });
  if (oldTodayReservations.length > 0) {
    // Reset spots for old reservations
    for (const r of oldTodayReservations) {
      if (r.spot) {
        await ParkingSpot.updateOne({ _id: r.spot }, { status: 'available' });
      }
    }
    await Reservation.deleteMany({
      date: { $gte: today, $lt: tomorrow },
    });
    console.log(`[seed-today] Removed ${oldTodayReservations.length} old today reservations`);
  }

  // ── Step 4: Create realistic today reservations ────────────────
  // Pick spots for active/reserved (spread across zones)
  const carSpots = spots.filter((s) => s.zone === 'A');
  const motoSpots = spots.filter((s) => s.zone === 'B');
  const bikeSpots = spots.filter((s) => s.zone === 'C');

  // Select spots to occupy (realistic: ~60% of spots in use)
  const spotsToOccupy = [
    ...carSpots.slice(0, 12),   // 12 of 20 car spots
    ...motoSpots.slice(0, 8),   // 8 of 20 moto spots
    ...bikeSpots.slice(0, 4),   // 4 of 10 bike spots
  ];

  const reservations = [];
  for (let i = 0; i < spotsToOccupy.length; i++) {
    const spot = spotsToOccupy[i];
    const slot = TIME_SLOTS[i % TIME_SLOTS.length];
    const user = randomItem(users);

    // Find a vehicle that matches the spot type
    const matchingVehicles = vehicles.filter((v) => {
      if (spot.zone === 'A') return v.type === 'car';
      if (spot.zone === 'B') return v.type === 'moto';
      return v.type === 'bike';
    });
    const vehicle = matchingVehicles.length > 0 ? randomItem(matchingVehicles) : randomItem(vehicles);

    const [startH, startM] = slot.start.split(':').map(Number);
    const [endH, endM] = slot.end.split(':').map(Number);

    const entryTime = new Date(today);
    entryTime.setHours(startH, startM, 0, 0);

    const exitTime = slot.status === 'completed' ? new Date(today) : null;
    if (exitTime) {
      exitTime.setHours(endH, endM, 0, 0);
    }

    const reservation = await Reservation.create({
      user: user._id,
      vehicle: vehicle._id,
      spot: spot._id,
      date: today,
      startTime: slot.start,
      endTime: slot.end,
      entryTime,
      exitTime,
      status: slot.status,
      notes: `Reserva del día - Demo`,
    });

    // Update spot status
    const spotStatus = slot.status === 'active' ? 'occupied'
      : slot.status === 'pending' ? 'reserved'
      : 'available';
    await ParkingSpot.updateOne({ _id: spot._id }, { status: spotStatus });

    // Create payment for active/completed reservations
    if (slot.status !== 'pending') {
      const paymentStatus = slot.status === 'completed' ? 'completed' : 'pending';
      await Payment.create({
        user: user._id,
        vehicle: vehicle._id,
        reservation: reservation._id,
        amount: randomAmount(),
        method: randomItem(['cash', 'pos', 'epayco']),
        status: paymentStatus,
        date: today,
      });
    }

    reservations.push(reservation);
    console.log(`[seed-today] Reservation: ${user.email} → ${spot.code} (${slot.start}-${slot.end}) [${slot.status}]`);
  }

  // ── Step 5: Summary ────────────────────────────────────────────
  const spotStatuses = await ParkingSpot.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  console.log('\n[seed-today] ═══════════════════════════════════════');
  console.log('[seed-today] Summary:');
  console.log(`  Reservations created: ${reservations.length}`);
  console.log(`  Active: ${reservations.filter((r) => r.status === 'active').length}`);
  console.log(`  Pending: ${reservations.filter((r) => r.status === 'pending').length}`);
  console.log(`  Completed: ${reservations.filter((r) => r.status === 'completed').length}`);
  console.log('\n  Spot statuses:');
  for (const s of spotStatuses) {
    console.log(`    ${s._id}: ${s.count}`);
  }
  console.log('[seed-today] ═══════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('[seed-today] Done!');
}

main().catch((err) => {
  console.error('[seed-today] Error:', err.message);
  process.exit(1);
});

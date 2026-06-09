/**
 * Database seeder — creates default admin user, tariffs, and schedule.
 *
 * Usage:
 *   node src/utils/seeder.js        # seed data
 *   node src/utils/seeder.js --down  # remove seeded data
 */

const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Tariff = require('../models/Tariff');
const Schedule = require('../models/Schedule');

// ── Default seed data ────────────────────────────────────────────────

const defaultAdmin = {
  name: 'Admin Principal',
  email: 'admin@puntoparku.com',
  username: 'admin',
  cedula: '0000000000',
  password: 'admin1234',
  role: 'admin',
  phone: '3000000000',
};

const defaultUser = {
  nombres: 'Juan',
  apellidos: 'Pérez',
  email: 'juan@puntoparku.com',
  username: 'juan',
  cedula: '1234567890',
  password: 'juan1234',
  role: 'user',
  phone: '3101234567',
  isEmailVerified: true,
};

const defaultTariffs = [
  { vehicleType: 'car',  hourlyRate: 3000,  dailyRate: 18000, monthlyRate: 180000 },
  { vehicleType: 'moto', hourlyRate: 1500,  dailyRate: 9000,  monthlyRate: 90000 },
  { vehicleType: 'suv',  hourlyRate: 4000,  dailyRate: 24000, monthlyRate: 240000 },
  { vehicleType: 'bike', hourlyRate: 800,   dailyRate: 4800,  monthlyRate: 48000 },
];

const defaultSchedule = {
  weekdayOpen: '06:00',
  weekdayClose: '22:00',
  sundayOpen: '08:00',
  sundayClose: '20:00',
};

// ── Seed ──────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[seeder] Connected to MongoDB');

    // Admin user
    const existingAdmin = await User.findOne({ email: defaultAdmin.email });
    if (existingAdmin) {
      console.log('[seeder] Admin user already exists, skipping');
    } else {
      await User.create(defaultAdmin);
      console.log('[seeder] Admin user created (admin@puntoparku.com / admin1234)');
    }

    // Default user
    const existingUser = await User.findOne({ email: defaultUser.email });
    if (existingUser) {
      console.log('[seeder] Default user already exists, skipping');
    } else {
      await User.create(defaultUser);
      console.log('[seeder] Default user created (juan@puntoparku.com / juan1234)');
    }

    // Tariffs
    for (const tariff of defaultTariffs) {
      const existing = await Tariff.findOne({ vehicleType: tariff.vehicleType });
      if (existing) {
        console.log(`[seeder] Tariff for ${tariff.vehicleType} already exists, skipping`);
      } else {
        await Tariff.create(tariff);
        console.log(`[seeder] Tariff created for ${tariff.vehicleType}`);
      }
    }

    // Schedule
    const existingSchedule = await Schedule.findOne({});
    if (existingSchedule) {
      console.log('[seeder] Schedule already exists, skipping');
    } else {
      await Schedule.create(defaultSchedule);
      console.log('[seeder] Default schedule created');
    }

    console.log('[seeder] Seed complete');
    process.exit(0);
  } catch (err) {
    console.error(`[seeder] Error: ${err.message}`);
    process.exit(1);
  }
};

// ── Down (remove seeded data) ────────────────────────────────────────

const down = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[seeder] Connected to MongoDB');

    await User.deleteMany({ email: { $in: [defaultAdmin.email, defaultUser.email] } });
    console.log('[seeder] Admin and default user removed');

    await Tariff.deleteMany({});
    console.log('[seeder] All tariffs removed');

    await Schedule.deleteMany({});
    console.log('[seeder] Schedule removed');

    console.log('[seeder] Seed removal complete');
    process.exit(0);
  } catch (err) {
    console.error(`[seeder] Error: ${err.message}`);
    process.exit(1);
  }
};

// ── Run ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.includes('--down')) {
  down();
} else {
  seed();
}

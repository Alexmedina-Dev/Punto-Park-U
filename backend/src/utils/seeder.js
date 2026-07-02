/**
 * Database seeder — creates default admin user, tariffs, and schedule.
 *
 * Usage:
 *   node src/utils/seeder.js          # seed base data
 *   node src/utils/seeder.js --demo   # seed base + demo data
 *   node src/utils/seeder.js --down   # remove base seeded data
 *   node src/utils/seeder.js --demo --down  # remove demo data only
 */

const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/User');
const Tariff = require('../models/Tariff');
const Schedule = require('../models/Schedule');
const ParkingSpot = require('../models/ParkingSpot');
const Vehicle = require('../models/Vehicle');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const ActivityLog = require('../models/ActivityLog');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Ticket = require('../models/Ticket');

// ── Helpers ─────────────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomDateInRange(startDaysAgo, endDaysAgo) {
  const offset = randomInt(startDaysAgo, endDaysAgo);
  return daysAgo(offset);
}

function randomTime() {
  const h = String(randomInt(6, 21)).padStart(2, '0');
  const m = String(randomItem(['00', '15', '30', '45']));
  return `${h}:${m}`;
}

function addHours(date, hours) {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

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
  name: 'Juan Pérez',
  email: 'juan@puntoparku.com',
  username: 'juan',
  cedula: '1234567890',
  password: 'juan1234',
  role: 'user',
  phone: '3101234567',
  isVerified: true,
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

// ── Demo data generators ────────────────────────────────────────────

const DEMO_EMAILS = [
  'demo1@puntoparku.com',
  'demo2@puntoparku.com',
  'demo3@puntoparku.com',
];

const DEMO_PLATES = [
  'ABC123', 'DEF456', 'GHI789', 'JKL012', 'MNO345',
  'PQR678', 'STU901', 'VWX234', 'YZA567', 'BCD890',
];

const DEMO_BRANDS = [
  { brand: 'Chevrolet', model: 'Onix', color: 'Blanco' },
  { brand: 'Renault', model: 'Duster', color: 'Gris' },
  { brand: 'Toyota', model: 'Corolla', color: 'Negro' },
  { brand: 'Mazda', model: 'CX-5', color: 'Rojo' },
  { brand: 'Hyundai', model: 'Accent', color: 'Plata' },
  { brand: 'Suzuki', model: 'Swift', color: 'Azul' },
  { brand: 'Kawasaki', model: 'Ninja 400', color: 'Verde' },
  { brand: 'Honda', model: 'CBR 600', color: 'Negro' },
];

async function seedDemoUsers() {
  const users = [];
  for (let i = 0; i < DEMO_EMAILS.length; i++) {
    const existing = await User.findOne({ email: DEMO_EMAILS[i] });
    if (existing) {
      console.log(`[seeder] Demo user ${DEMO_EMAILS[i]} exists, skipping`);
      users.push(existing);
      continue;
    }
    const u = await User.create({
      name: `Demo User ${i + 1}`,
      email: DEMO_EMAILS[i],
      username: `demo${i + 1}`,
      cedula: `900000000${i}`,
      password: 'demo1234',
      role: 'user',
      phone: `310000000${i}`,
      isVerified: true,
    });
    console.log(`[seeder] Demo user created: ${DEMO_EMAILS[i]}`);
    users.push(u);
  }
  return users;
}

async function seedDemoSpots() {
  const existingCount = await ParkingSpot.countDocuments();
  if (existingCount >= 25) {
    console.log(`[seeder] ${existingCount} parking spots already exist, skipping spot generation`);
    return ParkingSpot.find().lean();
  }

  const spots = [];
  const types = ['car', 'car', 'car', 'moto', 'moto', 'bike'];
  const zones = ['A', 'B', 'C'];
  const statuses = ['available', 'available', 'available', 'occupied', 'reserved'];

  let code = 1;
  for (const zone of zones) {
    for (let i = 0; i < 10; i++) {
      const type = types[i % types.length];
      const spotCode = `${zone}${code}`;
      const existing = await ParkingSpot.findOne({ code: spotCode });
      if (existing) {
        console.log(`[seeder] Spot ${spotCode} exists, skipping`);
        spots.push(existing);
        code++;
        continue;
      }
      const spot = await ParkingSpot.create({
        code: spotCode,
        zone,
        type,
        status: randomItem(statuses),
      });
      console.log(`[seeder] Spot created: ${spotCode} (${type}, ${zone})`);
      spots.push(spot);
      code++;
    }
  }
  return spots;
}

async function seedDemoVehicles(users) {
  const vehicles = [];
  // Give first demo user several vehicles
  const owner = users[0];
  if (!owner) return vehicles;

  for (let i = 0; i < DEMO_PLATES.length; i++) {
    const existing = await Vehicle.findOne({ plate: DEMO_PLATES[i] });
    if (existing) {
      console.log(`[seeder] Vehicle ${DEMO_PLATES[i]} exists, skipping`);
      vehicles.push(existing);
      continue;
    }
    const info = DEMO_BRANDS[i % DEMO_BRANDS.length];
    const type = i < 7 ? 'car' : 'moto';
    const v = await Vehicle.create({
      plate: DEMO_PLATES[i],
      type,
      brand: info.brand,
      model: info.model,
      color: info.color,
      owner: owner._id,
      isActive: true,
    });
    console.log(`[seeder] Vehicle created: ${DEMO_PLATES[i]} (${type})`);
    vehicles.push(v);
  }
  return vehicles;
}

async function seedDemoReservations(users, vehicles, spots) {
  const reservations = [];
  const statuses = ['pending', 'active', 'completed', 'completed', 'completed', 'cancelled'];

  const count = randomInt(10, 15);
  for (let i = 0; i < count; i++) {
    const user = randomItem(users);
    const vehicle = randomItem(vehicles);
    const spot = randomItem(spots);
    const status = randomItem(statuses);
    const date = randomDateInRange(0, 29);
    const startTime = randomTime();
    const durationHrs = randomInt(1, 6);
    const entryTime = new Date(date);
    const [h, m] = startTime.split(':').map(Number);
    entryTime.setHours(h, m, 0, 0);
    const exitTime = status === 'completed' || status === 'cancelled'
      ? addHours(entryTime, durationHrs)
      : null;

    // Check for existing reservation (idempotent by user+date+startTime)
    const existing = await Reservation.findOne({
      user: user._id,
      date: { $gte: daysAgo(1), $lte: new Date() },
      startTime,
    });
    if (existing) {
      console.log(`[seeder] Reservation for ${user.email} at ${startTime} exists, skipping`);
      reservations.push(existing);
      continue;
    }

    const r = await Reservation.create({
      user: user._id,
      vehicle: vehicle._id,
      spot: spot._id || spot._id,
      date,
      startTime,
      endTime: (() => {
        const eh = (h + durationHrs) % 24;
        return `${String(eh).padStart(2, '0')}:${m}`;
      })(),
      entryTime,
      exitTime,
      status,
      notes: `Demo reservation #${i + 1}`,
    });
    console.log(`[seeder] Reservation created: ${status} for ${user.email} on ${date.toISOString().slice(0, 10)}`);
    reservations.push(r);
  }
  return reservations;
}

async function seedDemoPayments(users, vehicles, reservations) {
  const payments = [];
  const methods = ['cash', 'pos', 'epayco'];
  const pStatuses = ['completed', 'completed', 'completed', 'pending'];

  const count = randomInt(5, 10);
  for (let i = 0; i < count; i++) {
    const user = randomItem(users);
    const vehicle = randomItem(vehicles);
    const reservation = reservations[i] || null;
    const method = randomItem(methods);
    const status = randomItem(pStatuses);
    const amount = randomInt(5000, 35000);

    const existing = await Payment.findOne({
      user: user._id,
      date: { $gte: daysAgo(30), $lte: new Date() },
    });
    if (existing) {
      console.log(`[seeder] Payment for ${user.email} exists, skipping`);
      payments.push(existing);
      continue;
    }

    const p = await Payment.create({
      user: user._id,
      vehicle: vehicle._id,
      reservation: reservation?._id || null,
      amount,
      method,
      status,
      date: randomDateInRange(0, 29),
    });
    console.log(`[seeder] Payment created: $${amount} (${method}, ${status})`);
    payments.push(p);
  }
  return payments;
}

async function seedDemoActivityLogs(users) {
  const actions = [
    { action: 'vehicle_registered', type: 'vehicle' },
    { action: 'reservation_created', type: 'reservation' },
    { action: 'reservation_completed', type: 'reservation' },
    { action: 'payment_received', type: 'payment' },
    { action: 'tariff_updated', type: 'tariff' },
    { action: 'schedule_changed', type: 'schedule' },
    { action: 'user_login', type: 'user' },
    { action: 'vehicle_updated', type: 'vehicle' },
    { action: 'reservation_cancelled', type: 'reservation' },
  ];

  let created = 0;
  for (let i = 0; i < 30; i++) {
    const act = randomItem(actions);
    const user = randomItem(users);
    const existing = await ActivityLog.findOne({
      action: act.action,
      timestamp: { $gte: daysAgo(30), $lte: new Date() },
    });
    if (existing) continue;

    await ActivityLog.create({
      action: act.action,
      user: user._id,
      type: act.type,
      details: { demo: true, index: i },
      timestamp: randomDateInRange(0, 29),
    });
    created++;
  }
  console.log(`[seeder] ${created} activity logs created`);
}

async function seedDemoAlerts() {
  const types = ['system', 'occupancy', 'hardware', 'security'];
  const severities = ['info', 'warning', 'critical'];
  const messages = [
    'Zona A al 90% de ocupación',
    'Sensor A3 offline',
    'Intento de acceso no autorizado en zona B',
    'Backup de base de datos completado',
    'Barrier C2 timeout — retry en curso',
    'Nuevo pago pendiente de ePayco',
    'Usuario demo1@puntoparku.com verificado',
    'Carga de energía del sensor C1 baja',
  ];

  let created = 0;
  for (let i = 0; i < randomInt(5, 10); i++) {
    const existing = await Alert.findOne({ message: messages[i % messages.length] });
    if (existing) continue;

    await Alert.create({
      type: randomItem(types),
      message: messages[i % messages.length],
      severity: randomItem(severities),
      zone: randomItem(['A', 'B', 'C']),
      timestamp: randomDateInRange(0, 14),
      resolved: Math.random() > 0.5,
    });
    created++;
  }
  console.log(`[seeder] ${created} alerts created`);
}

async function seedDemoNotifications(users) {
  const types = ['reservation_reminder', 'payment_confirmed', 'entry_alert', 'exit_alert', 'system_alert'];
  const titles = [
    'Recordatorio de reserva',
    'Pago confirmado',
    'Ingreso registrado',
    'Salida registrada',
    'Aviso del sistema',
  ];
  const messages = [
    'Tu reserva es mañana a las 09:00',
    'Tu pago de $15.000 fue procesado',
    'Tu vehículo ingresó al parking',
    'Tu vehículo salió del parking',
    'Horario modificado este fin de semana',
  ];

  let created = 0;
  for (let i = 0; i < randomInt(10, 15); i++) {
    const user = randomItem(users);
    const idx = i % types.length;
    const existing = await Notification.findOne({
      user: user._id,
      title: titles[idx],
    });
    if (existing) continue;

    await Notification.create({
      user: user._id,
      type: types[idx],
      title: titles[idx],
      message: messages[idx],
      read: Math.random() > 0.4,
      data: { demo: true },
    });
    created++;
  }
  console.log(`[seeder] ${created} notifications created`);
}

async function seedDemoTickets(reservations) {
  let created = 0;
  for (const r of reservations) {
    if (!r._id) continue;
    const existing = await Ticket.findOne({ reservation: r._id });
    if (existing) continue;

    const qrData = `PPU-${r._id}-${Date.now()}`;
    const qrHash = `hmac-${Math.random().toString(36).slice(2, 14)}`;
    await Ticket.create({
      reservation: r._id,
      qrData,
      qrHash,
      validatedEntry: r.status === 'completed' || r.status === 'active',
      entryValidatedAt: r.status === 'completed' || r.status === 'active' ? r.entryTime : null,
      validatedExit: r.status === 'completed',
      exitValidatedAt: r.status === 'completed' ? r.exitTime : null,
    });
    created++;
  }
  console.log(`[seeder] ${created} tickets created`);
}

// ── Seed (base) ──────────────────────────────────────────────────────

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

    console.log('[seeder] Base seed complete');
    process.exit(0);
  } catch (err) {
    console.error(`[seeder] Error: ${err.message}`);
    process.exit(1);
  }
};

// ── Seed demo ───────────────────────────────────────────────────────

const seedDemo = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[seeder] Connected to MongoDB');

    // Base seed first
    const existingAdmin = await User.findOne({ email: defaultAdmin.email });
    if (!existingAdmin) await User.create(defaultAdmin);
    const existingUser = await User.findOne({ email: defaultUser.email });
    if (!existingUser) await User.create(defaultUser);
    for (const t of defaultTariffs) {
      const exists = await Tariff.findOne({ vehicleType: t.vehicleType });
      if (!exists) await Tariff.create(t);
    }
    const existsSchedule = await Schedule.findOne({});
    if (!existsSchedule) await Schedule.create(defaultSchedule);

    console.log('[seeder] Base seed verified');

    // Demo entities
    const demoUsers = await seedDemoUsers();
    const allUsers = [existingAdmin || await User.findOne({ email: defaultAdmin.email }), ...demoUsers];
    const spots = await seedDemoSpots();
    const vehicles = await seedDemoVehicles(demoUsers);
    const reservations = await seedDemoReservations(allUsers, vehicles, spots);
    await seedDemoPayments(allUsers, vehicles, reservations);
    await seedDemoActivityLogs(allUsers);
    await seedDemoAlerts();
    await seedDemoNotifications(allUsers);
    await seedDemoTickets(reservations);

    console.log('[seeder] Demo seed complete');
    process.exit(0);
  } catch (err) {
    console.error(`[seeder] Demo error: ${err.message}`);
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

// ── Down demo (remove demo data only) ────────────────────────────────

const downDemo = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('[seeder] Connected to MongoDB');

    const demoEmails = [...DEMO_EMAILS];
    const demoUsers = await User.find({ email: { $in: demoEmails } }).select('_id');
    const demoUserIds = demoUsers.map((u) => u._id);

    // Remove tickets linked to demo reservations
    const demoReservations = await Reservation.find({ user: { $in: demoUserIds } }).select('_id');
    const demoReservationIds = demoReservations.map((r) => r._id);
    await Ticket.deleteMany({ reservation: { $in: demoReservationIds } });
    console.log(`[seeder] ${demoReservationIds.length} demo tickets removed`);

    await Notification.deleteMany({ user: { $in: demoUserIds } });
    console.log('[seeder] Demo notifications removed');

    await Alert.deleteMany({ message: { $regex: /Zona|Sensor|Intento|Backup|Barrier|pago|verificado|carga/i } });
    console.log('[seeder] Demo alerts removed');

    await ActivityLog.deleteMany({ 'details.demo': true });
    console.log('[seeder] Demo activity logs removed');

    await Payment.deleteMany({ user: { $in: demoUserIds } });
    console.log('[seeder] Demo payments removed');

    await Reservation.deleteMany({ user: { $in: demoUserIds } });
    console.log('[seeder] Demo reservations removed');

    await Vehicle.deleteMany({ owner: { $in: demoUserIds } });
    console.log('[seeder] Demo vehicles removed');

    await ParkingSpot.deleteMany({});
    console.log('[seeder] All parking spots removed');

    await User.deleteMany({ email: { $in: demoEmails } });
    console.log('[seeder] Demo users removed');

    console.log('[seeder] Demo data removal complete');
    process.exit(0);
  } catch (err) {
    console.error(`[seeder] Demo down error: ${err.message}`);
    process.exit(1);
  }
};

// ── Run ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
if (args.includes('--demo') && args.includes('--down')) {
  downDemo();
} else if (args.includes('--down')) {
  down();
} else if (args.includes('--demo')) {
  seedDemo();
} else {
  seed();
}

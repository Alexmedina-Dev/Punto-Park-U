const Tariff = require('../models/Tariff');
const Schedule = require('../models/Schedule');
const ParkingSpot = require('../models/ParkingSpot');
const Reservation = require('../models/Reservation');

// ── Default data ──────────────────────────────────────────────────────

const DEFAULT_TARIFFS = {
  car: { hour: 3000, day: 25000, month: 500000 },
  moto: { hour: 1500, day: 12000, month: 300000 },
  camioneta: { hour: 4000, day: 30000, month: 400000 },
  bike: { hour: 1000, day: 8000, month: 200000 },
};

const DEFAULT_SCHEDULE = {
  weekday: { open: '07:00', close: '19:00' },
  sunday: { open: '09:00', close: '17:00' },
};

const DEFAULT_SPOT_COUNTS = { car: 20, moto: 20, bike: 10 };

// ── Helpers ───────────────────────────────────────────────────────────

const STATUS_MAP = {
  available: 'libre',
  occupied: 'ocupado',
  reserved: 'reservado',
};

/**
 * Deterministic demo overlay — makes the parking lot always look active.
 * Uses the numeric part of the spot code for exact counts.
 * Zone-aware thresholds:
 *   A (carros, 20 spots): 13 non-libre → 7 libre
 *   B (motos, 20 spots):  11 non-libre → 9 libre
 *   C (bikes, 10 spots):  7 non-libre → 3 libre
 *   D (camionetas, 5):    2 non-libre → 3 libre
 * Real reservations take priority over this overlay.
 */
function getDemoOverlayStatus(code, zone) {
  if (!code) return null;
  const num = parseInt(code.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num)) return null;

  const occupiedCounts = { A: 9, B: 7, C: 5, D: 1 };
  const reservedCounts = { A: 4, B: 4, C: 2, D: 1 };

  const occ = occupiedCounts[zone] || 0;
  const res = reservedCounts[zone] || 0;

  if (num <= occ) return 'ocupado';
  if (num <= occ + res) return 'reservado';
  return null;
}

/**
 * Fake vehicle data for demo overlay spots.
 * Deterministic per spot code — same vehicle always appears on the same spot.
 */
function getDemoVehicle(code, zone) {
  if (!code) return null;

  const CAR_BRANDS = [
    { brand: 'Toyota', model: 'Corolla', color: 'Blanco' },
    { brand: 'Chevrolet', model: 'Spark GT', color: 'Gris' },
    { brand: 'Mazda', model: 'Mazda3', color: 'Negro' },
    { brand: 'Hyundai', model: 'Accent', color: 'Plata' },
    { brand: 'Kia', model: 'Picanto', color: 'Rojo' },
    { brand: 'Nissan', model: 'Versa', color: 'Azul' },
    { brand: 'Renault', model: 'Logan', color: 'Blanco' },
    { brand: 'Suzuki', model: 'Swift', color: 'Verde' },
    { brand: 'Ford', model: 'Fiesta', color: 'Negro' },
    { brand: 'Volkswagen', model: 'Gol', color: 'Plata' },
  ];
  const MOTO_BRANDS = [
    { brand: 'Yamaha', model: 'FZ 2.0', color: 'Negro' },
    { brand: 'Honda', model: 'CB190R', color: 'Rojo' },
    { brand: 'Suzuki', model: 'Gixxer', color: 'Azul' },
    { brand: 'Bajaj', model: 'Pulsar NS200', color: 'Negro' },
    { brand: 'TVS', model: 'Apache RTR', color: 'Rojo' },
    { brand: 'Yamaha', model: 'MT-03', color: 'Azul' },
    { brand: 'Honda', model: 'CRF 150L', color: 'Rojo' },
  ];
  const BIKE_BRANDS = [
    { brand: 'GW', model: 'Mountain Pro', color: 'Negro' },
    { brand: 'Scott', model: 'Aspect 920', color: 'Azul' },
    { brand: 'Trek', model: 'Marlin 7', color: 'Rojo' },
    { brand: 'GT', model: 'Aggressor 3', color: 'Verde' },
    { brand: 'Specialized', model: 'Rockhopper', color: 'Negro' },
  ];
  const CAMIONETA_BRANDS = [
    { brand: 'Chevrolet', model: 'D-Max', color: 'Blanco' },
    { brand: 'Mitsubishi', model: 'L200', color: 'Negro' },
    { brand: 'Toyota', model: 'Hilux', color: 'Plata' },
    { brand: 'Ford', model: 'Ranger', color: 'Azul' },
  ];

  const brands = zone === 'A' ? CAR_BRANDS : zone === 'B' ? MOTO_BRANDS : zone === 'C' ? BIKE_BRANDS : CAMIONETA_BRANDS;
  const num = parseInt(code.replace(/[^0-9]/g, ''), 10) || 1;

  // Colombian plate formats: ABC123 (car), ABC12D (moto), AB1234 (older)
  const letters = ['ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQR', 'STU', 'VWX', 'BCD', 'EFG'];
  const plateNum = ((num * 7 + 123) % 999) + 1;
  let plate;
  if (zone === 'B') {
    plate = `${letters[num % letters.length]}${plateNum}${String.fromCharCode(65 + (num % 26))}`;
  } else if (zone === 'C') {
    plate = `${letters[num % letters.length].slice(0, 2)}${String.fromCharCode(65 + (num % 26))}${plateNum}`;
  } else {
    plate = `${letters[num % letters.length]}${plateNum}`;
  }

  const v = brands[(num - 1) % brands.length];
  return { plate, brand: v.brand, model: v.model, color: v.color };
}

/**
 * Generate default parking spots when DB is empty.
 * Distributes: Zone A (7 car, 7 moto, 3 bike), B (7, 7, 3), C (6, 6, 4)
 */
function generateDefaultSpots() {
  const config = [
    ...Array(7).fill({ zone: 'A', type: 'car' }),
    ...Array(7).fill({ zone: 'A', type: 'moto' }),
    ...Array(3).fill({ zone: 'A', type: 'bike' }),
    ...Array(7).fill({ zone: 'B', type: 'car' }),
    ...Array(7).fill({ zone: 'B', type: 'moto' }),
    ...Array(3).fill({ zone: 'B', type: 'bike' }),
    ...Array(6).fill({ zone: 'C', type: 'car' }),
    ...Array(6).fill({ zone: 'C', type: 'moto' }),
    ...Array(4).fill({ zone: 'C', type: 'bike' }),
  ];

  const zoneCounts = { A: 0, B: 0, C: 0 };

  return config.map((cfg) => {
    zoneCounts[cfg.zone]++;
    return {
      id: `${cfg.zone}${zoneCounts[cfg.zone]}`,
      zone: cfg.zone,
      type: cfg.type,
      status: 'libre',
    };
  });
}

// ── GET /api/public/tariffs ───────────────────────────────────────────

const getTariffs = async (req, res, next) => {
  try {
    const tariffs = await Tariff.find().lean();

    if (tariffs.length === 0) {
      return res.json({ success: true, data: DEFAULT_TARIFFS });
    }

    // Transform DB documents to frontend PricingConfig format
    const data = {
      car: { hour: 0, day: 0, month: 0 },
      moto: { hour: 0, day: 0, month: 0 },
      camioneta: { hour: 0, day: 0, month: 0 },
      bike: { hour: 0, day: 0, month: 0 },
    };

    for (const t of tariffs) {
      if (data[t.vehicleType]) {
        data[t.vehicleType] = {
          hour: t.hourlyRate,
          day: t.dailyRate,
          month: t.monthlyRate,
        };
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/public/schedule ──────────────────────────────────────────

const getSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne().lean();

    if (!schedule) {
      return res.json({ success: true, data: DEFAULT_SCHEDULE });
    }

    const data = {
      weekday: { open: schedule.weekdayOpen, close: schedule.weekdayClose },
      sunday: { open: schedule.sundayOpen, close: schedule.sundayClose },
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/public/availability ──────────────────────────────────────

const getAvailability = async (req, res, next) => {
  try {
    const spots = await ParkingSpot.find().lean();

    if (spots.length === 0) {
      return res.json({
        success: true,
        data: {
          spots: generateDefaultSpots(),
          stats: {
            cars: { used: 0, total: DEFAULT_SPOT_COUNTS.car },
            motos: { used: 0, total: DEFAULT_SPOT_COUNTS.moto },
            bikes: { used: 0, total: DEFAULT_SPOT_COUNTS.bike },
          },
        },
      });
    }

    // Aggregate stats by type and status
    const stats = {
      cars: { used: 0, total: 0 },
      motos: { used: 0, total: 0 },
      bikes: { used: 0, total: 0 },
    };

    const mappedSpots = spots.map((s) => {
      // Map DB type to stats key: 'car' → 'cars', 'moto' → 'motos', 'bike' → 'bikes'
      const typeKey = s.type === 'car' ? 'cars' : s.type === 'moto' ? 'motos' : s.type === 'bike' ? 'bikes' : s.type;
      // Determine effective status: real DB status or demo overlay
      const dbStatus = STATUS_MAP[s.status] || s.status;
      const demoStatus = getDemoOverlayStatus(s.code, s.zone);
      const effectiveStatus = dbStatus === 'libre' && demoStatus ? demoStatus : dbStatus;
      const isUsed = effectiveStatus === 'ocupado' || effectiveStatus === 'reservado';

      if (stats[typeKey]) {
        stats[typeKey].total++;
        if (isUsed) {
          stats[typeKey].used++;
        }
      }

      return {
        id: s.code,
        zone: s.zone,
        status: effectiveStatus,
      };
    });

    res.json({
      success: true,
      data: {
        spots: mappedSpots,
        stats,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/public/spots ─────────────────────────────────────────────

const getParkingSpots = async (req, res, next) => {
  try {
    const { zone, type, date, startTime, endTime } = req.query;

    // Build filter from query params
    const filter = {};
    if (zone) filter.zone = zone.toUpperCase();
    if (type) filter.type = type.toLowerCase();

    const spots = await ParkingSpot.find(filter).lean();

    // If DB is empty and no filters active, return defaults
    if (spots.length === 0 && !req.query.zone && !req.query.type) {
      return res.json({ success: true, data: generateDefaultSpots() });
    }

    // Filter out spots with overlapping reservations if date/time provided
    let excludedSpotIds = new Set();
    if (date && startTime && endTime) {
      const requestDate = new Date(date);
      const dayStart = new Date(requestDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(requestDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Find active/pending reservations that overlap the requested window
      const overlapping = await Reservation.find({
        status: { $in: ['pending', 'active'] },
        spot: { $ne: null },
        $or: [
          // Reservation has date + time fields (new format)
          {
            date: { $gte: dayStart, $lte: dayEnd },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
          // Fallback: reservation uses entryTime/exitTime (legacy format)
          {
            entryTime: { $lte: dayEnd },
            $or: [
              { exitTime: { $gte: dayStart } },
              { exitTime: null },
            ],
          },
        ],
      }).select('spot').lean();

      excludedSpotIds = new Set(overlapping.map((r) => r.spot?.toString()).filter(Boolean));
    }

    const data = spots.map((s) => {
      // Real reservation status takes priority
      if (excludedSpotIds.has(s._id.toString())) {
        return {
          id: s._id.toString(),
          code: s.code,
          zone: s.zone,
          type: s.type,
          floor: s.floor || null,
          accessible: s.accessible || false,
          status: 'reservado',
        };
      }
      // Otherwise: DB status or demo overlay
      const dbStatus = STATUS_MAP[s.status] || s.status;
      const demoStatus = getDemoOverlayStatus(s.code, s.zone);
      const effectiveStatus = dbStatus === 'libre' && demoStatus ? demoStatus : dbStatus;
      return {
        id: s._id.toString(),
        code: s.code,
        zone: s.zone,
        type: s.type,
        floor: s.floor || null,
        accessible: s.accessible || false,
        status: effectiveStatus,
      };
    });

    // Enrich occupied/reserved spots with vehicle data from active reservations
    const occupiedSpotIds = data
      .filter((s) => s.status === 'ocupado' || s.status === 'reservado')
      .map((s) => s.id);

    if (occupiedSpotIds.length > 0) {
      const activeReservations = await Reservation.find({
        spot: { $in: occupiedSpotIds },
        status: { $in: ['pending', 'active'] },
      })
        .populate('vehicle', 'plate brand model color type')
        .select('spot vehicle')
        .lean();

      const spotVehicleMap = {};
      for (const r of activeReservations) {
        const spotId = r.spot?.toString();
        if (spotId && r.vehicle) {
          spotVehicleMap[spotId] = {
            plate: r.vehicle.plate,
            brand: r.vehicle.brand,
            model: r.vehicle.model,
            color: r.vehicle.color,
            type: r.vehicle.type,
          };
        }
      }

      for (const spot of data) {
        if (spotVehicleMap[spot.id]) {
          spot.vehicle = spotVehicleMap[spot.id];
        }
      }
    }

    // Add fake vehicle data for demo overlay spots that don't have real reservations
    for (const spot of data) {
      if ((spot.status === 'ocupado' || spot.status === 'reservado') && !spot.vehicle) {
        const fakeVehicle = getDemoVehicle(spot.code, spot.zone);
        if (fakeVehicle) spot.vehicle = fakeVehicle;
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTariffs, getSchedule, getAvailability, getParkingSpots };

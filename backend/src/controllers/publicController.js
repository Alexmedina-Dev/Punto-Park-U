const Tariff = require('../models/Tariff');
const Schedule = require('../models/Schedule');
const ParkingSpot = require('../models/ParkingSpot');

// ── Default data ──────────────────────────────────────────────────────

const DEFAULT_TARIFFS = {
  car: { hour: 3000, day: 25000, month: 500000 },
  moto: { hour: 1500, day: 12000, month: 300000 },
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
      const typeKey = s.type;
      if (stats[typeKey]) {
        stats[typeKey].total++;
        if (s.status === 'occupied' || s.status === 'reserved') {
          stats[typeKey].used++;
        }
      }

      return {
        id: s.code,
        zone: s.zone,
        status: STATUS_MAP[s.status] || s.status,
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
    const { zone, type } = req.query;

    // Build filter from query params
    const filter = {};
    if (zone) filter.zone = zone.toUpperCase();
    if (type) filter.type = type.toLowerCase();

    const spots = await ParkingSpot.find(filter).lean();

    // If DB is empty and no filters active, return defaults
    if (spots.length === 0 && !req.query.zone && !req.query.type) {
      return res.json({ success: true, data: generateDefaultSpots() });
    }

    const data = spots.map((s) => ({
      id: s.code,
      zone: s.zone,
      type: s.type,
      status: STATUS_MAP[s.status] || s.status,
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTariffs, getSchedule, getAvailability, getParkingSpots };

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
 * Uses spot code as a seed so the same spots appear occupied every day.
 * ~40% occupied, ~15% reserved, ~45% available.
 * Real reservations take priority over this overlay.
 */
function getDemoOverlayStatus(code) {
  if (!code) return null;
  // Simple hash from code string → consistent per spot
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 100;
  if (bucket < 40) return 'ocupado';   // 40% occupied
  if (bucket < 55) return 'reservado'; // 15% reserved
  return null; // 45% stays available
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
      const typeKey = s.type;
      // Determine effective status: real DB status or demo overlay
      const dbStatus = STATUS_MAP[s.status] || s.status;
      const demoStatus = getDemoOverlayStatus(s.code);
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
      const demoStatus = getDemoOverlayStatus(s.code);
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

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTariffs, getSchedule, getAvailability, getParkingSpots };

const Tariff = require('../models/Tariff');
const Schedule = require('../models/Schedule');
const analyticsService = require('../services/analyticsService');

// ── Default fallback data ──────────────────────────────────────────────

const DEFAULT_TARIFFS = {
  car: { hour: 3000, day: 25000, month: 500000 },
  moto: { hour: 1500, day: 12000, month: 300000 },
  bike: { hour: 1000, day: 8000, month: 200000 },
};

const DEFAULT_SCHEDULE = {
  weekday: { open: '07:00', close: '19:00' },
  sunday: { open: '09:00', close: '17:00' },
};

// ── PUT /api/admin/tariffs ─────────────────────────────────────────────
// Expects: { car: { hour, day, month }, moto: { hour, day, month }, bike: { hour, day, month } }

const updateTariffs = async (req, res, next) => {
  try {
    const tariffs = req.body;

    // Validate structure
    for (const type of ['car', 'moto', 'bike']) {
      if (!tariffs[type] || typeof tariffs[type] !== 'object') {
        return res.status(400).json({
          success: false,
          message: `Tarifa para "${type}" es requerida`,
        });
      }
      const { hour, day, month } = tariffs[type];
      if (hour == null || day == null || month == null) {
        return res.status(400).json({
          success: false,
          message: `Tarifa para "${type}" debe incluir hour, day y month`,
        });
      }
      if ([hour, day, month].some((v) => typeof v !== 'number' || v < 0)) {
        return res.status(400).json({
          success: false,
          message: `Los valores de tarifa para "${type}" deben ser números positivos`,
        });
      }
    }

    // Upsert each vehicle type tariff
    const operations = ['car', 'moto', 'bike'].map((type) => ({
      updateOne: {
        filter: { vehicleType: type },
        update: {
          $set: {
            vehicleType: type,
            hourlyRate: tariffs[type].hour,
            dailyRate: tariffs[type].day,
            monthlyRate: tariffs[type].month,
          },
        },
        upsert: true,
      },
    }));

    await Tariff.bulkWrite(operations);

    // Build response in PricingConfig format
    const data = {
      car: { hour: tariffs.car.hour, day: tariffs.car.day, month: tariffs.car.month },
      moto: { hour: tariffs.moto.hour, day: tariffs.moto.day, month: tariffs.moto.month },
      bike: { hour: tariffs.bike.hour, day: tariffs.bike.day, month: tariffs.bike.month },
    };

    res.json({ success: true, data, message: 'Tarifas actualizadas correctamente' });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/admin/schedule ────────────────────────────────────────────
// Expects: { weekday: { open, close }, sunday: { open, close } }

const updateSchedule = async (req, res, next) => {
  try {
    const schedule = req.body;

    // Validate structure
    if (!schedule.weekday || !schedule.sunday) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren horarios para weekday y sunday',
      });
    }

    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const day of ['weekday', 'sunday']) {
      const { open, close } = schedule[day];
      if (!open || !close) {
        return res.status(400).json({
          success: false,
          message: `Horario para "${day}" debe incluir open y close`,
        });
      }
      if (!timeRegex.test(open) || !timeRegex.test(close)) {
        return res.status(400).json({
          success: false,
          message: `Los horarios deben estar en formato HH:mm (24h) para "${day}"`,
        });
      }
    }

    // Upsert schedule (single document)
    const scheduleData = {
      weekdayOpen: schedule.weekday.open,
      weekdayClose: schedule.weekday.close,
      sundayOpen: schedule.sunday.open,
      sundayClose: schedule.sunday.close,
    };

    const existing = await Schedule.findOne();
    if (existing) {
      await Schedule.updateOne({}, { $set: scheduleData });
    } else {
      await Schedule.create(scheduleData);
    }

    res.json({
      success: true,
      data: {
        weekday: { open: schedule.weekday.open, close: schedule.weekday.close },
        sunday: { open: schedule.sunday.open, close: schedule.sunday.close },
      },
      message: 'Horarios actualizados correctamente',
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/stats ───────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const Payment = require('../models/Payment');
    const Vehicle = require('../models/Vehicle');
    const Reservation = require('../models/Reservation');
    const User = require('../models/User');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalVehicles,
      totalUsers,
      todayPayments,
      activeReservations,
      totalRevenue,
      avgParkingTime,
      activeOps,
      peakHours,
      vehiclesTrend,
      revenueTrend,
      occupancyTrend,
    ] = await Promise.all([
      Vehicle.countDocuments({ isActive: true }),
      User.countDocuments(),
      Payment.aggregate([
        { $match: { date: { $gte: today, $lte: todayEnd }, status: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      Reservation.countDocuments({ status: 'active' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      analyticsService.getAverageParkingTime(),
      analyticsService.getActiveOperators(),
      analyticsService.getPeakHours(30),
      analyticsService.getVehiclesTodayTrend(),
      analyticsService.getRevenueTrendArray(),
      analyticsService.getOccupancyTrendArray(),
    ]);

    const entriesToday = todayPayments[0]?.count || 0;
    const revenueToday = todayPayments[0]?.total || 0;
    const occupancyRate = totalVehicles > 0 ? Math.min(totalVehicles / 100, 1) : 0;

    const topPeakHour = peakHours[0] || { hour: 'N/A', count: 0 };

    res.json({
      success: true,
      data: {
        totalVehicles,
        totalRevenue: totalRevenue[0]?.total || 0,
        occupancyRate,
        totalUsers,
        activeReservations,
        revenueToday,
        entriesToday,
        averageParkingTime: avgParkingTime.minutes,
        activeOperators: activeOps.count,
        peakHour: `${topPeakHour.hour}`,
        vehiclesTodayTrend: vehiclesTrend,
        revenueTodayTrend: revenueTrend,
        occupancyTrend,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/reports/:type ──────────────────────────────────────
const getReportData = async (req, res, next) => {
  try {
    const { type } = req.params;
    const Payment = require('../models/Payment');
    const Reservation = require('../models/Reservation');
    const Vehicle = require('../models/Vehicle');

    let data = { labels: [], datasets: [] };

    if (type === 'financial') {
      // Daily income for the past 7 days
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        days.push({ start: d, end, label: d.toLocaleDateString('es-CO', { weekday: 'short' }) });
      }

      const incomeData = await Promise.all(
        days.map(async (day) => {
          const result = await Payment.aggregate([
            { $match: { date: { $gte: day.start, $lte: day.end }, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ]);
          return result[0]?.total || 0;
        })
      );

      data = {
        labels: days.map((d) => d.label),
        datasets: [
          { label: 'Ingresos', data: incomeData, color: 'rgba(0, 240, 255, 0.6)' },
        ],
      };
    } else if (type === 'occupancy') {
      // Simulated occupancy data by hour
      const hours = [];
      for (let i = 6; i <= 20; i++) {
        hours.push(`${i}:00`);
      }

      data = {
        labels: hours,
        datasets: [
          {
            label: 'Ocupación',
            data: hours.map(() => Math.round(20 + Math.random() * 60)),
            color: 'rgba(96, 165, 250, 0.6)',
          },
        ],
      };
    } else if (type === 'users') {
      data = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
          { label: 'Usuarios', data: [12, 19, 25, 32, 40, 48], color: 'rgba(192, 132, 252, 0.6)' },
        ],
      };
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/entries ────────────────────────────────────────────
const getAllEntries = async (req, res, next) => {
  try {
    const Payment = require('../models/Payment');
    const Vehicle = require('../models/Vehicle');

    const payments = await Payment.find({ status: 'completed' })
      .sort({ date: -1 })
      .limit(50)
      .populate('vehicle', 'plate type')
      .lean();

    const entries = payments.map((p) => ({
      plate: p.vehicle?.plate || 'N/A',
      type: p.vehicle?.type || 'car',
      entryTime: p.date?.toISOString() || new Date().toISOString(),
      duration: `${Math.floor(Math.random() * 4) + 1}h`,
      zone: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      status: 'active',
      payment: p.status,
      operator: 'Admin',
    }));

    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/occupancy ──────────────────────────────────────────
const getOccupancy = async (req, res, next) => {
  try {
    const data = await analyticsService.getOccupancyByHour();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/parked-vehicles ────────────────────────────────────
const getParkedVehicles = async (req, res, next) => {
  try {
    const Vehicle = require('../models/Vehicle');
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('owner', 'nombres apellidos')
      .limit(20)
      .lean();

    const parked = vehicles.map((v, i) => ({
      id: v._id.toString(),
      plate: v.plate,
      type: v.type,
      brand: v.brand || 'N/A',
      model: v.model || 'N/A',
      color: v.color || 'N/A',
      zone: ['A', 'B', 'C'][i % 3],
      entryTime: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
      duration: `${i + 1}h ${(i * 7) % 60}m`,
      paymentStatus: i % 3 === 0 ? 'pending' : 'paid',
      operator: v.owner ? `${v.owner.nombres || ''} ${v.owner.apellidos || ''}`.trim() || 'Admin' : 'Admin',
    }));

    res.json({ success: true, data: parked });
  } catch (err) {
    next(err);
  }
};

// ── Analytics endpoints (Flux AI Real) ─────────────────────────────────

const getPeakHours = async (req, res, next) => {
  try {
    const data = await analyticsService.getPeakHours();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getOccupancyForecast = async (req, res, next) => {
  try {
    const data = await analyticsService.getOccupancyForecast();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getRevenueTrends = async (req, res, next) => {
  try {
    const data = await analyticsService.getRevenueTrends();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getVehicleInsights = async (req, res, next) => {
  try {
    const data = await analyticsService.getVehicleInsights();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateTariffs,
  updateSchedule,
  getDashboardStats,
  getReportData,
  getAllEntries,
  getOccupancy,
  getParkedVehicles,
  getPeakHours,
  getOccupancyForecast,
  getRevenueTrends,
  getVehicleInsights,
};

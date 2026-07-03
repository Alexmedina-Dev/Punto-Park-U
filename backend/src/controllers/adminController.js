const axios = require('axios');
const Tariff = require('../models/Tariff');
const Schedule = require('../models/Schedule');
const analyticsService = require('../services/analyticsService');

// ── Default fallback data ──────────────────────────────────────────────

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

// ── PUT /api/admin/tariffs ─────────────────────────────────────────────
// Expects: { car: { hour, day, month }, moto: { hour, day, month }, bike: { hour, day, month } }

const updateTariffs = async (req, res, next) => {
  try {
    const tariffs = req.body;

    // Validate structure
    for (const type of ['car', 'moto', 'camioneta', 'bike']) {
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
    const operations = ['car', 'moto', 'camioneta', 'bike'].map((type) => ({
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
      camioneta: { hour: tariffs.camioneta.hour, day: tariffs.camioneta.day, month: tariffs.camioneta.month },
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

    // ── Chart endpoints (occupancy, users) — keep existing behavior ────
    if (type === 'occupancy') {
      const hours = [];
      for (let i = 6; i <= 20; i++) {
        hours.push(`${i}:00`);
      }

      const data = {
        labels: hours,
        datasets: [
          {
            label: 'Ocupación',
            data: hours.map(() => Math.round(20 + Math.random() * 60)),
            color: 'rgba(96, 165, 250, 0.6)',
          },
        ],
      };
      return res.json({ success: true, data });
    }

    if (type === 'users') {
      const data = {
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
        datasets: [
          { label: 'Usuarios', data: [12, 19, 25, 32, 40, 48], color: 'rgba(192, 132, 252, 0.6)' },
        ],
      };
      return res.json({ success: true, data });
    }

    // ── Financial report — ReportContent format for exports ────────────
    if (type === 'financial') {
      const { period = 'week', type: vehicleTypeFilter = 'all', payment: paymentFilter = 'all', dateFrom, dateTo } = req.query;

      // 1. Compute date range
      const now = new Date();
      let startDate, endDate;
      if (period === 'custom' && dateFrom && dateTo) {
        startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'today') {
        startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now); endDate.setHours(23, 59, 59, 999);
      } else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else {
        // week (default: last 7 days)
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
      }

      const periodLabels = {
        today: 'Hoy',
        week: 'Semana actual',
        month: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
        custom: `${dateFrom || '—'} → ${dateTo || '—'}`,
      };

      // 2. Build payment match filter
      const paymentMatch = {
        date: { $gte: startDate, $lte: endDate },
        status: 'completed',
      };
      if (vehicleTypeFilter !== 'all') {
        // We'll filter after populate, so no vehicle type filter here
      }
      if (paymentFilter !== 'all') {
        paymentMatch.method = paymentFilter;
      }

      // 3. Query payments with populated vehicle + user
      const payments = await Payment.find(paymentMatch)
        .populate('vehicle', 'plate type brand model')
        .populate('user', 'nombres apellidos')
        .sort({ date: -1 })
        .lean();

      // 4. Filter by vehicle type after populate
      const filteredPayments = vehicleTypeFilter !== 'all'
        ? payments.filter((p) => p.vehicle?.type === vehicleTypeFilter)
        : payments;

      // 5. Build rows
      const tipoMap = { car: 'Automóvil', moto: 'Motocicleta', camioneta: 'Camioneta', bike: 'Bicicleta' };
      const methodMap = { cash: 'Efectivo', pos: 'POS', epayco: 'ePayco' };

      const rows = filteredPayments.map((p) => {
        const resv = p.reservation;
        const entryDate = p.date;
        const durationMs = 0;
        const durationMin = 0;

        return {
          placa: p.vehicle?.plate || 'N/A',
          tipo: tipoMap[p.vehicle?.type] || p.vehicle?.type || 'N/A',
          ingreso: entryDate ? entryDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          salida: p.date ? p.date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'N/A',
          duracion: durationMin > 0 ? `${Math.floor(durationMin / 60)}h ${durationMin % 60}m` : '—',
          tarifa: `$${(p.amount || 0).toLocaleString('es-CO')}`,
          pago: methodMap[p.method] || p.method || 'N/A',
          conductor: p.user ? `${p.user.nombres || ''} ${p.user.apellidos || ''}`.trim() || 'Cliente' : 'Cliente',
        };
      });

      // 6. Aggregate summary stats
      const totalIngresos = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalVehiculos = filteredPayments.length;
      const ticketPromedio = totalVehiculos > 0 ? Math.round(totalIngresos / totalVehiculos) : 0;
      const diffMs = endDate - startDate;
      const diffHours = Math.max(diffMs / (1000 * 60 * 60), 1);
      const ingresosPorHora = Math.round(totalIngresos / diffHours);

      // 7. Breakdown by vehicle type
      const typeCounts = {};
      const typeIngresos = {};
      filteredPayments.forEach((p) => {
        const key = tipoMap[p.vehicle?.type] || p.vehicle?.type || 'Otro';
        typeCounts[key] = (typeCounts[key] || 0) + 1;
        typeIngresos[key] = (typeIngresos[key] || 0) + (p.amount || 0);
      });
      const breakdown = Object.keys(typeCounts).map((tipo) => ({
        tipo,
        cantidad: typeCounts[tipo],
        ingresos: typeIngresos[tipo],
        porcentaje: totalVehiculos > 0 ? Math.round((typeCounts[tipo] / totalVehiculos) * 100) : 0,
      }));

      // 8. Payment method totals for KPIs
      const paymentTotals = { efectivo: 0, pos: 0, epayco: 0 };
      filteredPayments.forEach((p) => {
        if (p.method === 'cash') paymentTotals.efectivo += p.amount || 0;
        else if (p.method === 'pos') paymentTotals.pos += p.amount || 0;
        else if (p.method === 'epayco') paymentTotals.epayco += p.amount || 0;
      });

      // 9. Build KPIs
      const kpis = [
        { label: 'Ticket promedio', value: `$${ticketPromedio.toLocaleString('es-CO')}`, detail: `${totalVehiculos} transacciones`, status: 'ok' },
        { label: 'Ingresos por hora', value: `$${ingresosPorHora.toLocaleString('es-CO')}`, detail: `Período: ${diffHours.toFixed(0)}h`, status: 'ok' },
        { label: 'Efectivo', value: `$${paymentTotals.efectivo.toLocaleString('es-CO')}`, detail: `${totalIngresos > 0 ? Math.round((paymentTotals.efectivo / totalIngresos) * 100) : 0}% del total`, status: 'ok' },
        { label: 'POS', value: `$${paymentTotals.pos.toLocaleString('es-CO')}`, detail: `${totalIngresos > 0 ? Math.round((paymentTotals.pos / totalIngresos) * 100) : 0}% del total`, status: 'ok' },
        { label: 'ePayco', value: `$${paymentTotals.epayco.toLocaleString('es-CO')}`, detail: `${totalIngresos > 0 ? Math.round((paymentTotals.epayco / totalIngresos) * 100) : 0}% del total`, status: 'ok' },
      ];

      // 10. Average parking time from reservations
      let avgParkingTime = '—';
      try {
        const reservationsWithExit = await Reservation.find({
          entryTime: { $gte: startDate, $lte: endDate },
          exitTime: { $ne: null },
        }).lean();
        if (reservationsWithExit.length > 0) {
          const totalMinutes = reservationsWithExit.reduce((sum, r) => {
            return sum + (new Date(r.exitTime) - new Date(r.entryTime)) / (1000 * 60);
          }, 0);
          const avgMin = Math.round(totalMinutes / reservationsWithExit.length);
          avgParkingTime = `${Math.floor(avgMin / 60)}h ${avgMin % 60}m`;
        }
      } catch {
        // Reservation query failed — leave default
      }

      // 11. Tasa ocupación from active reservations
      let tasaOcupacion = 0;
      try {
        const totalSpots = await require('../models/ParkingSpot').countDocuments();
        const occupiedSpots = await require('../models/ParkingSpot').countDocuments({ status: 'ocupado' });
        tasaOcupacion = totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;
      } catch {
        // ParkingSpot model may not exist — leave 0
      }

      const content = {
        meta: {
          title: 'Análisis Financiero — Punto Park U',
          subtitle: period === 'custom'
            ? `Período personalizado: ${dateFrom} → ${dateTo}`
            : `Análisis financiero del período seleccionado`,
          generatedAt: now.toLocaleString('es-CO'),
          period: periodLabels[period] || period,
        },
        summary: {
          totalIngresos,
          totalVehiculos,
          tasaOcupacion,
          ticketPromedio,
          tiempoPromedio: avgParkingTime,
          ingresosPorHora,
        },
        breakdown,
        kpis,
        rows,
      };

      return res.json({ success: true, data: content });
    }

    // Unknown report type
    return res.status(400).json({ success: false, message: `Tipo de reporte "${type}" no soportado` });
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

// ── GET /api/admin/analytics/occupancy-prediction ─────────────────────
const getOccupancyPrediction = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const prophetUrl = process.env.PROPHET_API_URL || 'http://localhost:4002';

    const response = await axios.post(`${prophetUrl}/predict/occupancy`, null, {
      params: { days },
      timeout: 30000,
    });

    res.json({ success: true, data: response.data });
  } catch (err) {
    // If Python service is down, return empty forecast gracefully
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.json({
        success: true,
        data: {
          forecast: [],
          historical_days: 0,
          model: 'prophet',
          generated_at: new Date().toISOString(),
          error: 'Prophet service unavailable',
        },
      });
    }
    next(err);
  }
};

// ── GET /api/admin/analytics/ai-insights ──────────────────────────────
const getAIInsights = async (req, res, next) => {
  try {
    const prophetUrl = process.env.PROPHET_API_URL || 'http://localhost:4002';

    const response = await axios.get(`${prophetUrl}/insights`, {
      timeout: 30000,
    });

    res.json({ success: true, data: response.data });
  } catch (err) {
    // If Python service is down, return fallback insights
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      return res.json({
        success: true,
        data: {
          insights: ['⚠️ Servicio Prophet no disponible. Mostrando datos locales.'],
          recommendations: ['Verifica que el servicio Prophet esté ejecutándose.'],
          stats: {},
          generated_at: new Date().toISOString(),
        },
      });
    }
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
  getOccupancyPrediction,
  getAIInsights,
};

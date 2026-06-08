const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');
const Vehicle = require('../models/Vehicle');
const ParkingSpot = require('../models/ParkingSpot');
const ActivityLog = require('../models/ActivityLog');

/**
 * Analítica predictiva - servicio de agregaciones MongoDB para el dashboard
 * Módulo 3: Analítica Predictiva (Flux AI v2.0) - Implementación MVP con Node.js
 */

// ── Peak Hours: top 3 horas pico basadas en entradas reales ─────────────

async function getPeakHours(days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const data = await Reservation.aggregate([
    { $match: { status: 'active', entryTime: { $gte: since } } },
    { $group: {
        _id: { $hour: '$entryTime' },
        count: { $sum: 1 },
        avgDuration: { $avg: { $subtract: ['$exitTime', '$entryTime'] } }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 3 },
    { $project: {
        hour: '$_id',
        count: 1,
        avgDuration: { $round: [{ $divide: ['$avgDuration', 60000] }, 0] }
      }
    }
  ]);

  return data.map(d => ({
    hour: `${String(d.hour).padStart(2, '0')}:00`,
    count: d.count,
    avgDuration: `${d.avgDuration}m`
  }));
}

// ── Occupancy Forecast: media móvil de los últimos 7 días ──────────────

async function getOccupancyForecast(hours = 24) {
  const days = 7;
  const since = new Date(Date.now() - days * 86400000);

  // Datos históricos por hora
  const historical = await Reservation.aggregate([
    { $match: { status: 'active', entryTime: { $gte: since } } },
    { $group: {
        _id: { $hour: '$entryTime' },
        avgCount: { $avg: { $sum: 1 } },
        totalCount: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Generar predicción para las próximas 24h
  const now = new Date();
  const forecast = [];
  for (let i = 0; i < hours; i++) {
    const futureHour = (now.getHours() + i) % 24;
    const historicalData = historical.find(h => h._id === futureHour);
    const baseValue = historicalData?.avgCount || 0;
    const trend = historicalData?.totalCount / days || 0;
    forecast.push({
      hour: `${String(futureHour).padStart(2, '0')}:00`,
      predicted: Math.round(baseValue + trend * 0.3),
      confidence: historicalData ? 'high' : 'low'
    });
  }

  return forecast;
}

// ── Revenue Trends: tendencias reales de ingresos ──────────────────────

async function getRevenueTrends() {
  const now = new Date();
  const periods = [7, 30, 90];

  const trends = await Promise.all(
    periods.map(async (days) => {
      const since = new Date(now.getTime() - days * 86400000);
      const result = await Payment.aggregate([
        { $match: { status: 'completed', date: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);

      const prevSince = new Date(since.getTime() - days * 86400000);
      const prevResult = await Payment.aggregate([
        { $match: { status: 'completed', date: { $gte: prevSince, $lt: since } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const current = result[0]?.total || 0;
      const previous = prevResult[0]?.total || 0;
      const growth = previous > 0 ? ((current - previous) / previous * 100).toFixed(1) : 0;

      return {
        days,
        total: current,
        count: result[0]?.count || 0,
        growth: parseFloat(growth),
        previousTotal: previous
      };
    })
  );

  return trends;
}

// ── Vehicle Insights: análisis por tipo de vehículo ────────────────────

async function getVehicleInsights() {
  const insights = await Vehicle.aggregate([
    { $match: { isActive: true } },
    { $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgEntryCount: { $avg: '$entryCount' },
        topBrands: { $addToSet: '$brand' }
      }
    },
    { $project: {
        type: '$_id',
        count: 1,
        avgEntryCount: { $round: ['$avgEntryCount', 1] },
        topBrands: { $slice: ['$topBrands', 3] }
      }
    }
  ]);

  // Tiempo promedio de estacionamiento por tipo
  const avgTime = await Reservation.aggregate([
    { $match: { status: 'completed', exitTime: { $exists: true } } },
    { $lookup: {
        from: 'vehicles',
        localField: 'vehicle',
        foreignField: '_id',
        as: 'vehicleData'
      }
    },
    { $unwind: '$vehicleData' },
    { $group: {
        _id: '$vehicleData.type',
        avgDuration: { $avg: { $subtract: ['$exitTime', '$entryTime'] } },
        count: { $sum: 1 }
      }
    },
    { $project: {
        type: '$_id',
        avgDurationMinutes: { $round: [{ $divide: ['$avgDuration', 60000] }, 0] },
        count: 1
      }
    }
  ]);

  return { insights, avgTime };
}

// ── Average Parking Time: tiempo real promedio ───────────────────────

async function getAverageParkingTime() {
  const result = await Reservation.aggregate([
    { $match: { status: 'completed', exitTime: { $exists: true } } },
    { $group: {
        _id: null,
        avgDuration: { $avg: { $subtract: ['$exitTime', '$entryTime'] } },
        count: { $sum: 1 }
      }
    }
  ]);

  if (!result[0]) return { minutes: 0, count: 0 };

  return {
    minutes: Math.round(result[0].avgDuration / 60000),
    count: result[0].count
  };
}

// ── Occupancy by Hour Today: datos reales de hoy ──────────────────────

async function getOccupancyByHour() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const data = await Reservation.aggregate([
    { $match: { status: 'active', entryTime: { $gte: today, $lte: todayEnd } } },
    { $group: {
        _id: { $hour: '$entryTime' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const totalSpots = await ParkingSpot.countDocuments();
  const hours = [];
  for (let i = 6; i <= 20; i++) {
    const hourData = data.find(d => d._id === i);
    hours.push({
      hour: `${i}:00`,
      count: hourData?.count || 0,
      capacity: totalSpots,
      occupancy: totalSpots > 0 ? Math.round((hourData?.count || 0) / totalSpots * 100) : 0
    });
  }

  return hours;
}

// ── Active Operators: contar operadores reales ───────────────────────

async function getActiveOperators() {
  const count = await ActivityLog.distinct('user', {
    type: 'user',
    action: { $in: ['login', 'entry', 'exit'] },
    timestamp: { $gte: new Date(Date.now() - 86400000) }
  });

  return {
    count: count.length,
    isActive: count.length > 0
  };
}

// ── Revenue Trend Array: datos para gráficos ────────────────────────

async function getRevenueTrendArray() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    const result = await Payment.aggregate([
      { $match: { status: 'completed', date: { $gte: d, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    days.push(result[0]?.total || 0);
  }

  return days;
}

// ── Occupancy Trend Array: datos para gráficos ───────────────────────

async function getOccupancyTrendArray() {
  const days = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    const count = await Reservation.countDocuments({
      status: 'active',
      entryTime: { $gte: d, $lte: end }
    });

    const totalSpots = await ParkingSpot.countDocuments();
    const rate = totalSpots > 0 ? Math.round((count / totalSpots) * 100) : 0;
    days.push(rate);
  }

  return days;
}

// ── Vehicles Today Trend: tendencia real de vehículos hoy ───────────

async function getVehiclesTodayTrend() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const hours = [];
  for (let i = 6; i <= 18; i++) {
    const start = new Date(today);
    start.setHours(i, 0, 0, 0);
    const end = new Date(start);
    end.setHours(i + 1, 0, 0, 0);

    const count = await Reservation.countDocuments({
      entryTime: { $gte: start, $lte: end }
    });

    hours.push(count);
  }

  return hours;
}

module.exports = {
  getPeakHours,
  getOccupancyForecast,
  getRevenueTrends,
  getVehicleInsights,
  getAverageParkingTime,
  getOccupancyByHour,
  getActiveOperators,
  getRevenueTrendArray,
  getOccupancyTrendArray,
  getVehiclesTodayTrend,
};

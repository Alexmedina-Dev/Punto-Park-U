const Payment = require('../models/Payment');
const Reservation = require('../models/Reservation');
const ParkingSpot = require('../models/ParkingSpot');
const Alert = require('../models/Alert');
const ActivityLog = require('../models/ActivityLog');

/**
 * Detección de anomalías — Módulo 3: Analítica Predictiva (Flux AI v2.0)
 * Usa z-score simple: |z| > 2.5 = anomalía
 */

// ── Calcular z-score ───────────────────────────────────────────────────

function calculateZScore(value, mean, stdDev) {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

// ── Calcular media y desviación estándar ───────────────────────────────

function calculateStats(values) {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return { mean, stdDev };
}

// ── Payment Anomaly Detection ──────────────────────────────────────────

async function detectPaymentAnomalies() {
  const anomalies = [];

  // 1. Usuarios con múltiples pagos fallidos
  const failedPayments = await Payment.aggregate([
    { $match: { status: 'failed', date: { $gte: new Date(Date.now() - 24 * 3600000) } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
    { $match: { count: { $gte: 3 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  for (const user of failedPayments) {
    anomalies.push({
      type: 'payment_anomaly',
      severity: 'warning',
      message: `Usuario con ${user.count} pagos fallidos en 24h`,
      details: { userId: user._id, count: user.count },
      score: Math.min(user.count * 2, 10)
    });
  }

  // 2. Montos inusuales (z-score > 2.5)
  const last7Days = await Payment.find({
    status: 'completed',
    date: { $gte: new Date(Date.now() - 7 * 86400000) }
  }).select('amount').lean();

  const amounts = last7Days.map(p => p.amount);
  const { mean, stdDev } = calculateStats(amounts);

  const todayPayments = await Payment.find({
    status: 'completed',
    date: { $gte: new Date(Date.now() - 86400000) }
  }).select('amount user').lean();

  for (const payment of todayPayments) {
    const zScore = calculateZScore(payment.amount, mean, stdDev);
    if (Math.abs(zScore) > 2.5) {
      anomalies.push({
        type: 'payment_anomaly',
        severity: zScore > 3 ? 'critical' : 'warning',
        message: `Monto inusual: $${payment.amount.toLocaleString('es-CO')} (z-score: ${zScore.toFixed(2)})`,
        details: { userId: payment.user, amount: payment.amount, zScore, mean, stdDev },
        score: Math.abs(zScore)
      });
    }
  }

  return anomalies;
}

// ── Occupancy Anomaly Detection ────────────────────────────────────────

async function detectOccupancyAnomalies() {
  const anomalies = [];

  // Datos históricos por hora (últimos 30 días)
  const historical = await Reservation.aggregate([
    { $match: { status: 'active', entryTime: { $gte: new Date(Date.now() - 30 * 86400000) } } },
    { $group: {
        _id: { $hour: '$entryTime' },
        counts: { $push: { $literal: 1 } }
      }
    }
  ]);

  // Ocupación actual
  const totalSpots = await ParkingSpot.countDocuments();
  const currentOccupancy = await Reservation.countDocuments({ status: 'active' });
  const currentRate = totalSpots > 0 ? (currentOccupancy / totalSpots) * 100 : 0;

  const currentHour = new Date().getHours();
  const hourData = historical.find(h => h._id === currentHour);

  if (hourData && hourData.counts.length > 5) {
    const { mean, stdDev } = calculateStats(hourData.counts);
    const zScore = calculateZScore(currentOccupancy, mean, stdDev);

    if (Math.abs(zScore) > 2.5) {
      anomalies.push({
        type: 'occupancy_anomaly',
        severity: zScore > 0 ? 'warning' : 'critical',
        message: zScore > 0
          ? `Ocupación alta inusual: ${currentRate.toFixed(1)}% (z-score: ${zScore.toFixed(2)})`
          : `Ocupación baja inusual: ${currentRate.toFixed(1)}% (z-score: ${zScore.toFixed(2)})`,
        details: { currentRate, zScore, mean, stdDev, hour: currentHour },
        score: Math.abs(zScore)
      });
    }
  }

  return anomalies;
}

// ── Reservation Anomaly Detection ──────────────────────────────────────

async function detectReservationAnomalies() {
  const anomalies = [];

  // 1. No-shows (reservas activas sin salida después de 2h)
  const noShows = await Reservation.find({
    status: 'active',
    entryTime: { $lte: new Date(Date.now() - 2 * 3600000) },
    exitTime: null
  }).populate('user', 'nombres apellidos').lean();

  for (const res of noShows) {
    anomalies.push({
      type: 'reservation_anomaly',
      severity: 'warning',
      message: `No-show: reserva activa desde ${res.entryTime.toLocaleTimeString('es-CO')}`,
      details: { reservationId: res._id, userId: res.user, entryTime: res.entryTime },
      score: 5
    });
  }

  // 2. Cancelaciones repetidas (más de 3 en 24h)
  const cancellations = await Reservation.aggregate([
    { $match: { status: 'cancelled', updatedAt: { $gte: new Date(Date.now() - 24 * 3600000) } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
    { $match: { count: { $gte: 3 } } }
  ]);

  for (const user of cancellations) {
    anomalies.push({
      type: 'reservation_anomaly',
      severity: 'warning',
      message: `Usuario con ${user.count} cancelaciones en 24h`,
      details: { userId: user._id, count: user.count },
      score: user.count * 1.5
    });
  }

  return anomalies;
}

// ── Main Detection Runner ─────────────────────────────────────────────

async function runAnomalyDetection() {
  console.log('🔍 Running anomaly detection...');

  const allAnomalies = [
    ...await detectPaymentAnomalies(),
    ...await detectOccupancyAnomalies(),
    ...await detectReservationAnomalies()
  ];

  // Crear alertas en la base de datos
  for (const anomaly of allAnomalies) {
    // Verificar si ya existe alerta similar no resuelta
    const existing = await Alert.findOne({
      type: anomaly.type,
      'details.userId': anomaly.details?.userId,
      resolved: false,
      createdAt: { $gte: new Date(Date.now() - 3600000) } // 1h
    });

    if (!existing) {
      await Alert.create({
        type: anomaly.type,
        message: anomaly.message,
        severity: anomaly.severity,
        details: anomaly.details,
        score: anomaly.score,
        resolved: false,
        timestamp: new Date()
      });

      // Log activity
      await ActivityLog.create({
        action: 'anomaly_detected',
        type: anomaly.type,
        details: { message: anomaly.message, score: anomaly.score },
        timestamp: new Date()
      });
    }
  }

  console.log(`✅ Anomaly detection complete: ${allAnomalies.length} anomalies found`);
  return allAnomalies;
}

// ── Get Anomaly Stats ────────────────────────────────────────────────

async function getAnomalyStats(days = 7) {
  const since = new Date(Date.now() - days * 86400000);

  const stats = await Alert.aggregate([
    { $match: { timestamp: { $gte: since } } },
    { $group: {
        _id: { type: '$type', severity: '$severity' },
        count: { $sum: 1 },
        avgScore: { $avg: '$score' }
      }
    }
  ]);

  const byType = {};
  const bySeverity = { critical: 0, warning: 0, info: 0 };

  for (const stat of stats) {
    const key = `${stat._id.type}_${stat._id.severity}`;
    byType[key] = stat.count;
    bySeverity[stat._id.severity] += stat.count;
  }

  return {
    total: stats.reduce((a, b) => a + b.count, 0),
    byType,
    bySeverity,
    criticalCount: bySeverity.critical,
    warningCount: bySeverity.warning,
    infoCount: bySeverity.info
  };
}

module.exports = {
  detectPaymentAnomalies,
  detectOccupancyAnomalies,
  detectReservationAnomalies,
  runAnomalyDetection,
  getAnomalyStats,
  calculateZScore,
  calculateStats
};

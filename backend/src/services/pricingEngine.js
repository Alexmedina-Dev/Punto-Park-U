const Tariff = require('../models/Tariff');
const Reservation = require('../models/Reservation');
const ParkingSpot = require('../models/ParkingSpot');
const Payment = require('../models/Payment');
const DynamicPricing = require('../models/DynamicPricing');

/**
 * Motor de Precios Dinámicos — Módulo 3: Analítica Predictiva (Flux AI v2.0)
 * Ajusta precios basado en demanda histórica y ocupación actual
 */

// ── Tier Configuration ─────────────────────────────────────────────────

const TIERS = {
  low: { multiplier: 0.9, label: 'Baja demanda', discount: 10 },
  normal: { multiplier: 1.0, label: 'Demanda normal', discount: 0 },
  high: { multiplier: 1.2, label: 'Alta demanda', surcharge: 20 },
  peak: { multiplier: 1.3, label: 'Pico de demanda', surcharge: 30 },
};

// ── Calculate Demand Level ───────────────────────────────────────────

async function calculateDemandLevel(hour = new Date().getHours()) {
  // 1. Ocupación actual vs total
  const totalSpots = await ParkingSpot.countDocuments();
  const currentOccupancy = await Reservation.countDocuments({ status: 'active' });
  const occupancyRate = totalSpots > 0 ? currentOccupancy / totalSpots : 0;

  // 2. Ocupación histórica promedio para esta hora (últimos 30 días)
  const since = new Date(Date.now() - 30 * 86400000);
  const historical = await Reservation.aggregate([
    { $match: { status: 'active', entryTime: { $gte: since } } },
    { $group: { _id: { $hour: '$entryTime' }, count: { $sum: 1 } } },
    { $match: { _id: hour } }
  ]);

  const historicalAvg = historical[0]?.count / 30 || 0;

  // 3. Pagos recientes (última hora)
  const recentPayments = await Payment.countDocuments({
    status: 'completed',
    date: { $gte: new Date(Date.now() - 3600000) }
  });

  // 4. Calcular score de demanda (0-100)
  let demandScore = 0;
  demandScore += occupancyRate * 40; // 40% peso
  demandScore += Math.min(recentPayments / 10, 1) * 30; // 30% peso
  demandScore += Math.min(historicalAvg / 5, 1) * 30; // 30% peso

  // Determinar tier
  if (demandScore >= 80) return 'peak';
  if (demandScore >= 60) return 'high';
  if (demandScore >= 30) return 'normal';
  return 'low';
}

// ── Get Current Pricing ────────────────────────────────────────────────

async function getCurrentPricing(vehicleType = 'car') {
  const tariff = await Tariff.findOne({ vehicleType }).lean();
  if (!tariff) return null;

  const tier = await calculateDemandLevel();
  const tierConfig = TIERS[tier];

  const base = {
    hour: tariff.hourlyRate,
    day: tariff.dailyRate,
    month: tariff.monthlyRate,
  };

  return {
    base,
    current: {
      hour: Math.round(base.hour * tierConfig.multiplier),
      day: Math.round(base.day * tierConfig.multiplier),
      month: Math.round(base.month * tierConfig.multiplier),
    },
    tier,
    tierConfig,
    multiplier: tierConfig.multiplier,
  };
}

// ── Get Pricing Forecast ─────────────────────────────────────────────

async function getPricingForecast(vehicleType = 'car') {
  const tariff = await Tariff.findOne({ vehicleType }).lean();
  if (!tariff) return [];

  const forecast = [];
  const now = new Date();

  for (let i = 0; i < 24; i++) {
    const hour = (now.getHours() + i) % 24;
    const tier = await calculateDemandLevel(hour);
    const tierConfig = TIERS[tier];

    forecast.push({
      hour: `${String(hour).padStart(2, '0')}:00`,
      tier,
      price: Math.round(tariff.hourlyRate * tierConfig.multiplier),
      label: tierConfig.label,
    });
  }

  return forecast;
}

// ── Smart Spot Assignment ────────────────────────────────────────────

async function getOptimalSpotAssignment(reservationId) {
  const reservation = await Reservation.findById(reservationId)
    .populate('vehicle', 'type plate')
    .lean();

  if (!reservation) return null;

  const vehicleType = reservation.vehicle?.type || 'car';

  // 1. Encontrar spots disponibles del tipo correcto
  const availableSpots = await ParkingSpot.find({
    type: vehicleType,
    status: 'available'
  }).lean();

  if (availableSpots.length === 0) return null;

  // 2. Calcular score para cada spot
  const scored = await Promise.all(
    availableSpots.map(async (spot) => {
      let score = 0;

      // Preferir spots con entrada cercana (menos caminar)
      score += 30; // base score

      // Preferir zonas con menos ocupación (más tranquilo)
      const zoneOccupancy = await Reservation.countDocuments({
        status: 'active',
        spot: { $in: await ParkingSpot.find({ zone: spot.zone }).select('_id') }
      });
      score += Math.max(0, 20 - zoneOccupancy);

      // Preferir spots que históricamente tienen estadías cortas (más rotación)
      const avgDuration = await Reservation.aggregate([
        { $match: { spot: spot._id, status: 'completed', exitTime: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: { $subtract: ['$exitTime', '$entryTime'] } } } }
      ]);

      const avgMinutes = avgDuration[0]?.avg / 60000 || 0;
      score += Math.max(0, 15 - avgMinutes / 60); // Premiar estadías cortas

      return { spot, score };
    })
  );

  // 3. Ordenar por score
  scored.sort((a, b) => b.score - a.score);

  return {
    recommended: scored[0]?.spot,
    alternatives: scored.slice(1, 4).map(s => s.spot),
    scores: scored.slice(0, 5).map(s => ({
      spot: s.spot,
      score: s.score
    }))
  };
}

// ── Update Dynamic Pricing Settings ────────────────────────────────────

async function updateDynamicPricingSettings(enabled, rules = {}) {
  const settings = await DynamicPricing.findOneAndUpdate(
    {},
    {
      enabled,
      rules: {
        lowThreshold: rules.lowThreshold || 30,
        highThreshold: rules.highThreshold || 60,
        peakThreshold: rules.peakThreshold || 80,
        ...rules
      },
      updatedAt: new Date()
    },
    { upsert: true, new: true }
  );

  return settings;
}

// ── Get Pricing Stats ──────────────────────────────────────────────

async function getPricingStats() {
  const settings = await DynamicPricing.findOne().lean();
  const currentTier = await calculateDemandLevel();
  const currentPricing = await getCurrentPricing();

  const revenueToday = await Payment.aggregate([
    { $match: { status: 'completed', date: { $gte: new Date(Date.now() - 86400000) } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const revenueYesterday = await Payment.aggregate([
    { $match: { status: 'completed', date: { $gte: new Date(Date.now() - 2 * 86400000), $lt: new Date(Date.now() - 86400000) } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const today = revenueToday[0]?.total || 0;
  const yesterday = revenueYesterday[0]?.total || 0;
  const change = yesterday > 0 ? ((today - yesterday) / yesterday * 100).toFixed(1) : 0;

  return {
    enabled: settings?.enabled || false,
    currentTier,
    currentMultiplier: TIERS[currentTier].multiplier,
    currentPricing: currentPricing?.current,
    revenueToday: today,
    revenueYesterday: yesterday,
    change: parseFloat(change),
    tiers: TIERS
  };
}

module.exports = {
  calculateDemandLevel,
  getCurrentPricing,
  getPricingForecast,
  getOptimalSpotAssignment,
  updateDynamicPricingSettings,
  getPricingStats,
  TIERS,
};

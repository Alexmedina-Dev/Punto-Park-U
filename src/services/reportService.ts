import api from './api'
import type { ApiResponse, ReportFilters, ReportContent, DailyIncome, OccupancyByType, PaymentMethodStat, PricingConfig } from '@/types'

// ── Demo data generators (seeded by filter combination) ───────────────

function getSeed(filters: ReportFilters): number {
  let seed = filters.period.charCodeAt(0)
  if (filters.type !== 'all') seed += filters.type.charCodeAt(0) * 17
  if (filters.payment !== 'all') seed += filters.payment.charCodeAt(0) * 31
  return seed
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function getPeriodMultiplier(period: string): number {
  switch (period) {
    case 'today': return 1
    case 'week': return 7
    case 'month': return 30
    case 'custom': return 15 // default for custom
    default: return 7
  }
}

const VEHICLE_TYPES = [
  { key: 'car', label: 'Automóvil', basePrice: 35000, color: '#4facfe' },
  { key: 'moto', label: 'Motocicleta', basePrice: 15000, color: '#00f0ff' },
  { key: 'camioneta', label: 'Camioneta', basePrice: 55000, color: '#ff8c42' },
  { key: 'bike', label: 'Bicicleta', basePrice: 5000, color: '#c084fc' },
]

const PAYMENT_METHODS = [
  { key: 'Efectivo', methodKey: 'cash', weight: 25 },
  { key: 'POS', methodKey: 'pos', weight: 15 },
  { key: 'ePayco', methodKey: 'epayco', weight: 30 },
  { key: 'Nequi', methodKey: 'nequi', weight: 12 },
  { key: 'Daviplata', methodKey: 'daviplata', weight: 8 },
  { key: 'Transferencia', methodKey: 'transfer', weight: 10 },
]

const FIRST_NAMES = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Sofia', 'Diego', 'Laura', 'Pedro', 'Carmen', 'Andrés', 'Diana']
const LAST_NAMES = ['Pérez', 'García', 'López', 'Martínez', 'Torres', 'Ramírez', 'Herrera', 'Castro', 'Morales', 'Rojas']

function generatePlates(rand: () => number, type: string): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const nums = '0123456789'
  if (type === 'moto') {
    return `M${letters[Math.floor(rand() * 26)]}${letters[Math.floor(rand() * 26)]}${nums[Math.floor(rand() * 10)]}${nums[Math.floor(rand() * 10)]}${nums[Math.floor(rand() * 10)]}`
  }
  return `${letters[Math.floor(rand() * 26)]}${letters[Math.floor(rand() * 26)]}${letters[Math.floor(rand() * 26)]}${nums[Math.floor(rand() * 10)]}${nums[Math.floor(rand() * 10)]}${nums[Math.floor(rand() * 10)]}`
}

/**
 * Generate dynamic demo report content based on filters.
 * Returns different data for each filter combination.
 */
export function generateDemoReport(filters: ReportFilters): ReportContent {
  const seed = getSeed(filters)
  const rand = seededRandom(seed)
  const mult = getPeriodMultiplier(filters.period)

  // Filter vehicle types
  let activeTypes = VEHICLE_TYPES
  if (filters.type !== 'all') {
    activeTypes = VEHICLE_TYPES.filter((t) => t.key === filters.type)
  }

  // Filter payment methods
  let activePayments = PAYMENT_METHODS
  if (filters.payment !== 'all') {
    activePayments = PAYMENT_METHODS.filter((p) => p.methodKey === filters.payment)
  }

  // Generate row count based on period
  const baseRows = Math.floor(8 + rand() * 12) // 8-20 rows base
  const rowCount = Math.floor(baseRows * Math.sqrt(mult))

  // Generate rows
  const rows = []
  for (let i = 0; i < rowCount; i++) {
    const vType = activeTypes[Math.floor(rand() * activeTypes.length)]
    const pMethod = activePayments[Math.floor(rand() * activePayments.length)]
    const durationHours = 1 + Math.floor(rand() * 5) + rand()
    const tarifaNum = Math.round(vType.basePrice * durationHours * (0.8 + rand() * 0.4))

    const entryHour = 6 + Math.floor(rand() * 12)
    const entryMin = Math.floor(rand() * 60)
    const exitHour = Math.min(entryHour + Math.ceil(durationHours), 22)
    const exitMin = Math.floor(rand() * 60)

    const firstName = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
    const lastName = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]

    rows.push({
      placa: generatePlates(rand, vType.key),
      tipo: vType.label,
      ingreso: `${entryHour}:${entryMin.toString().padStart(2, '0')}`,
      salida: `${exitHour}:${exitMin.toString().padStart(2, '0')}`,
      duracion: `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}min`,
      tarifa: `$${tarifaNum.toLocaleString('es-CO')}`,
      pago: pMethod.key,
      conductor: `${firstName} ${lastName}`,
    })
  }

  // Calculate summary from rows
  const totalIngresos = rows.reduce((sum, r) => sum + (parseInt(r.tarifa.replace(/[$.]/g, '')) || 0), 0)
  const totalVehiculos = rows.length
  const ticketPromedio = totalVehiculos > 0 ? Math.round(totalIngresos / totalVehiculos) : 0
  const diffHours = Math.max(mult * 12, 1)
  const ingresosPorHora = Math.round(totalIngresos / diffHours)

  // Breakdown
  const typeCounts: Record<string, number> = {}
  const typeIngresos: Record<string, number> = {}
  rows.forEach((r) => {
    typeCounts[r.tipo] = (typeCounts[r.tipo] || 0) + 1
    const amt = parseInt(r.tarifa.replace(/[$.]/g, '')) || 0
    typeIngresos[r.tipo] = (typeIngresos[r.tipo] || 0) + amt
  })
  const breakdown = Object.keys(typeCounts).map((tipo) => ({
    tipo,
    cantidad: typeCounts[tipo],
    ingresos: typeIngresos[tipo],
    porcentaje: totalVehiculos > 0 ? Math.round((typeCounts[tipo] / totalVehiculos) * 100) : 0,
  }))

  // Period label
  const periodLabels: Record<string, string> = {
    today: 'Hoy',
    week: 'Últimos 7 días',
    month: 'Este mes',
    custom: 'Período personalizado',
  }

  const now = new Date()

  return {
    meta: {
      title: 'Análisis Financiero — Punto Park U',
      subtitle: `Reporte de operación — ${periodLabels[filters.period] || filters.period}`,
      generatedAt: now.toLocaleString('es-CO'),
      period: `${periodLabels[filters.period] || filters.period} · ${totalVehiculos} vehículos registrados`,
    },
    summary: {
      totalIngresos,
      totalVehiculos,
      tasaOcupacion: Math.round(40 + rand() * 45),
      ticketPromedio,
      tiempoPromedio: `${1 + Math.floor(rand() * 3)}h ${Math.floor(rand() * 60)}min`,
      ingresosPorHora,
    },
    breakdown,
    kpis: [],
    rows,
  }
}

/**
 * Get daily income data for chart (varies by period).
 */
export function getDailyIncomeData(filters: ReportFilters): DailyIncome[] {
  const seed = getSeed(filters)
  const rand = seededRandom(seed)
  const mult = getPeriodMultiplier(filters.period)

  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  return labels.map((label, i) => ({
    label,
    income: Math.round((50000 + rand() * 150000) * Math.sqrt(mult) + i * 5000 * mult),
    previous: Math.round((45000 + rand() * 130000) * Math.sqrt(mult) + i * 4000 * mult),
  }))
}

/**
 * Get occupancy by vehicle type (varies by filters).
 */
export function getOccupancyByTypeData(filters: ReportFilters): OccupancyByType[] {
  const seed = getSeed(filters)
  const rand = seededRandom(seed)

  let types = VEHICLE_TYPES
  if (filters.type !== 'all') {
    types = VEHICLE_TYPES.filter((t) => t.key === filters.type)
  }

  if (types.length === 1) {
    return [{ type: types[0].label, percentage: 100, color: types[0].color }]
  }

  const weights = types.map(() => 20 + rand() * 60)
  const total = weights.reduce((a, b) => a + b, 0)

  return types.map((t, i) => ({
    type: t.label,
    percentage: Math.round((weights[i] / total) * 100),
    color: t.color,
  }))
}

/**
 * Get payment method stats (varies by filters).
 */
export function getPaymentMethodData(filters: ReportFilters): PaymentMethodStat[] {
  const seed = getSeed(filters)
  const rand = seededRandom(seed)

  let methods = PAYMENT_METHODS
  if (filters.payment !== 'all') {
    methods = PAYMENT_METHODS.filter((m) => m.methodKey === filters.payment)
  }

  if (methods.length === 1) {
    return [{ method: methods[0].key, amount: 100, color: '#4ade80' }]
  }

  const weights = methods.map((m) => m.weight * (0.5 + rand()))
  const total = weights.reduce((a, b) => a + b, 0)

  const colors = ['#4ade80', '#4facfe', '#c084fc', '#fbbf24', '#f87171', '#a78bfa']

  return methods.map((m, i) => ({
    method: m.key,
    amount: Math.round((weights[i] / total) * 100),
    color: colors[i % colors.length],
  }))
}

/**
 * Get hourly income data (area chart).
 */
export function getHourlyIncomeData(filters: ReportFilters): { hour: string; income: number }[] {
  const seed = getSeed(filters)
  const rand = seededRandom(seed)
  const mult = getPeriodMultiplier(filters.period)

  return Array.from({ length: 14 }, (_, i) => ({
    hour: `${i + 6}:00`,
    income: Math.round((3000 + Math.sin((i / 13) * Math.PI) * 25000) * Math.sqrt(mult) + rand() * 5000 * mult),
  }))
}

/**
 * Fetch report data from the API.
 */
export async function fetchReportData(filters: ReportFilters): Promise<ReportContent> {
  const params: Record<string, string> = {
    type: filters.type,
    period: filters.period,
    payment: filters.payment,
  }
  if (filters.dateFrom) params.dateFrom = filters.dateFrom
  if (filters.dateTo) params.dateTo = filters.dateTo

  const { data } = await api.get<ApiResponse<ReportContent>>('/admin/reports/financial', { params })
  if (data.success && data.data) {
    return data.data
  }
  throw new Error(data.message || 'No se pudieron obtener los datos del reporte')
}

/**
 * Get tariff/pricing configuration.
 */
export async function fetchPricingConfig(): Promise<PricingConfig> {
  try {
    const { data } = await api.get<ApiResponse<PricingConfig>>('/public/tariffs')
    if (data.success && data.data) return data.data
  } catch {
    // Fallback
  }
  return {
    car: { hour: 3000, day: 25000, month: 500000 },
    moto: { hour: 1500, day: 12000, month: 300000 },
    bike: { hour: 1000, day: 8000, month: 200000 },
  }
}

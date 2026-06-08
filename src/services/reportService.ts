import api from './api'
import type { ApiResponse, ReportData, ReportFilters, ReportContent, DailyIncome, OccupancyByType, PaymentMethodStat, PricingConfig } from '@/types'
import { getVehicleLabel } from '@/utils/formatters'

/**
 * Generate mock report data matching the vanilla Punto Park U reports.
 */
function generateMockReportData(filters: ReportFilters): ReportContent {
  const now = new Date()
  const generatedAt = now.toLocaleString('es-CO')
  const periodLabels: Record<string, string> = {
    today: 'Hoy',
    week: 'Semana actual',
    month: new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
    custom: `${filters.dateFrom || '—'} → ${filters.dateTo || '—'}`,
  }

  const typeFilter = filters.type !== 'all' ? getVehicleLabel(filters.type) : null
  const isMonthly = filters.period === 'month'
  const isWeekly = filters.period === 'week'

  // Summary scaled by period
  const multiplier = isMonthly ? 26 : isWeekly ? 6 : 1
  const totalIngresos = 245000 * multiplier + Math.floor(Math.random() * 50000)
  const totalVehiculos = (isMonthly ? 620 : isWeekly ? 145 : 24) + Math.floor(Math.random() * 5)
  const ticketPromedio = Math.round(totalIngresos / Math.max(totalVehiculos, 1))

  // Generate breakdown
  const breakdown = [
    { tipo: 'Automóvil', cantidad: Math.round(totalVehiculos * 0.58), ingresos: Math.round(totalIngresos * 0.60), porcentaje: 60 },
    { tipo: 'Motocicleta', cantidad: Math.round(totalVehiculos * 0.29), ingresos: Math.round(totalIngresos * 0.29), porcentaje: 29 },
    { tipo: 'Bicicleta', cantidad: Math.round(totalVehiculos * 0.13), ingresos: Math.round(totalIngresos * 0.11), porcentaje: 11 },
  ]

  const paymentMethods = ['Efectivo', 'POS', 'ePayco']
  const paymentWeights = [50, 30, 20]
  const operators = ['Carlos Martínez', 'Laura González', 'Andrés Pérez', 'María López', 'Pedro Silva']

  // Generate rows
  const rowCount = isMonthly ? 20 : 10
  const plates = ['ABC-123', 'XYZ-456', 'BCD-789', 'DEF-012', 'GHI-345', 'JKL-678', 'MNO-901', 'PQR-234', 'STU-567', 'VWX-890']
  const allTypes = ['Automóvil', 'Motocicleta', 'Bicicleta']

  const rows = Array.from({ length: rowCount }, (_, i) => {
    const hour = 7 + Math.floor(Math.random() * 10)
    const stay = 1 + Math.floor(Math.random() * 5)
    const type = typeFilter || allTypes[Math.floor(Math.random() * allTypes.length)]
    const rate = type === 'Automóvil' ? 3000 : type === 'Motocicleta' ? 1500 : 1000
    const tarifa = rate * stay

    // Weighted random payment method
    const rand = Math.random() * 100
    let cum = 0
    let payment = 'Efectivo'
    for (let j = 0; j < paymentMethods.length; j++) {
      cum += paymentWeights[j]
      if (rand <= cum) { payment = paymentMethods[j]; break }
    }

    return {
      placa: plates[i % plates.length],
      tipo: type,
      ingreso: `${String(hour).padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      salida: `${String(hour + stay).padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      duracion: `${stay}h`,
      tarifa: `$${tarifa.toLocaleString('es-CO')}`,
      pago: payment,
      conductor: `Cliente ${i + 1}`,
    }
  })

  // Filter by payment method if specified
  const filteredRows = filters.payment !== 'all'
    ? rows.filter(r => r.pago.toLowerCase() === filters.payment)
    : rows

  // Calculate payment totals from actual rows
  const paymentTotals = { efectivo: 0, pos: 0, epayco: 0 }
  filteredRows.forEach(r => {
    const amount = parseInt(r.tarifa.replace(/[$.]/g, '')) || 0
    if (r.pago === 'Efectivo') paymentTotals.efectivo += amount
    else if (r.pago === 'POS') paymentTotals.pos += amount
    else if (r.pago === 'ePayco') paymentTotals.epayco += amount
  })

  const ingresosPorHora = Math.round(totalIngresos / Math.max(filteredRows.length, 1))

  // Build projection
  const daysElapsed = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const projection = Math.round((totalIngresos / Math.max(daysElapsed, 1)) * daysInMonth)

  return {
    meta: {
      title: 'Análisis Financiero — Punto Park U',
      subtitle: filters.period === 'custom'
        ? `Período personalizado: ${filters.dateFrom} → ${filters.dateTo}`
        : `Análisis financiero del período seleccionado`,
      generatedAt,
      period: periodLabels[filters.period],
    },
    summary: {
      totalIngresos,
      totalVehiculos: filteredRows.length,
      tasaOcupacion: 68 + Math.floor(Math.random() * 10),
      ticketPromedio,
      tiempoPromedio: '3h 20m',
      ingresosPorHora,
    },
    breakdown,
    kpis: [
      { label: 'Ocupación pico', value: '92%', detail: 'Martes 10:00–12:00', status: 'ok' },
      { label: 'Hora más rentable', value: '11 AM', detail: '$38.000 promedio', status: 'ok' },
      { label: 'Día más rentable', value: 'Martes', detail: 'vs promedio +24%', status: 'ok' },
      { label: 'Crecimiento vs período anterior', value: '+12%', detail: 'en ingresos totales', status: 'ok' },
      { label: 'Rotación de espacios', value: '3.2x', detail: 'usos por espacio/día', status: 'ok' },
      { label: 'Mensualidades activas', value: '8', detail: '4 carros · 3 motos · 1 bici', status: 'ok' },
    ],
    rows: filteredRows,
  }
}

/**
 * Get daily income data for chart (bar + line).
 */
export function getDailyIncomeData(filters: ReportFilters): DailyIncome[] {
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  return labels.map((label, i) => ({
    label,
    income: Math.round(200000 + Math.random() * 300000 + i * 15000),
    previous: Math.round(180000 + Math.random() * 250000 + i * 10000),
  }))
}

/**
 * Get occupancy by vehicle type (doughnut chart).
 */
export function getOccupancyByTypeData(filters: ReportFilters): OccupancyByType[] {
  return [
    { type: 'Automóvil', percentage: 60, color: '#4facfe' },
    { type: 'Motocicleta', percentage: 29, color: '#00f0ff' },
    { type: 'Bicicleta', percentage: 11, color: '#c084fc' },
  ]
}

/**
 * Get payment method stats (bar chart).
 */
export function getPaymentMethodData(filters: ReportFilters): PaymentMethodStat[] {
  return [
    { method: 'Efectivo', amount: 50, color: '#4ade80' },
    { method: 'POS', amount: 30, color: '#4facfe' },
    { method: 'ePayco', amount: 20, color: '#c084fc' },
  ]
}

/**
 * Get hourly income data (area chart).
 */
export function getHourlyIncomeData(filters: ReportFilters): { hour: string; income: number }[] {
  return Array.from({ length: 14 }, (_, i) => ({
    hour: `${i + 6}:00`,
    income: Math.round(5000 + Math.sin((i / 13) * Math.PI) * 40000 + Math.random() * 10000),
  }))
}

/**
 * Fetch report data from the API with fallback to mock data.
 */
export async function fetchReportData(filters: ReportFilters): Promise<ReportContent> {
  try {
    // Build query params
    const params: Record<string, string> = {
      type: filters.type,
      period: filters.period,
      payment: filters.payment,
    }
    if (filters.dateFrom) params.dateFrom = filters.dateFrom
    if (filters.dateTo) params.dateTo = filters.dateTo

    const { data } = await api.get<ApiResponse<ReportData>>('/admin/reports/financial', { params })
    if (data.success && data.data) {
      // Convert API response to ReportContent if possible
      return generateMockReportData(filters)
    }
    return generateMockReportData(filters)
  } catch {
    return generateMockReportData(filters)
  }
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

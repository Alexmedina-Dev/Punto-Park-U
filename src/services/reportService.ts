import api from './api'
import type { ApiResponse, ReportFilters, ReportContent, DailyIncome, OccupancyByType, PaymentMethodStat, PricingConfig } from '@/types'

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
 * Fetch report data from the API.
 * Backend returns ReportContent directly for the financial report.
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

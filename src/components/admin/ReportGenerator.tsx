import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui'
import { ReportFilter } from './ReportFilter'
import { ReportKPIs } from './ReportKPIs'
import { ReportCharts } from './ReportCharts'
import { ReportTable } from './ReportTable'
import { PDFExporter } from './PDFExporter'
import { ExcelExporter } from './ExcelExporter'
import { fetchReportData, getDailyIncomeData, getOccupancyByTypeData, getPaymentMethodData, getHourlyIncomeData } from '@/services/reportService'
import { showSuccessToast } from '@/utils/errorHandler'
import type { ReportFilters, ReportContent, ReportPaymentKPI, DailyIncome, OccupancyByType, PaymentMethodStat } from '@/types'

/**
 * Report Generator — Orchestrates all report sub-components.
 * Handles:
 *   - Filter state management
 *   - Data fetching (API with mock fallback)
 *   - KPI calculation (including payment totals and projection)
 *   - Chart data derivation
 *   - Export to PDF / Excel
 *
 * Matches the vanilla Punto Park U "Análisis Financiero" reports tab.
 */
export function ReportGenerator() {
  const [filters, setFilters] = useState<ReportFilters>({
    period: 'today',
    type: 'all',
    payment: 'all',
  })
  const [reportContent, setReportContent] = useState<ReportContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Derived chart data from filters (independent of API)
  const dailyIncome: DailyIncome[] = useMemo(() => getDailyIncomeData(filters), [filters])
  const occupancyByType: OccupancyByType[] = useMemo(() => getOccupancyByTypeData(filters), [filters])
  const paymentMethods: PaymentMethodStat[] = useMemo(() => getPaymentMethodData(filters), [filters])
  const hourlyIncome: { hour: string; income: number }[] = useMemo(() => getHourlyIncomeData(filters), [filters])

  // Compute payment totals from report rows
  const paymentTotals: ReportPaymentKPI = useMemo(() => {
    if (!reportContent) return { efectivo: 0, pos: 0, epayco: 0, nequi: 0, daviplata: 0, transfer: 0 }
    const totals = { efectivo: 0, pos: 0, epayco: 0, nequi: 0, daviplata: 0, transfer: 0 }
    reportContent.rows.forEach((r) => {
      const amount = parseInt(r.tarifa.replace(/[$.]/g, '')) || 0
      if (r.pago === 'Efectivo') totals.efectivo += amount
      else if (r.pago === 'POS') totals.pos += amount
      else if (r.pago === 'ePayco') totals.epayco += amount
      else if (r.pago === 'Nequi') totals.nequi += amount
      else if (r.pago === 'Daviplata') totals.daviplata += amount
      else if (r.pago === 'Transferencia') totals.transfer += amount
    })
    return totals
  }, [reportContent])

  // Check if report has real data or is empty
  const hasRealData = reportContent && reportContent.summary && reportContent.summary.totalIngresos > 0
  const displayContent = hasRealData ? reportContent : getDemoReportContent(filters)
  const displayPaymentTotals = hasRealData ? paymentTotals : { efectivo: 154000, pos: 68000, epayco: 1425000, nequi: 576000, daviplata: 125000, transfer: 106000 }
  
  // Compute monthly projection
  const projection: number = useMemo(() => {
    if (!reportContent) return 0
    if (filters.period === 'month') return 0 // N/A for full month
    const now = new Date()
    const today = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const income = reportContent.summary.totalIngresos
    if (today === 0) return income
    return Math.round((income / today) * daysInMonth)
  }, [reportContent, filters.period])
  
  const displayProjection = hasRealData ? projection : 4900000

  const loadReportData = useCallback(async (newFilters: ReportFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const content = await fetchReportData(newFilters)
      setReportContent(content)
    } catch (err) {
      console.error('Failed to load report data:', err)
      setError('Error al cargar datos del reporte')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load data on mount and filter change
  useEffect(() => {
    loadReportData(filters)
  }, [filters, loadReportData])

  const handleFiltersChange = useCallback((newFilters: ReportFilters) => {
    setFilters(newFilters)
  }, [])

  return (
    <div className="space-y-6" data-testid="report-generator">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary font-headline">
            Análisis Financiero
          </h2>
          <p className="text-sm text-on-surface-var mt-1">
            Reportes detallados de ingresos, ocupación y rendimiento del parqueadero
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PDFExporter
            content={displayContent}
            disabled={false}
          />
          <ExcelExporter
            content={displayContent}
            disabled={false}
          />
        </div>
      </div>

      {/* Filter + Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Filters */}
        <div className="lg:col-span-1">
          <ReportFilter onFiltersChange={handleFiltersChange} />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <Card variant="glass" padding="lg">
              <div className="flex items-center justify-center py-12">
                <span className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-on-surface-var">Cargando reporte...</span>
              </div>
            </Card>
          ) : error ? (
            <Card variant="glass" padding="lg">
              <div className="text-center py-8 text-on-surface-var">
                <span className="material-symbols-outlined text-3xl mb-2 block text-red-400">error</span>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </Card>
          ) : reportContent || true ? (
            <>
              {!hasRealData && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">info</span>
                  <span>Mostrando datos de demostración. El parqueadero lleva 15 días operando desde su inauguración.</span>
                </div>
              )}
              {/* 10 KPIs */}
              <ReportKPIs
                summary={displayContent.summary}
                paymentTotals={displayPaymentTotals}
                projection={displayProjection}
              />

              {/* 4 Charts */}
              <ReportCharts
                filters={filters}
                dailyIncome={dailyIncome}
                occupancyByType={occupancyByType}
                paymentMethods={paymentMethods}
                hourlyIncome={hourlyIncome}
              />

              {/* Data Table */}
              <ReportTable rows={displayContent.rows} filters={filters} />
            </>
          ) : (
            <Card variant="glass" padding="lg">
              <div className="text-center py-8 text-on-surface-var text-sm">
                <span className="material-symbols-outlined text-3xl mb-2 block text-primary">
                  bar_chart
                </span>
                <p>Selecciona los filtros y presiona "Actualizar Reporte" para ver los datos.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Get demo report content with fictional data for presentation.
 * Shows 15 days of operation since inauguration.
 */
function getDemoReportContent(filters: ReportFilters): ReportContent {
  const now = new Date()
  const generatedAt = now.toLocaleString('es-CO')
  const periodLabel = filters.period === 'today' ? 'Hoy' : filters.period === 'week' ? 'Últimos 7 días' : filters.period === 'month' ? 'Últimos 15 días' : 'Período personalizado'
  
  // Mock data: 15 days of operation, 127 vehicles, $2.4M income
  const totalIngresos = 2450000
  const totalVehiculos = 127
  const tasaOcupacion = 68
  const ticketPromedio = 19291
  const tiempoPromedio = '2h 15min'
  const ingresosPorHora = 10208
  
  const breakdown = [
    { tipo: 'Automóvil', cantidad: 68, ingresos: 1428000, porcentaje: 58 },
    { tipo: 'Camioneta', cantidad: 24, ingresos: 576000, porcentaje: 24 },
    { tipo: 'Motocicleta', cantidad: 28, ingresos: 336000, porcentaje: 14 },
    { tipo: 'Bicicleta', cantidad: 7, ingresos: 70000, porcentaje: 4 },
  ]
  
  const rows = [
    { placa: 'ABC123', tipo: 'Automóvil', ingreso: '07:30 a.m.', salida: '09:45 a.m.', duracion: '2h 15min', tarifa: '$38.500', pago: 'ePayco', conductor: 'Juan Pérez' },
    { placa: 'DEF456', tipo: 'Camioneta', ingreso: '08:15 a.m.', salida: '12:30 p.m.', duracion: '4h 15min', tarifa: '$68.000', pago: 'Nequi', conductor: 'María García' },
    { placa: 'GHI789', tipo: 'Motocicleta', ingreso: '09:00 a.m.', salida: '11:00 a.m.', duracion: '2h 00min', tarifa: '$15.000', pago: 'Efectivo', conductor: 'Carlos López' },
    { placa: 'JKL012', tipo: 'Automóvil', ingreso: '10:30 a.m.', salida: '02:45 p.m.', duracion: '4h 15min', tarifa: '$57.500', pago: 'Daviplata', conductor: 'Ana Martínez' },
    { placa: 'MNO345', tipo: 'Bicicleta', ingreso: '11:00 a.m.', salida: '01:00 p.m.', duracion: '2h 00min', tarifa: '$5.000', pago: 'Transferencia', conductor: 'Luis Torres' },
    { placa: 'PQR678', tipo: 'Automóvil', ingreso: '12:15 p.m.', salida: '03:30 p.m.', duracion: '3h 15min', tarifa: '$48.750', pago: 'ePayco', conductor: 'Sofia Ramírez' },
    { placa: 'STU901', tipo: 'Camioneta', ingreso: '01:00 p.m.', salida: '05:15 p.m.', duracion: '4h 15min', tarifa: '$72.000', pago: 'POS', conductor: 'Diego Herrera' },
    { placa: 'VWX234', tipo: 'Motocicleta', ingreso: '02:30 p.m.', salida: '04:00 p.m.', duracion: '1h 30min', tarifa: '$11.250', pago: 'Efectivo', conductor: 'Laura Castro' },
  ]
  
  return {
    meta: {
      title: 'Análisis Financiero — Punto Park U',
      subtitle: 'Reporte de operación',
      generatedAt,
      period: `${periodLabel} · Desde inauguración (15 días operando)`,
    },
    summary: {
      totalIngresos,
      totalVehiculos,
      tasaOcupacion,
      ticketPromedio,
      tiempoPromedio,
      ingresosPorHora,
    },
    breakdown,
    kpis: [],
    rows,
  }
}

/**
 * Get an empty report content object for disabled export states.
 */
function getEmptyReportContent(filters: ReportFilters): ReportContent {
  return getDemoReportContent(filters)
}

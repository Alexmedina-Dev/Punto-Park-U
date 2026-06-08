import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui'
import { ReportFilter } from './ReportFilter'
import { ReportKPIs } from './ReportKPIs'
import { ReportCharts } from './ReportCharts'
import { ReportTable } from './ReportTable'
import { PDFExporter } from './PDFExporter'
import { ExcelExporter } from './ExcelExporter'
import { fetchReportData, getDailyIncomeData, getOccupancyByTypeData, getPaymentMethodData, getHourlyIncomeData } from '@/services/reportService'
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
    if (!reportContent) return { efectivo: 0, pos: 0, epayco: 0 }
    const totals = { efectivo: 0, pos: 0, epayco: 0 }
    reportContent.rows.forEach((r) => {
      const amount = parseInt(r.tarifa.replace(/[$.]/g, '')) || 0
      if (r.pago === 'Efectivo') totals.efectivo += amount
      else if (r.pago === 'POS') totals.pos += amount
      else if (r.pago === 'ePayco') totals.epayco += amount
    })
    return totals
  }, [reportContent])

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
            content={reportContent || getEmptyReportContent(filters)}
            disabled={!reportContent && !isLoading}
          />
          <ExcelExporter
            content={reportContent || getEmptyReportContent(filters)}
            disabled={!reportContent && !isLoading}
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
          ) : reportContent ? (
            <>
              {/* 10 KPIs */}
              <ReportKPIs
                summary={reportContent.summary}
                paymentTotals={paymentTotals}
                projection={projection}
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
              <ReportTable rows={reportContent.rows} filters={filters} />
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
 * Get an empty report content object for disabled export states.
 */
function getEmptyReportContent(filters: ReportFilters): ReportContent {
  return {
    meta: {
      title: 'Análisis Financiero — Punto Park U',
      subtitle: 'Sin datos',
      generatedAt: new Date().toLocaleString('es-CO'),
      period: '—',
    },
    summary: {
      totalIngresos: 0,
      totalVehiculos: 0,
      tasaOcupacion: 0,
      ticketPromedio: 0,
      tiempoPromedio: '0 min',
      ingresosPorHora: 0,
    },
    breakdown: [],
    kpis: [],
    rows: [],
  }
}

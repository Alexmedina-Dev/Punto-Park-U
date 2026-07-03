import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui'
import { ReportFilter } from './ReportFilter'
import { ReportKPIs } from './ReportKPIs'
import { ReportCharts } from './ReportCharts'
import { ReportTable } from './ReportTable'
import { PDFExporter } from './PDFExporter'
import { ExcelExporter } from './ExcelExporter'
import { fetchReportData, getDailyIncomeData, getOccupancyByTypeData, getPaymentMethodData, getHourlyIncomeData, generateDemoReport } from '@/services/reportService'
import type { ReportFilters, ReportContent, ReportPaymentKPI } from '@/types'

/**
 * Report Generator — Orchestrates all report sub-components.
 * Handles:
 *   - Filter state management
 *   - Data fetching (API with dynamic demo fallback)
 *   - KPI calculation from actual or demo data
 *   - Chart data that varies by filter
 *   - Export to PDF / Excel
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

  // Check if report has real data or is empty
  const hasRealData = reportContent && reportContent.summary && reportContent.summary.totalIngresos > 0

  // Use real data if available, otherwise generate dynamic demo data based on filters
  const displayContent: ReportContent = useMemo(() => {
    if (hasRealData && reportContent) return reportContent
    return generateDemoReport(filters)
  }, [hasRealData, reportContent, filters])

  // Compute payment totals from display content rows (works for both real and demo)
  const paymentTotals: ReportPaymentKPI = useMemo(() => {
    const totals = { efectivo: 0, pos: 0, epayco: 0, nequi: 0, daviplata: 0, transfer: 0 }
    displayContent.rows.forEach((r) => {
      const amount = parseInt(r.tarifa.replace(/[$.]/g, '')) || 0
      if (r.pago === 'Efectivo') totals.efectivo += amount
      else if (r.pago === 'POS') totals.pos += amount
      else if (r.pago === 'ePayco') totals.epayco += amount
      else if (r.pago === 'Nequi') totals.nequi += amount
      else if (r.pago === 'Daviplata') totals.daviplata += amount
      else if (r.pago === 'Transferencia') totals.transfer += amount
    })
    return totals
  }, [displayContent])

  // Compute monthly projection from display content
  const projection: number = useMemo(() => {
    if (filters.period === 'month') return 0 // N/A for full month
    const now = new Date()
    const today = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const income = displayContent.summary.totalIngresos
    if (today === 0) return income
    return Math.round((income / today) * daysInMonth)
  }, [displayContent, filters.period])

  // Chart data that varies by filters
  const dailyIncome = useMemo(() => getDailyIncomeData(filters), [filters])
  const occupancyByType = useMemo(() => getOccupancyByTypeData(filters), [filters])
  const paymentMethods = useMemo(() => getPaymentMethodData(filters), [filters])
  const hourlyIncome = useMemo(() => getHourlyIncomeData(filters), [filters])

  const loadReportData = useCallback(async (newFilters: ReportFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const content = await fetchReportData(newFilters)
      setReportContent(content)
    } catch (err) {
      console.error('Failed to load report data:', err)
      setError('Error al cargar datos del reporte')
      // On error, clear reportContent so demo data is shown
      setReportContent(null)
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
          ) : (
            <>
              {!hasRealData && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined">info</span>
                  <span>Mostrando datos de demostración. Los filtros aplicados afectan estos datos.</span>
                </div>
              )}
              {/* KPIs */}
              <ReportKPIs
                summary={displayContent.summary}
                paymentTotals={paymentTotals}
                projection={projection}
              />

              {/* Charts */}
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
          )}
        </div>
      </div>
    </div>
  )
}

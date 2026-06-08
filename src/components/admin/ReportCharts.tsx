import React from 'react'
import { Card } from '@/components/ui'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import type { ReportFilters, DailyIncome, OccupancyByType, PaymentMethodStat } from '@/types'
import { formatCurrency } from '@/utils/formatters'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ReportChartsProps {
  filters: ReportFilters
  dailyIncome: DailyIncome[]
  occupancyByType: OccupancyByType[]
  paymentMethods: PaymentMethodStat[]
  hourlyIncome: { hour: string; income: number }[]
  className?: string
}

const chartDefaults: Partial<ChartOptions> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#94a3b8',
        font: { size: 11 },
        usePointStyle: true,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.1)' },
      ticks: { color: '#64748b', font: { size: 11 } },
    },
  },
}

/**
 * Four chart types for admin reports:
 *   1. Ingresos diarios (bar + line)
 *   2. Ocupación por tipo (doughnut)
 *   3. Método de pago (bar)
 *   4. Ingresos por hora (area)
 */
export function ReportCharts({
  filters,
  dailyIncome,
  occupancyByType,
  paymentMethods,
  hourlyIncome,
  className = '',
}: ReportChartsProps) {
  // ── 1. Ingresos diarios (bar with line overlay) ──────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incomeChartData: any = {
    labels: dailyIncome.map((d) => d.label),
    datasets: [
      {
        label: 'Actual',
        data: dailyIncome.map((d) => d.income),
        backgroundColor: 'rgba(0, 240, 255, 0.6)',
        borderColor: 'rgba(0, 240, 255, 0.9)',
        borderWidth: 1,
        borderRadius: 4,
        order: 2,
      },
      {
        label: 'Anterior',
        data: dailyIncome.map((d) => d.previous),
        type: 'line',
        borderColor: 'rgba(192, 132, 252, 0.8)',
        backgroundColor: 'rgba(192, 132, 252, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(192, 132, 252, 0.8)',
        tension: 0.4,
        fill: false,
        order: 1,
      },
    ],
  }

  // ── 2. Ocupación por tipo (doughnut) ─────────────────────────
  const occupancyChartData: ChartData<'doughnut'> = {
    labels: occupancyByType.map((o) => o.type),
    datasets: [
      {
        data: occupancyByType.map((o) => o.percentage),
        backgroundColor: occupancyByType.map((o) => o.color),
        borderWidth: 0,
      },
    ],
  }

  const occupancyChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw}%`,
        },
      },
    },
  }

  // ── 3. Método de pago (bar) ──────────────────────────────────
  const paymentChartData: ChartData<'bar'> = {
    labels: paymentMethods.map((p) => p.method),
    datasets: [
      {
        label: 'Distribución',
        data: paymentMethods.map((p) => p.amount),
        backgroundColor: paymentMethods.map((p) => p.color),
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  // ── 4. Ingresos por hora (area) ──────────────────────────────
  const hourlyChartData: ChartData<'line'> = {
    labels: hourlyIncome.map((h) => h.hour),
    datasets: [
      {
        label: 'Ingreso promedio',
        data: hourlyIncome.map((h) => h.income),
        borderColor: 'rgba(74, 222, 128, 0.8)',
        backgroundColor: 'rgba(74, 222, 128, 0.15)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(74, 222, 128, 0.8)',
      },
    ],
  }

  const hourlyChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => ` $${(ctx.raw as number).toLocaleString('es-CO')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: {
          color: '#64748b',
          font: { size: 11 },
          callback: (v) => '$' + (Number(v) / 1000).toFixed(0) + 'k',
        },
      },
    },
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Row 1: Income + Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily income (bar + line) */}
        <Card variant="glass" title="Ingresos Diarios">
          <div style={{ height: '260px' }}>
            <Bar data={incomeChartData} options={{
              ...chartDefaults,
              scales: {
                ...chartDefaults.scales,
                y: {
                  ...chartDefaults.scales?.y,
                  ticks: {
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (v) => '$' + (Number(v) / 1000).toFixed(0) + 'k',
                  },
                },
              },
              plugins: {
                ...chartDefaults.plugins,
                legend: {
                  ...chartDefaults.plugins?.legend,
                  display: true,
                  position: 'bottom',
                },
              },
            } as any} />
          </div>
        </Card>

        {/* Chart 2: Occupancy by type (doughnut) */}
        <Card variant="glass" title="Ocupación por Tipo">
          <div className="flex items-center gap-6" style={{ height: '260px' }}>
            <div className="w-1/2 h-full">
              <Doughnut data={occupancyChartData} options={occupancyChartOptions} />
            </div>
            {/* Custom legend */}
            <div className="w-1/2 space-y-3">
              {occupancyByType.map((o) => (
                <div key={o.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: o.color }}
                    />
                    <span className="text-xs text-on-surface-var">{o.type}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{o.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Payment method + Hourly income */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Payment method (bar) */}
        <Card variant="glass" title="Método de Pago">
          <div style={{ height: '260px' }}>
            <Bar data={paymentChartData} options={{
              ...chartDefaults,
              plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
              },
              scales: {
                x: {
                  ...chartDefaults.scales?.x,
                },
                y: {
                  ...chartDefaults.scales?.y,
                  max: 100,
                  ticks: {
                    color: '#64748b',
                    font: { size: 11 },
                    callback: (v) => v + '%',
                  },
                },
              },
            } as any} />
          </div>
        </Card>

        {/* Chart 4: Hourly income (area) */}
        <Card variant="glass" title="Ingresos por Hora">
          <div style={{ height: '260px' }}>
            <Line data={hourlyChartData} options={hourlyChartOptions} />
          </div>
        </Card>
      </div>
    </div>
  )
}

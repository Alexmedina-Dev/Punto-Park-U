import React from 'react'
import { ChartWidget } from './ChartWidget'
import type { HourlyOccupancy } from '@/types'
import type { ChartData } from 'chart.js'

interface OccupancyChartProps {
  data: HourlyOccupancy[]
  className?: string
}

/**
 * Bar chart showing hourly parking occupancy — "Ocupación por Hora".
 * Uses Chart.js via the ChartWidget wrapper.
 */
export function OccupancyChart({ data, className = '' }: OccupancyChartProps) {
  if (data.length === 0) {
    return (
      <div className={className}>
        <div className="glass rounded-lg p-6 text-center">
          <span className="material-symbols-outlined text-3xl mb-2 block text-primary">
            bar_chart
          </span>
          <p className="text-sm text-on-surface-var">
            No hay datos de ocupación disponibles.
          </p>
        </div>
      </div>
    )
  }

  const chartData: ChartData<'bar'> = {
    labels: data.map((d) => d.hour),
    datasets: [
      {
        label: 'Vehículos',
        data: data.map((d) => d.count),
        backgroundColor: 'rgba(96, 165, 250, 0.6)',
        borderColor: 'rgba(96, 165, 250, 0.9)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Capacidad',
        data: data.map((d) => d.capacity),
        backgroundColor: 'rgba(148, 163, 184, 0.15)',
        borderColor: 'rgba(148, 163, 184, 0.3)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  return (
    <ChartWidget
      title="Ocupación por Hora"
      data={chartData}
      height={260}
      className={className}
    />
  )
}

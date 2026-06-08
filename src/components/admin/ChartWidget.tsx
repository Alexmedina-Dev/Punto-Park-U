import React from 'react'
import { Card } from '@/components/ui'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ChartWidgetProps {
  title: string
  data: ChartData<'bar'>
  options?: ChartOptions<'bar'>
  height?: number
  className?: string
}

const defaultOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
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
      grid: {
        display: false,
      },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
      },
      ticks: {
        color: '#64748b',
        font: { size: 11 },
      },
    },
  },
}

/**
 * Chart.js wrapper widget for the admin dashboard.
 * Renders a responsive bar chart inside a glass card.
 */
export function ChartWidget({
  title,
  data,
  options,
  height = 250,
  className = '',
}: ChartWidgetProps) {
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options?.plugins,
    },
    scales: {
      ...defaultOptions.scales,
      ...options?.scales,
    },
  }

  return (
    <Card variant="glass" title={title} className={className}>
      <div style={{ height: `${height}px` }}>
        <Bar data={data} options={mergedOptions} />
      </div>
    </Card>
  )
}

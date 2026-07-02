import { useState, useEffect, useCallback } from 'react'
import { Card, Button } from '@/components/ui'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface OccupancyForecastProps {
  className?: string
}

export function OccupancyForecast({ className = '' }: OccupancyForecastProps) {
  const {
    occupancyPrediction,
    loading,
    fetchOccupancyPrediction,
  } = useAnalyticsStore()

  const [forecastDays, setForecastDays] = useState(7)

  const fetchPrediction = useCallback(() => {
    fetchOccupancyPrediction(forecastDays)
  }, [fetchOccupancyPrediction, forecastDays])

  useEffect(() => {
    fetchPrediction()
  }, [fetchPrediction])

  const forecast = occupancyPrediction?.forecast || []
  const hasData = forecast.length > 0

  const chartData: ChartData<'line'> = hasData
    ? {
        labels: forecast.map((f) => {
          const d = new Date(f.ds)
          return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
        }),
        datasets: [
          {
            label: 'Predicción (Prophet)',
            data: forecast.map((f) => Math.round(f.yhat)),
            borderColor: 'rgba(0, 240, 255, 0.9)',
            backgroundColor: 'rgba(0, 240, 255, 0.05)',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 4,
            pointBackgroundColor: 'rgba(0, 240, 255, 0.9)',
            tension: 0.4,
            fill: false,
          },
          {
            label: 'Límite superior',
            data: forecast.map((f) => Math.round(f.yhat_upper)),
            borderColor: 'rgba(0, 240, 255, 0.2)',
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.4,
            fill: '+1',
          },
          {
            label: 'Límite inferior',
            data: forecast.map((f) => Math.round(f.yhat_lower)),
            borderColor: 'rgba(0, 240, 255, 0.2)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.4,
            fill: false,
          },
        ],
      }
    : { labels: [], datasets: [] }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { size: 11 },
          usePointStyle: true,
          padding: 16,
          filter: (item) => item.text !== 'Límite superior' && item.text !== 'Límite inferior',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            if (ctx.datasetIndex > 0) return ''
            return ` Predicción: ${ctx.raw} vehículos`
          },
        },
        filter: (item) => item.datasetIndex === 0,
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
          callback: (v) => `${v}`,
        },
        title: {
          display: true,
          text: 'Vehículos',
          color: '#64748b',
          font: { size: 11 },
        },
      },
    },
  }

  return (
    <Card variant="glass" className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-on-bg font-headline break-words">
            Predicción de Ocupación
          </h3>
          <p className="text-xs text-on-surface-var mt-0.5 break-words">
            Predicción generada por IA (Prophet) — {forecastDays} días
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {[3, 7, 14].map((d) => (
            <button
              key={d}
              onClick={() => setForecastDays(d)}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                forecastDays === d
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-var hover:text-on-bg'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-primary animate-pulse">
              model_training
            </span>
            <p className="text-sm text-on-surface-var">Entrenando modelo Prophet...</p>
          </div>
        </div>
      )}

      {!loading && !hasData && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="material-symbols-outlined text-4xl mb-2 text-on-surface-var">
            query_stats
          </span>
          <p className="text-sm text-on-surface-var mb-1">
            No hay suficientes datos para generar la predicción.
          </p>
          <p className="text-xs text-on-surface-var">
            Se necesitan al menos 7 días de historial de reservas.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPrediction}
            className="mt-3"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Reintentar
          </Button>
        </div>
      )}

      {!loading && hasData && (
        <div style={{ height: '260px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}

      {occupancyPrediction?.error && !loading && (
        <div className="mt-2 px-3 py-1.5 rounded-md bg-warning/10 text-warning text-xs">
          {occupancyPrediction.error}
        </div>
      )}

      {!loading && hasData && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline">
          <p className="text-xs text-on-surface-var">
            Histórico: {occupancyPrediction?.historical_days} días
          </p>
          <p className="text-xs text-on-surface-var">
            Modelo: Prophet (weekly seasonality)
          </p>
        </div>
      )}
    </Card>
  )
}

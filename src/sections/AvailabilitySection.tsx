import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useLiveClock } from '@/hooks/useLiveClock'
import { useCounter } from '@/hooks/useCounter'

interface GaugeData {
  icon: string
  label: string
  used: number
  total: number
}

function GaugeChart({ used, total, icon, label }: GaugeData) {
  const percentage = total > 0 ? (used / total) * 100 : 0
  const displayPercentage = Math.round(percentage)
  // SVG circumference for r=15.9155 is ~100
  const dashArray = percentage

  // Animated available count
  const available = total - used
  const { displayValue } = useCounter({
    target: available,
    duration: 1200,
  })

  return (
    <div className="flex flex-col items-center gap-3" data-testid={`gauge-${label.toLowerCase()}`}>
      <div className="relative w-32 h-32 sm:w-36 sm:h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <path
            className="stroke-surface-high"
            fill="none"
            strokeWidth="3"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Progress circle */}
          <path
            className="stroke-primary"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${dashArray}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            style={{ transition: 'stroke-dasharray 0.8s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-2xl text-primary mb-1">{icon}</span>
          <span className="text-xl font-black text-on-bg font-headline" data-testid={`gauge-count-${label.toLowerCase()}`}>
            {displayValue}
            <span className="text-sm font-normal text-on-surface-var">/{total}</span>
          </span>
        </div>
      </div>
      <h3 className="text-base font-bold text-primary font-headline">{label}</h3>
      <p className="text-sm text-on-surface-var">{displayPercentage}% Ocupado</p>
    </div>
  )
}

export function AvailabilitySection() {
  const availability = useAppStore((state) => state.availability)
  const fetchAvailability = useAppStore((state) => state.fetchAvailability)
  const { time } = useLiveClock()

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  const stats = availability?.stats

  const gauges: GaugeData[] = [
    {
      icon: 'directions_car',
      label: 'Vehículos',
      used: stats?.cars.used ?? 8,
      total: stats?.cars.total ?? 20,
    },
    {
      icon: 'motorcycle',
      label: 'Motos',
      used: stats?.motos.used ?? 7,
      total: stats?.motos.total ?? 20,
    },
    {
      icon: 'pedal_bike',
      label: 'Bicicletas',
      used: stats?.bikes.used ?? 3,
      total: stats?.bikes.total ?? 10,
    },
  ]

  return (
    <section
      id="availability"
      className="py-20 sm:py-28"
      data-testid="availability-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-16 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl sm:text-4xl font-black font-headline" data-testid="availability-title">
              Disponibilidad<br />
              <span className="text-primary">en Tiempo Real</span>
            </h2>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30"
              data-testid="live-badge"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">En Vivo</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-on-surface-var">
              <span className="material-symbols-outlined text-base animate-spin-custom">sync</span>
              <span>Actualizando...</span>
            </div>
            <p className="text-xs text-on-surface-var/60 mt-1" data-testid="live-timestamp">
              Última Sync: <span suppressHydrationWarning>{time}</span>
            </p>
          </div>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 stagger-children">
          {gauges.map((gauge) => (
            <div
              key={gauge.label}
              className="glass rounded-xl p-8 flex flex-col items-center animate-scale-in hover-scale"
              data-testid={`gauge-card-${gauge.label.toLowerCase()}`}
            >
              <GaugeChart {...gauge} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useLiveClock } from '@/hooks/useLiveClock'
import { useCounter } from '@/hooks/useCounter'

interface GaugeData {
  icon: string
  label: string
  used: number
  total: number
  hasData: boolean
}

function GaugeChart({ used, total, icon, label, hasData }: GaugeData) {
  const percentage = total > 0 ? (used / total) * 100 : 0
  const displayPercentage = Math.round(percentage)
  const dashArray = hasData ? percentage : 0

  const { displayValue } = useCounter({
    target: used,
    duration: 1200,
  })

  return (
    <div className="flex flex-col items-center gap-3" data-testid={`gauge-${label.toLowerCase()}`}>
      <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-48 md:h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <path
            className="stroke-surface-high"
            fill="none"
            strokeWidth="3"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {hasData && (
            <path
              className="stroke-primary"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${dashArray}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              style={{ transition: 'stroke-dasharray 0.8s ease-in-out' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-primary mb-1">{icon}</span>
          {hasData ? (
            <span className="text-on-bg font-headline" style={{ fontSize: '2.25rem', fontWeight: 900 }} data-testid={`gauge-count-${label.toLowerCase()}`}>
              {displayValue}
              <span className="text-sm font-normal text-on-surface-var">/{total}</span>
            </span>
          ) : (
            <span className="text-on-surface-var font-headline" style={{ fontSize: '2.25rem', fontWeight: 900 }} data-testid={`gauge-count-${label.toLowerCase()}`}>
              —
            </span>
          )}
        </div>
      </div>
      <h3 className="text-primary font-headline" style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>{label}</h3>
      <p className="text-on-surface-var" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3em' }}>
        {hasData ? `${displayPercentage}% Ocupado` : 'No hay datos disponibles'}
      </p>
    </div>
  )
}

export function AvailabilitySection() {
  const availability = useAppStore((state) => state.availability)
  const loadingState = useAppStore((state) => state.loadingState)
  const fetchAvailability = useAppStore((state) => state.fetchAvailability)
  const { time } = useLiveClock()

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  const stats = availability?.stats
  const isLoading = loadingState.availability
  const hasData = stats != null

  const gauges: GaugeData[] = [
    {
      icon: 'directions_car',
      label: 'Vehículos',
      used: stats?.cars.used ?? 0,
      total: stats?.cars.total ?? 0,
      hasData,
    },
    {
      icon: 'motorcycle',
      label: 'Motos',
      used: stats?.motos.used ?? 0,
      total: stats?.motos.total ?? 0,
      hasData,
    },
    {
      icon: 'pedal_bike',
      label: 'Bicicletas',
      used: stats?.bikes.used ?? 0,
      total: stats?.bikes.total ?? 0,
      hasData,
    },
  ]

  return (
    <section
      id="availability"
      className="relative py-20 sm:py-28 bg-surface-low"
      data-testid="availability-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-16 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-headline" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, fontStyle: 'italic', textTransform: 'uppercase' }} data-testid="availability-title">
              Disponibilidad<br />
              <span className="text-primary">en Tiempo Real</span>
            </h2>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30"
              data-testid="live-badge"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">En Vivo</span>
            </div>
          </div>
          <div className="text-right">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-on-surface-var">
                <span className="material-symbols-outlined text-base animate-spin-custom">sync</span>
                <span>Cargando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-on-surface-var">
                <span className="material-symbols-outlined text-base animate-spin-custom">sync</span>
                <span>Actualizando...</span>
              </div>
            )}
            <p className="text-xs text-on-surface-var/60 mt-1" data-testid="live-timestamp">
              Última Sync: <span suppressHydrationWarning>{time}</span>
            </p>
          </div>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
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
      <div className="section-divider" />
    </section>
  )
}

import { useEffect, useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { formatTime } from '@/utils/formatters'

function formatScheduleTime(timeString: string | undefined, fallback: string): string {
  if (!timeString || !timeString.includes(':')) return fallback
  return formatTime(timeString)
}

export function LocationSection() {
  const schedule = useAppStore((state) => state.schedule)
  const fetchSchedule = useAppStore((state) => state.fetchSchedule)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const weekdayLabel = schedule
    ? `Lun – Sab: ${formatScheduleTime(schedule.weekday.open, '7:00 a.m.')} – ${formatScheduleTime(schedule.weekday.close, '7:00 p.m.')}`
    : 'Lun – Sab: 7:00 a.m. – 7:00 p.m.'

  const sundayLabel = schedule
    ? `Dom: ${formatScheduleTime(schedule.sunday.open, '9:00 a.m.')} – ${formatScheduleTime(schedule.sunday.close, '5:00 p.m.')}`
    : 'Dom: 9:00 a.m. – 5:00 p.m.'

  return (
    <section
      id="locations"
      className="py-20 sm:py-28"
      data-testid="location-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black font-headline" data-testid="location-title">
            Ubicación<br />
            <span className="text-primary">Estratégica</span>
          </h2>
          <p className="text-on-surface-var font-body mt-4 max-w-xl mx-auto leading-relaxed">
            Encuéntranos en el corazón de la zona rosa de Bogotá, garantizando
            acceso rápido a los puntos clave de la ciudad.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Info Card */}
          <div className="glass rounded-xl p-6 sm:p-8 animate-slide-up hover-scale" data-testid="location-info-card">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-bg font-headline">Sede Principal</h3>
                <p className="text-sm text-on-surface-var font-body mt-1">
                  Calle 82 # 15 - 35, Bogotá
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-on-surface-var font-body">
                <span className="material-symbols-outlined text-primary text-base">schedule</span>
                <span data-testid="schedule-weekday">{weekdayLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-var font-body">
                <span className="material-symbols-outlined text-primary text-base">schedule</span>
                <span data-testid="schedule-sunday">{sundayLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-on-surface-var font-body">
                <span className="material-symbols-outlined text-primary text-base">shield</span>
                <span>Zona de Alta Seguridad</span>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/gMQosEQEMPEKAqg57"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all duration-200 font-bold text-sm"
              data-testid="directions-btn"
            >
              <span className="material-symbols-outlined">near_me</span>
              Cómo Llegar
            </a>
          </div>

          {/* Map */}
          <div className="relative animate-slide-right" data-testid="location-map">
            <div className="absolute -inset-2 bg-primary/10 rounded-2xl blur-xl" />
            {!mapError ? (
              <img
                src="/images/Google AI/mapa.png"
                alt="Mapa de ubicación de Punto Park U en Bogotá"
                className="relative rounded-xl w-full h-auto hover-scale"
                loading="lazy"
                onError={() => setMapError(true)}
              />
            ) : (
              <div className="relative rounded-xl w-full aspect-[4/3] bg-surface-container flex items-center justify-center">
                <span className="text-on-surface-var font-body">Mapa no disponible</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

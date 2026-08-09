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
      className="relative py-20 sm:py-28 bg-bg"
      data-testid="location-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="font-headline mb-4" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, fontStyle: 'italic', textTransform: 'uppercase' }} data-testid="location-title">
            Ubicación<br />
            <span className="text-primary">Estratégica</span>
          </h2>
          <p className="text-on-surface-var font-body mt-4 max-w-xl mx-auto leading-relaxed" style={{ fontSize: '1.25rem' }}>
            Encuéntranos en el corazón de la zona rosa de Bogotá, garantizando
            acceso rápido a los puntos clave de la ciudad.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-10 items-start">
          {/* Info Card */}
          <div className="glass rounded-xl p-6 sm:p-8 animate-slide-up hover-scale border-l-8 border-primary" data-testid="location-info-card">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
              </div>
              <div>
                <h3 className="text-on-bg font-headline" style={{ fontSize: '1.875rem', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-0.02em' }}>Sede Principal</h3>
                <p className="text-on-surface-var font-body mt-1" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Calle 82 # 15 - 35, Bogotá
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-on-surface-var font-body" style={{ fontSize: '1.125rem' }}>
                <span className="material-symbols-outlined text-primary text-base">schedule</span>
                <span data-testid="schedule-weekday">{weekdayLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface-var font-body" style={{ fontSize: '1.125rem' }}>
                <span className="material-symbols-outlined text-primary text-base">schedule</span>
                <span data-testid="schedule-sunday">{sundayLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-on-surface-var font-body" style={{ fontSize: '1.125rem' }}>
                <span className="material-symbols-outlined text-primary text-base">shield</span>
                <span>Zona de Alta Seguridad</span>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/gMQosEQEMPEKAqg57"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-16 bg-primary text-on-primary rounded-xl font-black italic uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:brightness-110 transition-all"
              data-testid="directions-btn"
            >
              <span className="material-symbols-outlined">near_me</span>
              Cómo Llegar
            </a>
          </div>

          {/* Map */}
          <div className="relative animate-slide-right aspect-square" data-testid="location-map">
            <div className="absolute -inset-2 bg-primary/10 rounded-2xl blur-xl" />
            {!mapError ? (
              <img
                src="/images/Google AI/mapa.webp"
                alt="Mapa de ubicación de Punto Park U en Bogotá"
                className="relative rounded-xl w-full h-full object-cover hover-scale"
                loading="lazy"
                onError={() => setMapError(true)}
              />
            ) : (
              <div className="relative rounded-xl w-full h-full bg-surface-container flex items-center justify-center">
                <span className="text-on-surface-var font-body">Mapa no disponible</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="section-divider" />
    </section>
  )
}

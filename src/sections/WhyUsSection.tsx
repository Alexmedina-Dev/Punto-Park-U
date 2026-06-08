import { Card } from '@/components/ui'

interface WhyItem {
  icon: string
  title: string
  description: string
}

const WHY_ITEMS: WhyItem[] = [
  {
    icon: 'videocam',
    title: 'Vigilancia 24/7',
    description:
      'Sistemas de monitoreo avanzado que garantizan que tu vehículo está vigilado cada segundo del día.',
  },
  {
    icon: 'verified_user',
    title: 'Espacios Seguros',
    description:
      'Celdas amplias e integridad estructural diseñadas para todo tipo de vehículos con máxima seguridad.',
  },
  {
    icon: 'payments',
    title: 'Tarifas Accesibles',
    description:
      'Precios competitivos adaptados al núcleo urbano de Bogotá sin comprometer la calidad del servicio.',
  },
  {
    icon: 'near_me',
    title: 'Ubicación Privilegiada',
    description:
      'Posicionamiento estratégico en zonas de alto tráfico para máxima comodidad y acceso rápido.',
  },
]

export function WhyUsSection() {
  return (
    <section
      id="why"
      className="relative py-20 sm:py-28 bg-surface"
      data-testid="why-us-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center mb-16 font-headline" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, fontStyle: 'italic', textTransform: 'uppercase' }} data-testid="why-us-title">
          Tu<br /><span className="text-primary">Aliado</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {WHY_ITEMS.map((item) => (
            <Card
              key={item.title}
              variant="default"
              padding="lg"
              className="text-center flex flex-col items-center gap-4 animate-slide-up hover-scale border-t-4 border-primary bg-surface-high"
              data-testid={`why-card-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="material-symbols-outlined text-4xl text-primary">
                {item.icon}
              </span>
              <h3 className="text-primary font-label uppercase tracking-[0.3em]" style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                {item.title}
              </h3>
              <p className="text-on-surface-var font-body leading-relaxed" style={{ fontSize: '1.25rem' }}>
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
      <div className="section-divider" />
    </section>
  )
}

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
      className="py-20 sm:py-28"
      data-testid="why-us-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-black text-center mb-16 font-headline" data-testid="why-us-title">
          Tu<br /><span className="text-primary">Aliado</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {WHY_ITEMS.map((item) => (
            <Card
              key={item.title}
              variant="glass"
              padding="lg"
              className="text-center flex flex-col items-center gap-4 animate-slide-up hover-scale"
              data-testid={`why-card-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="material-symbols-outlined text-4xl text-primary">
                {item.icon}
              </span>
              <h3 className="text-lg font-bold text-primary font-headline">
                {item.title}
              </h3>
              <p className="text-sm text-on-surface-var font-body leading-relaxed">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

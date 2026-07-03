import { Card } from '@/components/ui'
import { useAppStore } from '@/stores/appStore'
import { formatCurrency } from '@/utils/formatters'
import { useEffect } from 'react'

interface PricingCardData {
  image: string
  alt: string
  title: string
  priceKey: 'car' | 'moto' | 'camioneta' | 'bike'
  fallbackPrice: number
  features: string[]
  objectFit?: 'cover' | 'contain'
  objectPosition?: string
}

const PRICING_CARDS: PricingCardData[] = [
  {
    image: '/images/Google AI/automovil.png',
    alt: 'Automóvil en parqueadero cubierto',
    title: 'Automóvil',
    priceKey: 'car',
    fallbackPrice: 3000,
    features: ['Parqueo Cubierto', 'Acceso Fácil'],
  },
  {
    image: '/images/Google AI/motocicleta.png',
    alt: 'Motocicleta en zona exclusiva',
    title: 'Motocicleta',
    priceKey: 'moto',
    fallbackPrice: 1500,
    features: ['Zona Exclusiva', 'Ingreso Rápido'],
  },
  {
    image: '/images/Google AI/camioneta.png',
    alt: 'Camioneta en espacio amplio',
    title: 'Camioneta / SUV',
    priceKey: 'camioneta',
    fallbackPrice: 3500,
    features: ['Espacios Amplios', 'Alta Comodidad'],
  },
  {
    image: '/images/Google AI/bicicleta.png',
    alt: 'Bicicleta en rack seguro',
    title: 'Bicicleta',
    priceKey: 'bike',
    fallbackPrice: 1000,
    features: ['Rack Seguro', 'Zona Protegida'],
    objectFit: 'cover' as const,
    objectPosition: '50% 15%' as const,
  },
]

export function PricingSection() {
  const tariffs = useAppStore((state) => state.tariffs)
  const fetchTariffs = useAppStore((state) => state.fetchTariffs)

  useEffect(() => {
    if (!tariffs) {
      fetchTariffs()
    }
  }, [tariffs, fetchTariffs])

  const getPrice = (card: PricingCardData): string => {
    if (!tariffs) return formatCurrency(card.fallbackPrice)
    const priceSet = tariffs[card.priceKey]
    if (!priceSet) return formatCurrency(card.fallbackPrice)

    return formatCurrency(priceSet.hour)
  }

  return (
    <section
      id="pricing"
      className="relative py-20 sm:py-28 bg-surface-low"
      data-testid="pricing-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-headline" style={{ fontSize: 'clamp(2.5rem, 6vw, 3.75rem)', fontWeight: 900, letterSpacing: '-0.02em', fontStyle: 'italic', textTransform: 'uppercase' }} data-testid="pricing-title">
            Tarifas Segun<br />
            <span className="text-primary">tu medio de transporte</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
          {PRICING_CARDS.map((card) => (
            <Card
              key={card.title}
              variant="default"
              padding="none"
              className="overflow-hidden text-center animate-slide-up hover-scale border-b-8 border-primary-container bg-surface"
              data-testid={`pricing-card-${card.title.toLowerCase().replace(/[\s/]+/g, '-')}`}
            >
              <div className="aspect-[4/3] overflow-hidden img-hover-zoom">
                <img
                  src={card.image}
                  alt={card.alt}
                  className={`w-full h-full ${card.objectFit === 'contain' ? 'object-contain p-2' : 'object-cover'}`}
                  style={card.objectPosition ? { objectPosition: card.objectPosition } : undefined}
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <h3 className="text-primary font-label uppercase tracking-[0.3em] mb-3" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                  {card.title}
                </h3>
                <p className="text-on-bg mb-4" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  {getPrice(card)}{' '}
                  <span className="text-sm font-normal text-on-surface-var">/ hora</span>
                </p>
                <ul className="space-y-2">
                  {card.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center justify-center gap-2 text-on-surface-var"
                      style={{ fontSize: '1rem' }}
                    >
                      <span className="material-symbols-outlined text-primary text-base">
                        check_circle
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <div className="section-divider" />
    </section>
  )
}

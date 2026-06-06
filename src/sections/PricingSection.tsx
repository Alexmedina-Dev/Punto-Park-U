import { Card } from '@/components/ui'
import { useAppStore } from '@/stores/appStore'
import { formatCurrency } from '@/utils/formatters'

interface PricingCardData {
  image: string
  alt: string
  title: string
  priceKey: 'car' | 'moto' | 'bike'
  fallbackPrice: number
  features: string[]
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
    priceKey: 'car',
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
  },
]

export function PricingSection() {
  const tariffs = useAppStore((state) => state.tariffs)

  const getPrice = (card: PricingCardData): string => {
    if (!tariffs) return formatCurrency(card.fallbackPrice)
    const priceSet = tariffs[card.priceKey]
    if (!priceSet) return formatCurrency(card.fallbackPrice)

    // For Camioneta/SUV, use car price * 1.17 approx (3500 vs 3000)
    if (card.title === 'Camioneta / SUV') {
      return formatCurrency(Math.round(priceSet.hour * 1.17))
    }
    return formatCurrency(priceSet.hour)
  }

  return (
    <section
      id="pricing"
      className="py-20 sm:py-28"
      data-testid="pricing-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black font-headline" data-testid="pricing-title">
            Tarifas Según<br />
            <span className="text-primary">tu medio de transporte</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_CARDS.map((card) => (
            <Card
              key={card.title}
              variant="glass"
              padding="none"
              className="overflow-hidden text-center"
              data-testid={`pricing-card-${card.title.toLowerCase().replace(/[\s/]+/g, '-')}`}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={card.image}
                  alt={card.alt}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-primary font-headline mb-3">
                  {card.title}
                </h3>
                <p className="text-3xl font-black text-on-bg mb-4">
                  {getPrice(card)}{' '}
                  <span className="text-sm font-normal text-on-surface-var">/ hora</span>
                </p>
                <ul className="space-y-2">
                  {card.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center justify-center gap-2 text-sm text-on-surface-var"
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
    </section>
  )
}

interface FluxStep {
  number: number
  title: string
  description: string
}

const FLUX_STEPS: FluxStep[] = [
  {
    number: 1,
    title: 'Visión Computacional',
    description:
      'Red neuronal entrenada con más de 50.000 imágenes de vehículos que identifica matrículas, marca, modelo y color en 0.3 segundos sin intervención humana.',
  },
  {
    number: 2,
    title: 'Asignación Inteligente',
    description:
      'Algoritmo de optimización que analiza la ocupación actual, el tamaño del vehículo y la duración estimada para asignar el espacio más conveniente en milisegundos.',
  },
  {
    number: 3,
    title: 'Analítica Predictiva',
    description:
      'Modelo de machine learning que detecta patrones anómalos de comportamiento y anticipa horas pico para ajustar la disponibilidad y el personal de forma automática.',
  },
]

export function FluxAISection() {
  return (
    <section
      id="flux-AI"
      className="relative py-20 sm:py-28 bg-surface-container"
      data-testid="flux-ai-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image Side */}
          <div className="relative order-2 lg:order-1 animate-slide-left">
            <div className="absolute -inset-2 bg-primary/10 rounded-2xl blur-xl" />
            <div className="relative glass rounded-2xl p-2 hover-scale">
              <img
                src="/images/Google AI/ai-security.webp"
                alt="Interfaz de seguridad con inteligencia artificial"
                className="rounded-xl w-full h-auto"
                data-testid="flux-ai-image"
                loading="lazy"
              />
            </div>
            {/* Latency Badge — hidden on mobile */}
            <div className="absolute -bottom-4 -right-4 sm:right-4 glass rounded-xl px-4 py-3 hidden lg:flex items-center gap-3 shadow-glow animate-scale-in animate-delay-500" data-testid="flux-badge">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 neon-glow">
                <span className="material-symbols-outlined text-primary text-xl">bolt</span>
              </div>
              <div>
                <div className="text-xs text-on-surface-var font-body">Latencia Flux</div>
                <div className="text-lg font-black text-primary font-headline">0.8 seg</div>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="order-1 lg:order-2 animate-slide-right">
            <h2 className="font-headline mb-4" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, fontStyle: 'italic', textTransform: 'uppercase' }} data-testid="flux-ai-title">
              Tecnología<br />
              <span className="text-primary">Flux AI</span>
            </h2>
            <p className="text-on-surface-var font-body mb-10" style={{ fontSize: '1.125rem', fontWeight: 300, lineHeight: 1.7 }}>
              Motor de inteligencia artificial propietario que procesa en tiempo
              real cada operación del parqueadero con latencia menor a 1 segundo.
            </p>

            <div className="space-y-8 stagger-children">
              {FLUX_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex gap-5 animate-slide-up"
                  data-testid={`flux-step-${step.number}`}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-lg text-primary font-headline">
                    {step.number}
                  </div>
                  <div>
                    <h4 className="text-primary font-headline" style={{ fontSize: '1.25rem', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                      {step.title}
                    </h4>
                    <p className="text-on-surface-var font-body" style={{ fontSize: '1rem', fontWeight: 300, lineHeight: 1.7 }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="section-divider" />
    </section>
  )
}

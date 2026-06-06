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
      className="py-20 sm:py-28"
      data-testid="flux-ai-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image Side */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-2 bg-primary/10 rounded-2xl blur-xl" />
            <div className="relative glass rounded-2xl p-2">
              <img
                src="/images/Google AI/ai-security.png"
                alt="Interfaz de seguridad con inteligencia artificial"
                className="rounded-xl w-full h-auto"
                data-testid="flux-ai-image"
              />
            </div>
            {/* Latency Badge */}
            <div className="absolute -bottom-4 -right-4 sm:right-4 glass rounded-xl px-4 py-3 flex items-center gap-3 shadow-glow" data-testid="flux-badge">
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
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl sm:text-4xl font-black font-headline mb-4" data-testid="flux-ai-title">
              Tecnología<br />
              <span className="text-primary">Flux AI</span>
            </h2>
            <p className="text-on-surface-var font-body leading-relaxed mb-10 text-base sm:text-lg">
              Motor de inteligencia artificial propietario que procesa en tiempo
              real cada operación del parqueadero con latencia menor a 1 segundo.
            </p>

            <div className="space-y-8">
              {FLUX_STEPS.map((step) => (
                <div
                  key={step.number}
                  className="flex gap-5"
                  data-testid={`flux-step-${step.number}`}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-lg text-primary font-headline">
                    {step.number}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-primary font-headline mb-2">
                      {step.title}
                    </h4>
                    <p className="text-sm text-on-surface-var font-body leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

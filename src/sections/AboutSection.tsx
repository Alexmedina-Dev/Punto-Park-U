import { Card } from '@/components/ui'

export function AboutSection() {
  return (
    <section
      id="about"
      className="relative py-20 sm:py-28 bg-surface-container"
      data-testid="about-section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Historia */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="animate-slide-up">
            <h2 className="font-headline mb-6" style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1, fontStyle: 'italic', textTransform: 'uppercase' }} data-testid="about-title">
              Nuestra Historia<br />
              <span style={{ fontSize: 'clamp(0.875rem, 2vw, 1.5rem)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', display: 'block', marginTop: '0.5rem', color: 'var(--primary, #a7c8ff)' }}>
                De lo Analógico a lo Digital
              </span>
            </h2>
            <p className="text-on-surface-var font-body leading-relaxed" style={{ fontSize: '1.25rem', lineHeight: 1.8, marginBottom: '3rem' }}>
              PUNTO PARK U nació observando los tradicionales parqueaderos de
              balasto y luz amarilla de Bogotá. Reconocimos la necesidad de
              evolucionar esa experiencia manual y lenta hacia un ecosistema
              digital. Hoy, hemos transformado el concepto de parqueo
              convencional en una solución inteligente, rápida y 100% confiable
              para la ciudad moderna.
            </p>
          </div>
          <div className="relative animate-slide-right">
            <div className="absolute -inset-2 bg-primary/20 rounded-xl blur-xl" />
            <img
              src="/images/Google AI/historia.webp"
              alt="Parqueadero tradicional de Bogotá con gravilla y lámparas amarillas"
              className="relative rounded-xl w-full h-[31.25rem] object-cover hover-scale"
              data-testid="about-image"
            />
          </div>
        </div>

        {/* Misión & Visión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20 stagger-children">
          <Card
            variant="glass"
            padding="lg"
            className="flex flex-col gap-4 animate-slide-up hover-scale border-t-8 border-primary"
            data-testid="mission-card"
          >
            <span className="material-symbols-outlined text-4xl text-primary">
              rocket_launch
            </span>
            <h3 className="text-primary font-label uppercase tracking-[0.3em]" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
              Nuestra Misión
            </h3>
            <p className="text-on-surface-var font-body leading-relaxed" style={{ fontSize: '1.25rem', lineHeight: 1.8 }}>
              Proporcionar un servicio de estacionamiento seguro, confiable y
              accesible para la comunidad, garantizando la protección de los
              vehículos mediante tecnología de punta con integración de
              Inteligencia Artificial, vigilancia total y un equipo altamente
              capacitado comprometido con la excelencia en el servicio al
              cliente.
            </p>
          </Card>
          <Card
            variant="glass"
            padding="lg"
            className="flex flex-col gap-4 animate-slide-up hover-scale border-t-8 border-primary"
            data-testid="vision-card"
          >
            <span className="material-symbols-outlined text-4xl text-primary">
              visibility
            </span>
            <h3 className="text-primary font-label uppercase tracking-[0.3em]" style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
              Nuestra Visión
            </h3>
            <p className="text-on-surface-var font-body leading-relaxed" style={{ fontSize: '1.25rem', lineHeight: 1.8 }}>
              Ser el Parqueadero líder y más confiable de la región, reconocido
              por nuestra innovación tecnológica, seguridad integral y
              excelencia en el servicio. Aspiramos a establecer nuevos
              estándares en la industria del estacionamiento mediante la
              implementación continua de soluciones inteligentes que brinden
              tranquilidad y comodidad a nuestros usuarios.
            </p>
          </Card>
        </div>
      </div>
      <div className="section-divider" />
    </section>
  )
}

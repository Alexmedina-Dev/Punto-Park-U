import { Layout } from '@/components/layout'
import { Card } from '@/components/ui'

export function LandingPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div
          className="glass rounded-lg px-8 py-12 text-center max-w-md"
          data-testid="welcome-card"
        >
          <h1 className="text-4xl font-black text-primary mb-4 font-headline">
            PUNTO PARK U
          </h1>
          <p className="text-on-surface-var font-body">
            Estacionamiento Fácil y Sencillo
          </p>
          <div className="mt-6 flex gap-4 justify-center">
            <a
              href="/login"
              className="px-6 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-fixed transition-colors"
            >
              Iniciar Sesión
            </a>
            <a
              href="/register"
              className="px-6 py-2 border border-outline text-on-surface rounded-lg hover:bg-surface-container transition-colors"
            >
              Registrarse
            </a>
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-16" id="why">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 font-headline">
            Tu<br /><span className="text-primary">Aliado</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glass" title="Vigilancia 24/7" className="text-center">
              <p className="text-sm text-on-surface-var">
                Sistemas de monitoreo avanzado que garantizan que tu vehículo está vigilado cada segundo del día.
              </p>
            </Card>
            <Card variant="glass" title="Espacios Seguros" className="text-center">
              <p className="text-sm text-on-surface-var">
                Celdas amplias e integridad estructural diseñadas para todo tipo de vehículos con máxima seguridad.
              </p>
            </Card>
            <Card variant="glass" title="Tarifas Accesibles" className="text-center">
              <p className="text-sm text-on-surface-var">
                Precios competitivos adaptados al núcleo urbano de Bogotá sin comprometer la calidad del servicio.
              </p>
            </Card>
            <Card variant="glass" title="Ubicación Privilegiada" className="text-center">
              <p className="text-sm text-on-surface-var">
                Posicionamiento estratégico en zonas de alto tráfico para máxima comodidad y acceso rápido.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16" id="about">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold font-headline mb-6">
                Nuestra Historia<br /><span className="text-primary text-lg font-normal">De lo Analógico a lo Digital</span>
              </h2>
              <p className="text-on-surface-var leading-relaxed">
                PUNTO PARK U nació observando los tradicionales parqueaderos de
                balasto y luz amarilla de Bogotá. Reconocimos la necesidad de
                evolucionar esa experiencia manual y lenta hacia un ecosistema
                digital. Hoy, hemos transformado el concepto de parqueo
                convencional en una solución inteligente, rápida y 100%
                confiable para la ciudad moderna.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/20 rounded-lg blur-xl" />
              <img
                src="/images/Google AI/historia.png"
                alt="Parqueadero tradicional de Bogotá"
                className="relative rounded-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16" id="pricing">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 font-headline">
            Tarifas Según <br /><span className="text-primary">tu medio de transporte</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glass" className="text-center">
              <h3 className="text-primary font-bold text-lg mb-2">Automóvil</h3>
              <p className="text-2xl font-bold text-on-bg mb-4">$3.000 <span className="text-sm text-on-surface-var">/ hora</span></p>
              <ul className="text-sm text-on-surface-var space-y-2">
                <li>✓ Parqueo Cubierto</li>
                <li>✓ Acceso Fácil</li>
              </ul>
            </Card>
            <Card variant="glass" className="text-center">
              <h3 className="text-primary font-bold text-lg mb-2">Motocicleta</h3>
              <p className="text-2xl font-bold text-on-bg mb-4">$1.500 <span className="text-sm text-on-surface-var">/ hora</span></p>
              <ul className="text-sm text-on-surface-var space-y-2">
                <li>✓ Zona Exclusiva</li>
                <li>✓ Ingreso Rápido</li>
              </ul>
            </Card>
            <Card variant="glass" className="text-center">
              <h3 className="text-primary font-bold text-lg mb-2">Camioneta / SUV</h3>
              <p className="text-2xl font-bold text-on-bg mb-4">$3.500 <span className="text-sm text-on-surface-var">/ hora</span></p>
              <ul className="text-sm text-on-surface-var space-y-2">
                <li>✓ Espacios Amplios</li>
                <li>✓ Alta Comodidad</li>
              </ul>
            </Card>
            <Card variant="glass" className="text-center">
              <h3 className="text-primary font-bold text-lg mb-2">Bicicleta</h3>
              <p className="text-2xl font-bold text-on-bg mb-4">$1.000 <span className="text-sm text-on-surface-var">/ hora</span></p>
              <ul className="text-sm text-on-surface-var space-y-2">
                <li>✓ Rack Seguro</li>
                <li>✓ Zona Protegida</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16" id="locations">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline mb-4">
              Ubicación<br /><span className="text-primary">Estratégica</span>
            </h2>
            <p className="text-on-surface-var max-w-xl mx-auto">
              Encuéntranos en el corazón de la zona rosa de Bogotá, garantizando
              acceso rápido a los puntos clave de la ciudad.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card variant="glass" className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">location_on</span>
                <div>
                  <h3 className="font-bold text-on-bg">Sede Principal</h3>
                  <p className="text-sm text-on-surface-var">Calle 82 # 15 - 35, Bogotá</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-on-surface-var">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  <span>Lun – Sáb: 7:00 a.m. – 7:00 p.m.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  <span>Dom: 9:00 a.m. – 5:00 p.m.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">shield</span>
                  <span>Zona de Alta Seguridad</span>
                </div>
              </div>
              <a
                href="https://maps.app.goo.gl/gMQosEQEMPEKAqg57"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-bold"
              >
                <span className="material-symbols-outlined text-base">near_me</span>
                Cómo Llegar
              </a>
            </Card>
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/10 rounded-lg blur-xl" />
              <img
                src="/images/Google AI/mapa.png"
                alt="Mapa de ubicación de Punto Park U en Bogotá"
                className="relative rounded-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

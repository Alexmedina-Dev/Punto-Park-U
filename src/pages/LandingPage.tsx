import { useEffect } from 'react'
import { Layout } from '@/components/layout'
import { Card } from '@/components/ui'
import { useParkingData } from '@/hooks/useParkingData'
import { formatCurrency } from '@/utils/formatters'

export function LandingPage() {
  const { tariffs, schedule, availability, fetchTariffs, fetchSchedule, fetchAvailability } =
    useParkingData()

  useEffect(() => {
    fetchTariffs()
    fetchSchedule()
    fetchAvailability()
  }, [fetchTariffs, fetchSchedule, fetchAvailability])

  const stats = availability?.stats
  const totalUsed = stats
    ? stats.cars.used + stats.motos.used + stats.bikes.used
    : 0
  const totalAvailable = stats
    ? stats.cars.total + stats.motos.total + stats.bikes.total
    : 0

  return (
    <Layout>
      {/* ═══ Hero Section ═══ */}
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

      {/* ═══ Why Us Section ═══ */}
      <section className="py-16" id="why">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 font-headline">
            Tu<br /><span className="text-primary">Aliado</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glass" title="Vigilancia 24/7" className="text-center">
              <p className="text-sm text-on-surface-var">
                Sistemas de monitoreo avanzado que garantizan que tu vehículo está
                vigilado cada segundo del día.
              </p>
            </Card>
            <Card variant="glass" title="Espacios Seguros" className="text-center">
              <p className="text-sm text-on-surface-var">
                Celdas amplias e integridad estructural diseñadas para todo tipo de
                vehículos con máxima seguridad.
              </p>
            </Card>
            <Card variant="glass" title="Tarifas Accesibles" className="text-center">
              <p className="text-sm text-on-surface-var">
                Precios competitivos adaptados al núcleo urbano de Bogotá sin
                comprometer la calidad del servicio.
              </p>
            </Card>
            <Card variant="glass" title="Ubicación Privilegiada" className="text-center">
              <p className="text-sm text-on-surface-var">
                Posicionamiento estratégico en zonas de alto tráfico para máxima
                comodidad y acceso rápido.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══ About Section ═══ */}
      <section className="py-16" id="about">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold font-headline mb-6">
                Nuestra Historia
                <br />
                <span className="text-primary text-lg font-normal">
                  De lo Analógico a lo Digital
                </span>
              </h2>
              <p className="text-on-surface-var leading-relaxed">
                PUNTO PARK U nació observando los tradicionales parqueaderos de
                balasto y luz amarilla de Bogotá. Reconocimos la necesidad de
                evolucionar esa experiencia manual y lenta hacia un ecosistema
                digital. Hoy, hemos transformado el concepto de parqueo
                convencional en una solución inteligente, rápida y 100% confiable
                para la ciudad moderna.
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

      {/* ═══ Pricing Section ═══ */}
      <section className="py-16" id="pricing">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 font-headline">
            Tarifas Según <br />
            <span className="text-primary">tu medio de transporte</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glass" className="text-center">
              <h3 className="text-primary font-bold text-lg mb-2">Automóvil</h3>
              <p className="text-2xl font-bold text-on-bg mb-4">
                {tariffs ? formatCurrency(tariffs.car.hour) : '$3.000'}{' '}
                <span className="text-sm text-on-surface-var">/ hora</span>
              </p>
              <ul className="text-sm text-on-surface-var space-y-2">
                <li>✓ Parqueo Cubierto</li>
                <li>✓ Acceso Fácil</li>
                <li>✓ Vigilancia 24/7</li>
              </ul>
            </Card>
            <Card variant="glass" className="text-center">
              <h3 className="text-primary font-bold text-lg mb-2">
                Motocicleta
              </h3>
              <p className="text-2xl font-bold text-on-bg mb-4">
                {tariffs ? formatCurrency(tariffs.moto.hour) : '$1.500'}{' '}
                <span className="text-sm text-on-surface-var">/ hora</span>
              </p>
              <ul className="text-sm text-on-surface-var space-y-2">
                <li>✓ Zona Exclusiva</li>
                <li>✓ Ingreso Rápido</li>
                <li>✓ Cámaras 24/7</li>
              </ul>
            </Card>
            <Card variant="glass" className="text-center">
              <h3 className="text-primary font-bold text-lg mb-2">
                Camioneta / SUV
              </h3>
              <p className="text-2xl font-bold text-on-bg mb-4">$3.500{' '}
                <span className="text-sm text-on-surface-var">/ hora</span>
              </p>
              <ul className="text-sm text-on-surface-var space-y-2">
                <li>✓ Espacios Amplios</li>
                <li>✓ Alta Comodidad</li>
                <li>✓ Acceso Preferencial</li>
              </ul>
            </Card>
            <Card variant="glass" className="text-center">
              <h3 className="text-primary font-bold text-lg mb-2">Bicicleta</h3>
              <p className="text-2xl font-bold text-on-bg mb-4">
                {tariffs ? formatCurrency(tariffs.bike.hour) : '$1.000'}{' '}
                <span className="text-sm text-on-surface-var">/ hora</span>
              </p>
              <ul className="text-sm text-on-surface-var space-y-2">
                <li>✓ Rack Seguro</li>
                <li>✓ Zona Protegida</li>
                <li>✓ Lockers</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══ Availability Section ═══ */}
      <section className="py-16" id="availability">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline mb-4">
              Disponibilidad
              <br />
              <span className="text-primary">en Tiempo Real</span>
            </h2>
            <p className="text-on-surface-var max-w-xl mx-auto">
              Consulta la disponibilidad actual de nuestro parqueadero antes de
              visitarnos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card variant="glass" className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {stats ? `${stats.cars.total - stats.cars.used}/${stats.cars.total}` : '15/15'}
              </div>
              <div className="text-sm text-on-surface-var">Automóviles</div>
              <div className="mt-2 w-full bg-surface-low rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: stats
                      ? `${((stats.cars.total - stats.cars.used) / stats.cars.total) * 100}%`
                      : '50%',
                  }}
                />
              </div>
            </Card>
            <Card variant="glass" className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {stats ? `${stats.motos.total - stats.motos.used}/${stats.motos.total}` : '10/10'}
              </div>
              <div className="text-sm text-on-surface-var">Motocicletas</div>
              <div className="mt-2 w-full bg-surface-low rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: stats
                      ? `${((stats.motos.total - stats.motos.used) / stats.motos.total) * 100}%`
                      : '50%',
                  }}
                />
              </div>
            </Card>
            <Card variant="glass" className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {stats ? `${stats.bikes.total - stats.bikes.used}/${stats.bikes.total}` : '5/5'}
              </div>
              <div className="text-sm text-on-surface-var">Bicicletas</div>
              <div className="mt-2 w-full bg-surface-low rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{
                    width: stats
                      ? `${((stats.bikes.total - stats.bikes.used) / stats.bikes.total) * 100}%`
                      : '50%',
                  }}
                />
              </div>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-on-surface-var">
              {totalAvailable - totalUsed} de {totalAvailable} espacios disponibles
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Flux AI Section ═══ */}
      <section className="py-16" id="flux-ai">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-primary/10 rounded-lg blur-xl" />
              <img
                src="/images/Google AI/flux-ai.png"
                alt="Flux AI - Inteligencia Artificial para parqueaderos"
                className="relative rounded-lg w-full"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold font-headline mb-4">
                Flux{' '}
                <span className="text-primary">
                  AI
                </span>
              </h2>
              <p className="text-on-surface-var leading-relaxed mb-4">
                Nuestro sistema de Inteligencia Artificial optimiza la asignación
                de espacios, predice la demanda y garantiza la máxima eficiencia
                operativa.
              </p>
              <ul className="space-y-2 text-sm text-on-surface-var">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">
                    vision
                  </span>
                  Visión por computadora para reconocimiento de placas
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">
                    analytics
                  </span>
                  Predicción de demanda con Machine Learning
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">
                    smart_toy
                  </span>
                  Asignación inteligente de espacios
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Location Section ═══ */}
      <section className="py-16" id="locations">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-headline mb-4">
              Ubicación
              <br />
              <span className="text-primary">Estratégica</span>
            </h2>
            <p className="text-on-surface-var max-w-xl mx-auto">
              Encuéntranos en el corazón de la zona rosa de Bogotá, garantizando
              acceso rápido a los puntos clave de la ciudad.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card variant="glass" className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">
                  location_on
                </span>
                <div>
                  <h3 className="font-bold text-on-bg">Sede Principal</h3>
                  <p className="text-sm text-on-surface-var">
                    Calle 82 # 15 - 35, Bogotá
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-on-surface-var">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    schedule
                  </span>
                  <span>
                    Lun – Sáb:{' '}
                    {schedule
                      ? `${schedule.weekday.open} – ${schedule.weekday.close}`
                      : '7:00 a.m. – 7:00 p.m.'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    schedule
                  </span>
                  <span>
                    Dom:{' '}
                    {schedule
                      ? `${schedule.sunday.open} – ${schedule.sunday.close}`
                      : '9:00 a.m. – 5:00 p.m.'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">
                    shield
                  </span>
                  <span>Zona de Alta Seguridad</span>
                </div>
              </div>

              <a
                href="https://maps.app.goo.gl/gMQosEQEMPEKAqg57"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-bold"
              >
                <span className="material-symbols-outlined text-base">
                  near_me
                </span>
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

import { useLiveClock } from '@/hooks/useLiveClock'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { time } = useLiveClock()

  return (
    <footer id="footer" className="bg-surface-low border-t border-outline/10" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand Section */}
          <div className="footer-section">
            <div className="flex items-center gap-2 mb-4">
              <picture>
                <source srcSet="/images/Logo.avif" type="image/avif" />
                <source srcSet="/images/Logo.webp" type="image/webp" />
                <img
                  src="/images/Logo.png"
                  alt="Logo Punto Park U"
                  className="h-10 w-auto"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <div className="text-primary font-black text-lg font-headline">
                &ldquo;PUNTO PARK U&rdquo;
              </div>
            </div>
            <p className="text-sm text-on-surface-var font-body">
              <strong className="text-on-surface">
                Estacionamiento fácil y sencillo
              </strong>{' '}
              para tu tranquilidad.
            </p>
            <p className="text-xs text-on-surface-var/60 mt-2">
              Recursos visuales generados por Google AI
            </p>
            {/* Live clock */}
            <div className="flex items-center gap-2 mt-4 text-xs text-on-surface-var/60">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span suppressHydrationWarning>{time}</span>
            </div>
          </div>

          {/* Contact Section */}
          <div className="footer-section">
            <h3 className="text-sm font-bold text-primary font-headline uppercase tracking-wider mb-4">
              Contacto
            </h3>
            <div className="space-y-3 text-sm text-on-surface-var font-body">
              <p>
                <strong className="text-on-surface">Dirección</strong>
                <br />
                Calle 82 # 15-35, Bogotá, Colombia
              </p>
              <p>
                <strong className="text-on-surface">Teléfono / WhatsApp</strong>
                <br />
                (+57) 310 123 4567
              </p>
              <p>
                <strong className="text-on-surface">Email</strong>
                <br />
                <a
                  href="mailto:puntoparku@gmail.com"
                  className="text-primary hover:text-primary-fixed transition-colors"
                >
                  puntoparku@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-outline/10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-on-surface-var font-body">
            &copy; {currentYear} &ldquo; PUNTO PARK U &rdquo;
          </p>
          <p className="text-xs text-on-surface-var/60 mt-1">
            Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  )
}

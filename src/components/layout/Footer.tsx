/**
 * Footer — pixel-matched to vanilla Punto-Park-U-Web.
 *
 * Vanilla responsive:
 * - Default: grid 1fr, gap 2.5rem, max-width 1440px
 * - 768px+: grid 2fr
 * - Copyright: flex center, gap 1rem, font 0.7rem uppercase
 */
export function Footer() {
  return (
    <footer
      id="footer"
      className="bg-surface-low pt-16 pb-0"
      data-testid="footer"
    >
      {/* Footer content grid */}
      <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        {/* Brand Section */}
        <div>
          <picture>
            <source srcSet="/images/Logo.avif" type="image/avif" />
            <source srcSet="/images/Logo.webp" type="image/webp" />
            <img
              src="/images/Logo.webp"
              alt="Logo Punto Park U"
              className="w-[180px] mb-4"
              loading="lazy"
              decoding="async"
            />
          </picture>
          <div className="text-[1.25rem] font-black text-on-bg font-headline mb-2">
            &ldquo;PUNTO PARK U&rdquo;
          </div>
          <p className="text-[0.9rem] leading-[1.8] block" style={{ color: 'rgba(225,226,236,0.6)' }}>
            <strong style={{ color: 'var(--on-surface-var)' }}>
              Estacionamiento facil y sencillo para tu tranquilidad.
            </strong>
          </p>
          <p className="text-[0.9rem] leading-[1.8] mt-2 block" style={{ color: 'rgba(225,226,236,0.6)' }}>
            Creditos de imagen: Recursos visuales generados por Google AI
          </p>
        </div>

        {/* Contact Section */}
        <div>
          <h3 className="text-[1rem] font-label uppercase tracking-[0.3em] text-primary mb-5">
            Contacto
          </h3>
          <div className="space-y-3">
            <p className="text-[0.9rem] leading-[1.8] block" style={{ color: 'rgba(225,226,236,0.6)' }}>
              <strong style={{ color: 'var(--on-surface-var)' }}>Direccion</strong>
              <br />
              Calle 82 # 15-35, Bogota, Colombia
            </p>
            <p className="text-[0.9rem] leading-[1.8] block" style={{ color: 'rgba(225,226,236,0.6)' }}>
              <strong style={{ color: 'var(--on-surface-var)' }}>Telefono / WhatsApp</strong>
              <br />
              (+57) 310 123 4567
            </p>
            <p className="text-[0.9rem] leading-[1.8] block" style={{ color: 'rgba(225,226,236,0.6)' }}>
              <strong style={{ color: 'var(--on-surface-var)' }}>Email</strong>
              <br />
              <a
                href="mailto:puntoparku@gmail.com"
                className="transition-colors hover:text-primary"
                style={{ color: 'rgba(225,226,236,0.6)' }}
              >
                puntoparku@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Copyright — matching vanilla flex center layout */}
      <div className="max-w-[1440px] mx-auto px-8 py-6 border-t flex flex-wrap justify-center items-center gap-4" style={{ borderColor: 'rgba(65,71,83,0.2)' }}>
        <p className="font-label text-[0.7rem] uppercase tracking-[0.3em]" style={{ color: 'rgba(225,226,236,0.4)' }}>
          &copy; {new Date().getFullYear()} &ldquo; PUNTO PARK U &rdquo;
        </p>
        <p className="font-label text-[0.7rem] uppercase tracking-[0.3em]" style={{ color: 'rgba(225,226,236,0.4)' }}>
          Todos los derechos reservados
        </p>
      </div>
    </footer>
  )
}

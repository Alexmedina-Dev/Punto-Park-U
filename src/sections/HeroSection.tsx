import { useEffect, useRef, useState } from 'react'

/**
 * Hero section — EXACT match to vanilla Punto-Park-U-Web Styles.css.
 *
 * Vanilla CSS (desktop-first):
 *   .hero         { display:flex; flex-direction:row-reverse; align-items:center;
 *                   min-height:100svh; gap:0; overflow:hidden }
 *   .hero-bg      { flex:2; position:relative; inset:0 }
 *   .hero-bg img  { width:100%; height:100%; object-fit:cover }
 *   .container    { flex:1; min-width:0 }
 *
 *   @media (max-width:767px):
 *     .hero           { flex-direction:column; min-height:60vh; padding:30px 5px;
 *                       text-align:center; align-items:center; height:auto }
 *     .container      { order:1; width:100%; margin-bottom:10px }
 *     .hero-bg        { order:2; width:100%; height:auto; display:flex;
 *                       justify-content:center }
 *     .hero-bg img    { width:90%; max-width:450px; height:auto }
 *     .hero h1        { font-size:clamp(2rem,8vw,3.5rem) }
 *
 *   @media (min-width:768px):
 *     .hero           { min-height:0; padding-top:40px }
 *
 *   @media (min-width:1024px):
 *     .hero           { min-height:max(921px,100svh) }
 *
 * Tailwind translation (mobile-first):
 *   Default (mobile < 768):  flex-col, min-h-[60vh], p-[30px_5px], text-center, items-center
 *   md (768+):               flex-row-reverse, min-h-0, pt-10, text-left
 *   lg (1024+):              min-h-[max(921px,100svh)]
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Parallax — desktop only
  useEffect(() => {
    if (!isDesktop) return
    const section = sectionRef.current
    if (!section) return
    const imgWrap = section.querySelector('.hero-img-wrap') as HTMLElement
    if (!imgWrap) return

    const handleScroll = () => {
      imgWrap.style.transform = `translateY(${window.pageYOffset * 0.1}px)`
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDesktop])

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex overflow-hidden gap-0
                 items-center flex-col min-h-[60vh] px-[5px] pt-20 text-center
                 md:flex-row-reverse md:min-h-0 md:pt-10 md:text-left md:items-center
                 lg:min-h-[70vh]"
      data-testid="hero-section"
    >
      {/* ── IMAGE SIDE (.hero-bg) ── */}
      {/* Mobile: flow, order 2, centered, image 90%/450px
          md+: flow, order 1, flex-2, image fills container
          lg+: same but section has min-height so flex-2 gets real height */}
      <div
        className="relative w-full flex justify-center order-2
                   md:order-1 md:flex-[2]
                   md:w-auto md:h-auto"
        style={{ zIndex: 0 }}
      >
        {/* Image wrapper */}
        <div className="hero-img-wrap w-[90%] max-w-[450px] md:w-full md:max-w-none will-change-transform">
          <img
            src="/images/Google AI/hero-background.png"
            alt="Parqueadero moderno en Bogota con autos, motos y bicicletas en iluminacion neon"
            className="w-full h-auto md:h-full md:object-cover block"
            style={{ objectPosition: 'center right' }}
            width="1200"
            height="630"
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Overlay — desktop only */}
        <div
          className="absolute inset-0 z-[1] hidden lg:block pointer-events-none"
          style={{
            background: 'linear-gradient(to right, var(--bg, #10131a) 0%, rgba(16,19,26,0.6) 10%, transparent 60%)',
          }}
        />
      </div>

      {/* ── CONTENT SIDE (.container + .hero-content) ── */}
      {/* Mobile: flow, order 1, full width
          md+: flow, order 2, flex-1 */}
      <div className="relative z-10 w-full order-1 md:order-2 md:flex-[1] md:min-w-0">
        <div className="max-w-[64rem] mx-auto md:mx-0 px-4 md:px-0">
          <h1
            className="text-primary font-headline font-black leading-[1.1] mb-4 md:mb-6
                       text-[clamp(2rem,8vw,3.5rem)] md:text-[clamp(3rem,7vw,6rem)]"
            style={{ letterSpacing: '-0.05em' }}
            data-testid="hero-title"
          >
            &ldquo;PUNTO PARK U&rdquo;
          </h1>
          <p
            className="text-on-surface-var animate-slide-up animate-delay-200"
            style={{
              fontSize: 'clamp(1.25rem, 3vw, 2rem)',
              fontWeight: 600,
              opacity: 0.85,
            }}
            data-testid="hero-subtitle"
          >
            Estacionamiento Facil y Sencillo
          </p>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

export function HeroSection() {
  const bgRef = useRef<HTMLDivElement>(null)

  // Parallax effect on scroll
  useEffect(() => {
    const el = bgRef.current
    if (!el) return

    const handleScroll = () => {
      const scrollY = window.pageYOffset
      // Move background at 0.4x speed for subtle parallax
      el.style.transform = `translateY(${scrollY * 0.4}px)`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section
      id="hero"
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
      data-testid="hero-section"
    >
      {/* Background Image with parallax */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform" aria-hidden="true">
        <img
          src="/images/Google AI/hero-background.png"
          alt=""
          className="w-full h-[120%] object-cover"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Content — fade-in on mount */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
        <div className="glass inline-block rounded-2xl px-8 sm:px-12 py-10 sm:py-14 max-w-2xl mx-auto backdrop-blur-md">
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black text-primary font-headline tracking-tight"
            data-testid="hero-title"
          >
            &ldquo;PUNTO PARK U&rdquo;
          </h1>
          <p
            className="mt-4 text-lg sm:text-xl text-on-surface-var font-body animate-slide-up animate-delay-200"
            data-testid="hero-subtitle"
          >
            Estacionamiento Fácil y Sencillo
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animate-delay-400">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3 bg-primary text-on-primary rounded-xl font-bold text-base hover:bg-primary-fixed transition-all duration-200 text-center"
              data-testid="hero-login-btn"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3 border border-outline text-on-surface rounded-xl font-bold text-base hover:bg-surface-container transition-all duration-200 text-center"
              data-testid="hero-register-btn"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'

const NAV_ITEMS = [
  { id: 'why', label: 'Tu Aliado' },
  { id: 'about', label: 'Historia' },
  { id: 'pricing', label: 'Tarifas' },
  { id: 'availability', label: 'Disponibilidad' },
  { id: 'flux-AI', label: 'Tecnología' },
  { id: 'locations', label: 'Ubicación' },
  { id: 'footer', label: 'Información' },
]

export function Header() {
  const location = useLocation()
  const { isAuthenticated, isAdmin } = useAuthStore()
  const { isMobileMenuOpen, toggleMobileMenu } = useAppStore()
  const isLanding = location.pathname === '/'
  const [activeSection, setActiveSection] = useState('')

  // Smooth scroll for anchor links
  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault()
    const target = document.getElementById(id)
    if (!target) return

    const headerHeight = document.querySelector('header')?.offsetHeight ?? 64
    const top =
      target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 15

    window.scrollTo({ top, behavior: 'smooth' })
  }

  // Intersection Observer for active section
  useEffect(() => {
    if (!isLanding) return

    const sections = document.querySelectorAll('section[id]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.35 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [isLanding])

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-primary font-black text-xl font-headline"
            data-testid="header-logo"
          >
            <picture>
              <source srcSet="/images/Logo.avif" type="image/avif" />
              <source srcSet="/images/Logo.webp" type="image/webp" />
              <img
                src="/images/Logo.png"
                alt="Punto Park U"
                className="h-8 w-auto"
                loading="lazy"
              />
            </picture>
            <span className="hidden sm:inline">PUNTO PARK U</span>
          </Link>

          {/* Desktop Navigation */}
          <div
            className="hidden lg:flex items-center gap-6"
            data-testid="desktop-nav"
          >
            {isLanding && (
              <>
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => handleAnchorClick(e, item.id)}
                    className={`text-sm transition-colors font-body ${
                      activeSection === item.id
                        ? 'text-primary font-bold'
                        : 'text-on-surface-var hover:text-primary'
                    }`}
                    data-testid={`nav-${item.id}`}
                  >
                    {item.label}
                  </a>
                ))}
              </>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-sm px-4 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors font-bold"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  className="text-sm px-4 py-1.5 bg-primary text-on-primary rounded-lg hover:bg-primary-fixed transition-colors font-bold"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm px-4 py-1.5 border border-outline text-on-surface rounded-lg hover:bg-surface-container transition-colors font-bold"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="text-sm px-4 py-1.5 bg-primary text-on-primary rounded-lg hover:bg-primary-fixed transition-colors font-bold"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle — CSS animated hamburger */}
          <button
            onClick={toggleMobileMenu}
            className={`lg:hidden p-2 text-on-surface-var hover:text-on-bg transition-colors ${
              isMobileMenuOpen ? 'hamburger-open' : ''
            }`}
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            data-testid="mobile-menu-toggle"
          >
            <div className="w-6 h-5 relative flex flex-col justify-center gap-[5px]">
              <span
                className={`hamburger-line hamburger-line-top block h-[2px] w-full rounded-full bg-current transition-all duration-300 ease-out origin-center ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-[3.5px]' : ''
                }`}
              />
              <span
                className={`hamburger-line hamburger-line-middle block h-[2px] w-full rounded-full bg-current transition-all duration-300 ease-out ${
                  isMobileMenuOpen ? 'opacity-0 scale-x-0' : ''
                }`}
              />
              <span
                className={`hamburger-line hamburger-line-bottom block h-[2px] w-full rounded-full bg-current transition-all duration-300 ease-out origin-center ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-[3.5px]' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </nav>
    </header>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'

export function Header() {
  const location = useLocation()
  const { isAuthenticated, isAdmin } = useAuthStore()
  const { isMobileMenuOpen, toggleMobileMenu } = useAppStore()
  const isLanding = location.pathname === '/'

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
                <a
                  href="#why"
                  className="text-sm text-on-surface-var hover:text-primary transition-colors font-body"
                >
                  Tu Aliado
                </a>
                <a
                  href="#about"
                  className="text-sm text-on-surface-var hover:text-primary transition-colors font-body"
                >
                  Historia
                </a>
                <a
                  href="#pricing"
                  className="text-sm text-on-surface-var hover:text-primary transition-colors font-body"
                >
                  Tarifas
                </a>
                <a
                  href="#availability"
                  className="text-sm text-on-surface-var hover:text-primary transition-colors font-body"
                >
                  Disponibilidad
                </a>
                <a
                  href="#locations"
                  className="text-sm text-on-surface-var hover:text-primary transition-colors font-body"
                >
                  Ubicación
                </a>
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

          {/* Mobile menu toggle */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 text-on-surface-var hover:text-on-bg transition-colors"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            data-testid="mobile-menu-toggle"
          >
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </nav>
    </header>
  )
}

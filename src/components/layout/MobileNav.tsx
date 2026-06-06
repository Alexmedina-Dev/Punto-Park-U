import { Link } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'

export function MobileNav() {
  const { isMobileMenuOpen, closeMobileMenu } = useAppStore()
  const { isAuthenticated, isAdmin } = useAuthStore()

  // Close menu when a link is clicked
  const handleLinkClick = () => {
    closeMobileMenu()
  }

  if (!isMobileMenuOpen) return null

  return (
    <div
      className="fixed inset-0 z-30 lg:hidden"
      data-testid="mobile-nav"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeMobileMenu}
      />

      {/* Slide-down menu */}
      <nav
        className="relative mt-16 mx-4 bg-surface-container border border-outline/20 rounded-lg shadow-brutal p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="flex flex-col gap-3">
          {/* Landing page links */}
          <a
            href="#why"
            className="mobile-link text-on-surface-var hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-surface-high"
            onClick={handleLinkClick}
          >
            Tu Aliado
          </a>
          <a
            href="#about"
            className="mobile-link text-on-surface-var hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-surface-high"
            onClick={handleLinkClick}
          >
            Historia
          </a>
          <a
            href="#pricing"
            className="mobile-link text-on-surface-var hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-surface-high"
            onClick={handleLinkClick}
          >
            Tarifas
          </a>
          <a
            href="#availability"
            className="mobile-link text-on-surface-var hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-surface-high"
            onClick={handleLinkClick}
          >
            Disponibilidad
          </a>
          <a
            href="#locations"
            className="mobile-link text-on-surface-var hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-surface-high"
            onClick={handleLinkClick}
          >
            Ubicación
          </a>

          <hr className="border-outline/20 my-2" />

          {/* Auth links */}
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-primary hover:text-primary-fixed transition-colors py-2 px-3 rounded-lg hover:bg-surface-high font-bold"
                  onClick={handleLinkClick}
                >
                  Panel Admin
                </Link>
              )}
              <Link
                to="/dashboard"
                className="bg-primary text-on-primary text-center rounded-lg py-2 px-3 font-bold hover:bg-primary-fixed transition-colors"
                onClick={handleLinkClick}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-primary hover:text-primary-fixed transition-colors py-2 px-3 rounded-lg hover:bg-surface-high font-bold"
                onClick={handleLinkClick}
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-primary text-on-primary text-center rounded-lg py-2 px-3 font-bold hover:bg-primary-fixed transition-colors"
                onClick={handleLinkClick}
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}

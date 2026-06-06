import { Link } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'

const NAV_ITEMS = [
  { id: 'why', label: 'Tu Aliado' },
  { id: 'about', label: 'Historia' },
  { id: 'pricing', label: 'Tarifas' },
  { id: 'availability', label: 'Disponibilidad' },
  { id: 'flux-AI', label: 'Tecnología' },
  { id: 'locations', label: 'Ubicación' },
  { id: 'footer', label: 'Información' },
]

export function MobileNav() {
  const { isMobileMenuOpen, closeMobileMenu } = useAppStore()
  const { isAuthenticated, isAdmin } = useAuthStore()

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    closeMobileMenu()

    // Small delay for the menu to close
    setTimeout(() => {
      const target = document.getElementById(id)
      if (!target) return
      const headerHeight = document.querySelector('header')?.offsetHeight ?? 64
      const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 15
      window.scrollTo({ top, behavior: 'smooth' })
    }, 300)
  }

  if (!isMobileMenuOpen) return null

  return (
    <div className="fixed inset-0 z-30 lg:hidden" data-testid="mobile-nav">
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
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-on-surface-var hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-surface-high"
              onClick={(e) => handleAnchorClick(e, item.id)}
            >
              {item.label}
            </a>
          ))}

          <hr className="border-outline/20 my-2" />

          {/* Auth links */}
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="text-primary hover:text-primary-fixed transition-colors py-2 px-3 rounded-lg hover:bg-surface-high font-bold"
                  onClick={closeMobileMenu}
                >
                  Panel Admin
                </Link>
              )}
              <Link
                to="/dashboard"
                className="bg-primary text-on-primary text-center rounded-lg py-2 px-3 font-bold hover:bg-primary-fixed transition-colors"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-primary hover:text-primary-fixed transition-colors py-2 px-3 rounded-lg hover:bg-surface-high font-bold"
                onClick={closeMobileMenu}
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                className="bg-primary text-on-primary text-center rounded-lg py-2 px-3 font-bold hover:bg-primary-fixed transition-colors"
                onClick={closeMobileMenu}
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

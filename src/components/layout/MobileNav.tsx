import { useEffect, useRef, useState } from 'react'
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
  const [shouldRender, setShouldRender] = useState(false)
  const [animate, setAnimate] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Mount animation lifecycle + body scroll lock
  useEffect(() => {
    if (isMobileMenuOpen) {
      setShouldRender(true)
      // Lock body scroll
      document.body.style.overflow = 'hidden'
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true))
      })
    } else if (shouldRender) {
      // Trigger exit animation
      setAnimate(false)
      // Restore body scroll (with delay to let animation finish)
      const timer = setTimeout(() => {
        setShouldRender(false)
        document.body.style.overflow = ''
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [isMobileMenuOpen, shouldRender])

  // Close on Escape key
  useEffect(() => {
    if (!shouldRender) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobileMenu()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [shouldRender, closeMobileMenu])

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

  if (!shouldRender) return null

  return (
    <div
      className={`fixed inset-0 z-30 lg:hidden transition-all duration-250 ease-out ${
        animate ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent backdrop-blur-none'
      }`}
      data-testid="mobile-nav"
    >
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0"
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Slide-down menu */}
      <nav
        ref={menuRef}
        className={`relative mt-16 mx-4 bg-surface-container border border-outline/20 rounded-lg shadow-brutal p-6 ${
          animate ? 'mobile-nav-enter' : 'mobile-nav-exit'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        {/* Close button inside menu */}
        <button
          onClick={closeMobileMenu}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-var hover:text-on-bg hover:bg-surface-high transition-colors"
          aria-label="Cerrar menú"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="flex flex-col gap-3 pt-2">
          {/* Landing page links */}
          {NAV_ITEMS.map((item, idx) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`text-on-surface-var hover:text-primary transition-all py-2 px-3 rounded-lg hover:bg-surface-high ${
                animate
                  ? 'opacity-100 translate-x-0'
                  : 'opacity-0 -translate-x-3'
              }`}
              style={{
                transitionDuration: '250ms',
                transitionDelay: animate ? `${idx * 50}ms` : '0ms',
                transitionProperty: 'opacity, transform',
              }}
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

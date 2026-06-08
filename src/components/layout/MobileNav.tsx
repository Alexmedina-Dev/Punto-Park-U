import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/appStore'
import { useAuthStore } from '@/stores/authStore'
import { showSuccessToast } from '@/utils/errorHandler'
import { ROUTES } from '@/utils/constants'

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
  const navigate = useNavigate()
  const { isMobileMenuOpen, closeMobileMenu } = useAppStore()
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore()
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
      className={`fixed inset-0 z-30 lg:hidden overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)] ${
        animate ? 'translate-y-0' : '-translate-y-full'
      }`}
      data-testid="mobile-nav"
      style={{ background: 'var(--bg, #10131a)' }}
    >
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0"
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Full-screen menu like vanilla */}
      <nav
        ref={menuRef}
        className="relative flex flex-col px-5 sm:px-8 pt-16 sm:pt-20 pb-6 sm:pb-8 h-full overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div className="flex flex-col gap-5">
          {/* Landing page links */}
          {NAV_ITEMS.map((item, idx) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`text-on-bg hover:text-primary transition-colors text-[1.5rem] sm:text-[1.75rem] font-black italic uppercase tracking-tight ${
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
              {/* User info */}
              <div className="px-3 py-2 border-b border-outline/10 mb-2">
                <p className="text-sm font-medium text-on-bg truncate">
                  {user?.nombres || user?.username || user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-on-surface-var truncate">{user?.email || ''}</p>
              </div>

              <Link
                to="/dashboard"
                className="bg-primary text-on-primary text-center rounded-lg py-2 px-3 font-bold hover:bg-primary-fixed transition-colors"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>

              <Link
                to="/dashboard?tab=sessions"
                className="text-on-surface-var hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-surface-high"
                onClick={closeMobileMenu}
              >
                Mis Sesiones
              </Link>

              <hr className="border-outline/20 my-2" />

              <button
                onClick={() => {
                  closeMobileMenu()
                  logout()
                  showSuccessToast('Sesión cerrada correctamente')
                  navigate('/')
                }}
                className="w-full text-left text-red-400 hover:bg-surface-high transition-colors py-2 px-3 rounded-lg text-sm"
              >
                Cerrar Sesión
              </button>
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
                to="/admin/login"
                className="bg-primary text-on-primary text-center rounded-lg py-2 px-3 font-bold hover:bg-primary-fixed transition-colors"
                onClick={closeMobileMenu}
              >
                Administrador
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { showSuccessToast } from '@/utils/errorHandler'
import { ROUTES } from '@/utils/constants'
import { NotificationBell } from '@/components/NotificationBell'
import { NotificationPrompt } from '@/components/NotificationPrompt'

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
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore()
  const { isMobileMenuOpen, toggleMobileMenu } = useAppStore()
  const isLanding = location.pathname === '/'
  const [activeSection, setActiveSection] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close user menu on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleLogout = () => {
    setLoggingOut(true)
    logout()
    showSuccessToast('Sesión cerrada correctamente')
    setLoggingOut(false)
    setUserMenuOpen(false)
    navigate(ROUTES.HOME)
  }

  const getUserDisplayName = () => {
    return user?.nombres || user?.username || user?.email?.split('@')[0] || 'Usuario'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    const parts = name.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

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
    <header className="fixed top-0 left-0 right-0 z-40 glass" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}>
      <nav className={`mx-auto px-4 sm:px-6 lg:px-8 ${isLanding ? '' : 'max-w-7xl'}`}>
        <div className={`flex items-center h-16 ${isLanding ? 'justify-center' : 'justify-between'}`}>
          {/* Logo — hidden on landing to match vanilla */}
          {!isLanding && (
            <Link
              to="/"
              className="flex items-center gap-2 text-primary font-black text-xl font-headline"
              data-testid="header-logo"
            >
              <picture>
                <source srcSet="/images/Logo.avif" type="image/avif" />
                <source srcSet="/images/Logo.webp" type="image/webp" />
                <img
                  src="/images/Logo.webp"
                  alt="Punto Park U"
                  className="h-8 w-auto"
                  loading="lazy"
                />
              </picture>
              <span className="hidden sm:inline">PUNTO PARK U</span>
            </Link>
          )}

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
                    className={`font-label uppercase tracking-[0.2em] text-[0.7rem] transition-colors ${
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
                {/* Notification Bell (PR 4) */}
                <NotificationBell />

                {/* User Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                    data-testid="user-menu-toggle"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                      {getUserInitials()}
                    </div>
                    <span className="text-sm font-medium text-on-bg max-w-[120px] truncate">
                      {getUserDisplayName()}
                    </span>
                    <span className={`material-symbols-outlined text-sm text-on-surface-var transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-surface-container border border-outline/20 rounded-lg shadow-brutal py-1 z-50">
                      {/* User info header */}
                      <div className="px-4 py-2 border-b border-outline/10">
                        <p className="text-sm font-medium text-on-bg truncate">{getUserDisplayName()}</p>
                        <p className="text-xs text-on-surface-var truncate">{user?.email || ''}</p>
                        {user?.role && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold capitalize">
                            {user.role === 'admin' ? 'Admin' : user.role === 'operator' ? 'Operador' : 'Usuario'}
                          </span>
                        )}
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-on-bg hover:bg-surface-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">dashboard</span>
                        Dashboard
                      </Link>

                      <Link
                        to="/dashboard?tab=sessions"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-on-bg hover:bg-surface-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">devices</span>
                        Mis Sesiones
                      </Link>

                      <hr className="border-outline/10 my-1" />

                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-surface-high transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        {loggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="font-label uppercase tracking-[0.15em] text-xs px-4 py-1.5 border border-[rgba(167,200,255,0.3)] rounded-full bg-transparent text-primary hover:bg-primary/10 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/admin/login"
                  className="font-label uppercase tracking-[0.15em] text-xs px-4 py-1.5 border border-[rgba(167,200,255,0.3)] rounded-full bg-transparent text-primary hover:bg-primary/10 transition-colors"
                >
                  Administrador
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle — vanilla style on landing, compact on internal pages */}
          {isLanding ? (
            <button
              onClick={toggleMobileMenu}
              className={`lg:hidden relative flex items-center w-full h-16 bg-surface-high border rounded-lg overflow-hidden transition-all duration-200 ${
                isMobileMenuOpen
                  ? 'border-[rgba(167,200,255,0.5)]'
                  : 'border-[rgba(167,200,255,0.25)] hover:border-[rgba(167,200,255,0.5)]'
              }`}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              data-testid="mobile-menu-toggle"
            >
              {/* Garaje image left */}
              {!isMobileMenuOpen && (
                <picture className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                  <source srcSet="/images/Garaje.avif" type="image/avif" />
                  <source srcSet="/images/Garaje.webp" type="image/webp" />
                  <img src="/images/Garaje.webp" alt="" className="w-12 h-12 object-contain" loading="lazy" />
                </picture>
              )}

              {/* Road animation */}
              {!isMobileMenuOpen && (
                <div className="absolute left-14 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[linear-gradient(90deg,rgba(255,255,255,0.3)_50%,transparent_50%)] bg-[length:30px_2px] animate-move-road pointer-events-none" />
              )}

              {/* Vehicles — positioned absolutely for drive-to-left animation */}
              {!isMobileMenuOpen && (
                <>
                  <svg className="vehicle-animation vehicle-car text-primary" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor"
                      d="M544 192h-16L419.21 56.02A63.99 63.99 0 0 0 369.24 32H155.33c-26.17 0-49.7 15.93-59.42 40.23L48 194.26C20.44 201.4 0 226.21 0 256v112c0 8.84 7.16 16 16 16h48c0 53.02 42.98 96 96 96s96-42.98 96-96h128c0 53.02 42.98 96 96 96s96-42.98 96-96h48c8.84 0 16-7.16 16-16v-80c0-53.02-42.98-96-96-96zM160 432c-26.47 0-48-21.53-48-48s21.53-48 48-48 48 21.53 48 48-21.53 48-48 48zm72-240H116.93l38.4-96H232v96zm48 0V96h89.24l76.8 96H280zm200 240c-26.47 0-48-21.53-48-48s21.53-48 48-48 48 21.53 48 48-21.53 48-48 48z" />
                  </svg>
                  <svg className="vehicle-animation vehicle-moto text-primary" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor"
                      d="M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM7.82 15C7.4 16.15 6.28 17 5 17c-1.63 0-3-1.37-3-3s1.37-3 3-3c1.28 0 2.4.85 2.82 2H5v2h2.82zM19 17c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                  </svg>
                  <svg className="vehicle-animation vehicle-bike text-primary" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor"
                      d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
                  </svg>
                </>
              )}

              {/* Close overlay */}
              {isMobileMenuOpen && (
                <span className="absolute inset-0 flex items-center justify-center text-red-400 font-black text-lg tracking-wider z-20 bg-surface-high uppercase">
                  ✕ CERRAR
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={toggleMobileMenu}
              className={`lg:hidden flex items-center justify-center gap-2 px-4 py-2 h-12 rounded-lg border transition-all duration-200 ${
                isMobileMenuOpen
                  ? 'bg-surface-high border-[rgba(167,200,255,0.5)] shadow-lg shadow-[rgba(167,200,255,0.15)]'
                  : 'bg-surface-high border-[rgba(167,200,255,0.25)] hover:border-[rgba(167,200,255,0.5)] hover:shadow-lg hover:shadow-[rgba(167,200,255,0.15)]'
              }`}
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              data-testid="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? (
                <>
                  <picture>
                    <source srcSet="/images/Garaje.avif" type="image/avif" />
                    <source srcSet="/images/Garaje.webp" type="image/webp" />
                    <img
                      src="/images/Garaje.webp"
                      alt=""
                      className="w-5 h-5 object-contain"
                    />
                  </picture>
                  <span className="text-red-400 font-bold text-sm tracking-wider">✕ CERRAR</span>
                </>
              ) : (
                <span className="material-symbols-outlined text-primary">menu</span>
              )}
            </button>
          )}
        </div>
      </nav>
      {isAuthenticated && <NotificationPrompt />}
    </header>
  )
}

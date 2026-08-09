import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const USER_MENU = [
  { key: 'dashboard', label: 'Inicio', icon: 'home', path: '/dashboard' },
  { key: 'vehicles', label: 'Vehículos', icon: 'directions_car', path: '/dashboard?tab=vehicles' },
  { key: 'reservations', label: 'Reservas', icon: 'event_seat', path: '/dashboard?tab=reservations' },
  { key: 'payments', label: 'Pagos', icon: 'payments', path: '/dashboard?tab=payments' },
  { key: 'sessions', label: 'Sesiones', icon: 'devices', path: '/dashboard?tab=sessions' },
  { key: 'profile', label: 'Perfil', icon: 'person', path: '/dashboard?tab=profile' },
]

export function UserLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard'

  return (
    <div className="min-h-screen flex bg-bg text-on-bg">
      {/* -- SIDEBAR (desktop) -- */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-low border-r border-outline/10 fixed h-screen z-30">
        {/* Brand */}
        <div className="p-6 border-b border-outline/10">
          <Link to="/" className="flex items-center gap-3">
            <picture>
              <source srcSet="/images/Logo.avif" type="image/avif" />
              <source srcSet="/images/Logo.webp" type="image/webp" />
              <img src="/images/Logo.webp" alt="Punto Park U" className="h-10 w-auto" loading="lazy" />
            </picture>
            <span className="font-headline font-bold text-lg text-primary">Punto Park U</span>
          </Link>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-outline/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/15 text-primary">
                <span className="material-symbols-outlined">person</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-bg truncate">
                  {user.nombres || user.username}
                </p>
                <p className="text-xs text-on-surface-var truncate">
                  Cliente frecuente
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <ul className="space-y-1">
            {USER_MENU.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    currentTab === item.key
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-on-surface-var hover:bg-surface-container hover:text-on-bg'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-outline/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* -- MOBILE SIDEBAR OVERLAY -- */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-surface-low border-r border-outline/10 z-50 lg:hidden flex flex-col">
            <div className="p-6 border-b border-outline/10 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
                <img src="/images/Logo.webp" alt="Punto Park U" className="h-8 w-auto" />
                <span className="font-headline font-bold text-primary">Punto Park U</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-on-surface-var">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {user && (
              <div className="p-4 border-b border-outline/10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/15 text-primary">
                    <span className="material-symbols-outlined">person</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-bg truncate">
                      {user.nombres || user.username}
                    </p>
                    <p className="text-xs text-on-surface-var truncate">
                      Cliente frecuente
                    </p>
                  </div>
                </div>
              </div>
            )}
            <nav className="flex-1 py-4 px-3">
              <ul className="space-y-1">
                {USER_MENU.map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        currentTab === item.key
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-on-surface-var hover:bg-surface-container hover:text-on-bg'
                      }`}
                    >
                      <span className="material-symbols-outlined">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t border-outline/10">
              <button
                onClick={() => { setSidebarOpen(false); logout() }}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <span className="material-symbols-outlined">logout</span>
                <span className="text-sm">Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* -- MAIN CONTENT -- */}
      <div className="flex-1 lg:ml-64 min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-outline/10 px-4 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-surface-container text-on-bg"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-xl font-bold text-on-bg font-headline">Panel de Usuario</h1>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

    </div>
  )
}
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const ADMIN_MENU = [
  { key: 'reports', label: 'Reportes', icon: 'bar_chart', path: '/admin?tab=reports' },
  { key: 'tariffs', label: 'Tarifas', icon: 'attach_money', path: '/admin?tab=tariffs' },
  { key: 'schedule', label: 'Horarios', icon: 'schedule', path: '/admin?tab=schedule' },
  { key: 'map', label: 'Mapa', icon: 'map', path: '/admin?tab=map' },
  { key: 'analytics', label: 'Analítica', icon: 'insights', path: '/admin?tab=analytics' },
  { key: 'pricing', label: 'Precios', icon: 'trending_up', path: '/admin?tab=pricing' },
  { key: 'hardware', label: 'Hardware', icon: 'memory', path: '/admin?tab=hardware' },
  { key: 'activity', label: 'Actividad', icon: 'history', path: '/admin?tab=activity' },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentTab = new URLSearchParams(location.search).get('tab') || 'dashboard'

  return (
    <div className="min-h-screen flex bg-bg text-on-bg">
      {/* ── MOBILE/TABLET NOT SUPPORTED MESSAGE ── */}
      <div className="fixed inset-0 z-[60] bg-bg flex flex-col items-center justify-center p-8 lg:hidden">
        <div className="text-center max-w-md">
          <span className="material-symbols-outlined text-6xl text-primary mb-4 block">computer</span>
          <h2 className="text-2xl font-bold text-on-bg mb-3 font-headline">
            Panel de Administración
          </h2>
          <p className="text-on-surface-var mb-6">
            El panel de administración está optimizado para pantallas grandes. 
            Para gestionar la información del parqueadero, por favor ingresa desde un computador o tablet grande.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-on-surface-var">
              <span className="material-symbols-outlined text-base align-text-bottom">info</span>
              {' '}Resolución mínima recomendada: 1024px de ancho
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold transition-colors hover:bg-primary/90"
            >
              <span className="material-symbols-outlined">home</span>
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-low border-r border-outline/10 fixed h-screen z-30">
        {/* Brand */}
        <div className="p-6 border-b border-outline/10">
          <Link to="/" className="flex items-center gap-3">
            <picture>
              <source srcSet="/images/Logo.avif" type="image/avif" />
              <source srcSet="/images/Logo.webp" type="image/webp" />
              <img src="/images/Logo.png" alt="Punto Park U" className="h-10 w-auto" />
            </picture>
            <span className="font-headline font-bold text-lg text-primary">Punto Park U</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3">
          <ul className="space-y-1">
            {ADMIN_MENU.map((item) => (
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

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-surface-low border-r border-outline/10 z-50 lg:hidden flex flex-col">
            {/* Same content as desktop sidebar */}
            <div className="p-6 border-b border-outline/10 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
                <img src="/images/Logo.png" alt="Punto Park U" className="h-8 w-auto" />
                <span className="font-headline font-bold text-primary">Punto Park U</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="text-on-surface-var">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 py-4 px-3">
              <ul className="space-y-1">
                {ADMIN_MENU.map((item) => (
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

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 lg:ml-64 min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-outline/10 px-4 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg bg-surface-container text-on-bg"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-xl font-bold text-on-bg font-headline">Panel de Administración</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ffcc]" />
            </span>
            <span className="text-xs text-on-surface-var uppercase tracking-wider">En vivo</span>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

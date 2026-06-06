import { useState } from 'react'
import { Layout } from '@/components/layout'
import { Card, Button, Badge } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'

type UserTab = 'dashboard' | 'vehicles' | 'reservations' | 'profile'

export function UserDashboard() {
  const { user, logout, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<UserTab>('dashboard')

  const tabs: { key: UserTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Resumen', icon: 'dashboard' },
    { key: 'vehicles', label: 'Vehículos', icon: 'directions_car' },
    { key: 'reservations', label: 'Reservas', icon: 'calendar_month' },
    { key: 'profile', label: 'Perfil', icon: 'person' },
  ]

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline">
              Panel de Usuario
            </h1>
            <p className="text-on-surface-var mt-1">
              Bienvenido, {user?.nombres || user?.username || 'Usuario'}
            </p>
          </div>
          <Button variant="ghost" onClick={logout} loading={isLoading}>
            <span className="material-symbols-outlined text-base">logout</span>
            Cerrar Sesión
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2" data-testid="user-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors
                ${
                  activeTab === tab.key
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-var hover:text-on-bg hover:bg-surface-container'
                }
              `}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">
                    directions_car
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">1</div>
                <div className="text-sm text-on-surface-var">Vehículos</div>
              </Card>
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">
                    calendar_month
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">0</div>
                <div className="text-sm text-on-surface-var">Reservas Activas</div>
              </Card>
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">
                    notifications
                  </span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">0</div>
                <div className="text-sm text-on-surface-var">Notificaciones</div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card variant="glass" title="Actividad Reciente">
              <div className="text-center py-8 text-on-surface-var text-sm">
                <span className="material-symbols-outlined text-3xl mb-2 block">
                  history
                </span>
                No hay actividad reciente
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <Card variant="glass" title="Mis Vehículos">
            <div className="text-center py-8 text-on-surface-var text-sm">
              <span className="material-symbols-outlined text-3xl mb-2 block">
                directions_car
              </span>
              <p className="mb-4">No tienes vehículos registrados</p>
              <Button variant="primary" size="sm">
                + Agregar Vehículo
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'reservations' && (
          <Card variant="glass" title="Mis Reservas">
            <div className="text-center py-8 text-on-surface-var text-sm">
              <span className="material-symbols-outlined text-3xl mb-2 block">
                calendar_month
              </span>
              <p className="mb-4">No tienes reservas activas</p>
              <Button variant="primary" size="sm">
                + Nueva Reserva
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'profile' && (
          <Card variant="glass" title="Mi Perfil">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-on-surface-var mb-1">
                    Nombres
                  </label>
                  <p className="text-on-bg font-medium">{user?.nombres || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-on-surface-var mb-1">
                    Apellidos
                  </label>
                  <p className="text-on-bg font-medium">{user?.apellidos || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-on-surface-var mb-1">
                    Usuario
                  </label>
                  <p className="text-on-bg font-medium">{user?.username || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-on-surface-var mb-1">
                    Email
                  </label>
                  <p className="text-on-bg font-medium">{user?.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-on-surface-var mb-1">
                    Cédula
                  </label>
                  <p className="text-on-bg font-medium">{user?.cedula || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-on-surface-var mb-1">
                    Rol
                  </label>
                  <div>
                    <Badge variant={user?.rol === 'admin' ? 'info' : 'success'}>
                      {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}

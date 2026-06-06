import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout'
import { Card, Button, Badge } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/adminStore'
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/formatters'

type AdminTab = 'dashboard' | 'reports' | 'users' | 'tariffs' | 'activity'

export function AdminDashboard() {
  const { user, logout, isLoading } = useAuth()
  const { dashboardStats, fetchDashboardStats } = useAdminStore()
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Resumen', icon: 'dashboard' },
    { key: 'reports', label: 'Reportes', icon: 'bar_chart' },
    { key: 'users', label: 'Usuarios', icon: 'people' },
    { key: 'tariffs', label: 'Tarifas', icon: 'attach_money' },
    { key: 'activity', label: 'Actividad', icon: 'history' },
  ]

  const stats = dashboardStats

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline">
              Panel de Administración
            </h1>
            <p className="text-on-surface-var mt-1">
              Bienvenido, {user?.nombres || user?.username || 'Admin'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info">Admin</Badge>
            <Button variant="ghost" onClick={logout} loading={isLoading}>
              <span className="material-symbols-outlined text-base">logout</span>
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-2" data-testid="admin-tabs">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">directions_car</span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {stats ? formatNumber(stats.totalVehicles) : '0'}
                </div>
                <div className="text-sm text-on-surface-var">Vehículos Estacionados</div>
              </Card>
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">payments</span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {stats ? formatCurrency(stats.totalRevenue) : '$0'}
                </div>
                <div className="text-sm text-on-surface-var">Ingresos Totales</div>
              </Card>
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">donut_large</span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {stats ? formatPercentage(stats.occupancyRate) : '0%'}
                </div>
                <div className="text-sm text-on-surface-var">Ocupación</div>
              </Card>
              <Card variant="glass" className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">group</span>
                </div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {stats ? formatNumber(stats.totalUsers) : '0'}
                </div>
                <div className="text-sm text-on-surface-var">Usuarios Registrados</div>
              </Card>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card variant="glass" className="text-center">
                <div className="text-lg font-bold text-primary mb-1">
                  {stats ? formatCurrency(stats.revenueToday) : '$0'}
                </div>
                <div className="text-sm text-on-surface-var">Ingresos Hoy</div>
              </Card>
              <Card variant="glass" className="text-center">
                <div className="text-lg font-bold text-primary mb-1">
                  {stats ? formatNumber(stats.entriesToday) : '0'}
                </div>
                <div className="text-sm text-on-surface-var">Entradas Hoy</div>
              </Card>
              <Card variant="glass" className="text-center">
                <div className="text-lg font-bold text-primary mb-1">
                  {stats ? formatNumber(stats.activeReservations) : '0'}
                </div>
                <div className="text-sm text-on-surface-var">Reservas Activas</div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card variant="glass" title="Acciones Rápidas">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Button variant="secondary" size="sm" className="flex-col gap-1 py-4 h-auto">
                  <span className="material-symbols-outlined">add</span>
                  <span className="text-xs">Nuevo Usuario</span>
                </Button>
                <Button variant="secondary" size="sm" className="flex-col gap-1 py-4 h-auto">
                  <span className="material-symbols-outlined">edit</span>
                  <span className="text-xs">Editar Tarifas</span>
                </Button>
                <Button variant="secondary" size="sm" className="flex-col gap-1 py-4 h-auto">
                  <span className="material-symbols-outlined">assessment</span>
                  <span className="text-xs">Generar Reporte</span>
                </Button>
                <Button variant="secondary" size="sm" className="flex-col gap-1 py-4 h-auto">
                  <span className="material-symbols-outlined">settings</span>
                  <span className="text-xs">Configuración</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <Card variant="glass" title="Reportes">
            <div className="text-center py-8 text-on-surface-var text-sm">
              <span className="material-symbols-outlined text-3xl mb-2 block">
                bar_chart
              </span>
              <p className="mb-2">Los reportes estarán disponibles próximamente.</p>
              <p>Selecciona el tipo de reporte para visualizar:</p>
              <div className="flex justify-center gap-3 mt-4">
                <Button variant="secondary" size="sm">Financiero</Button>
                <Button variant="secondary" size="sm">Ocupación</Button>
                <Button variant="secondary" size="sm">Usuarios</Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'users' && (
          <Card variant="glass" title="Usuarios Registrados">
            <div className="text-center py-8 text-on-surface-var text-sm">
              <span className="material-symbols-outlined text-3xl mb-2 block">
                group
              </span>
              <p className="mb-4">
                Total de usuarios: {stats ? formatNumber(stats.totalUsers) : '0'}
              </p>
              <Button variant="primary" size="sm">
                + Nuevo Usuario
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'tariffs' && (
          <Card variant="glass" title="Gestión de Tarifas">
            <div className="text-center py-8 text-on-surface-var text-sm">
              <span className="material-symbols-outlined text-3xl mb-2 block">
                attach_money
              </span>
              <p className="mb-4">Administra las tarifas por tipo de vehículo.</p>
              <Button variant="primary" size="sm">
                Editar Tarifas
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'activity' && (
          <Card variant="glass" title="Actividad Reciente">
            <div className="text-center py-8 text-on-surface-var text-sm">
              <span className="material-symbols-outlined text-3xl mb-2 block">
                history
              </span>
              <p>No hay actividad reciente para mostrar.</p>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  )
}

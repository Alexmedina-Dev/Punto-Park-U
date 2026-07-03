import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { AdminLayout } from '@/components/layout'
import { Card, Button, Badge } from '@/components/ui'
import { KPICard, OccupancyChart, OccupancyForecast, VehiclesTable, AlertsPanel, ActivityFeed, HistoryLog, TariffEditor, ScheduleEditor, ParkingMap, ReportGenerator, AnalyticsPanel, PricingPanel, ManualPaymentsPanel, ProphetAIAssistant } from '@/components/admin'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/adminStore'
import { formatCurrency, formatPercentage, formatNumber, formatDuration } from '@/utils/formatters'
import wsService from '@/services/websocket.service'
import type { Alert, ActivityLog } from '@/types'

type AdminTab = 'dashboard' | 'reports' | 'users' | 'tariffs' | 'schedule' | 'map' | 'activity' | 'analytics' | 'pricing' | 'payments'

export function AdminDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const {
    dashboardStats,
    activityFeed,
    alerts,
    hourlyOccupancy,
    parkedVehicles,
    fetchDashboardStats,
    fetchActivityFeed,
    fetchAlerts,
    fetchHourlyOccupancy,
    fetchParkedVehicles,
  } = useAdminStore()
  const [activeTab, setActiveTab] = useState<AdminTab | null>(null)
  
  // Read tab from URL query params
  const location = useLocation()
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab') as AdminTab
    if (tab) setActiveTab(tab)
    else setActiveTab(null)
  }, [location.search])

  const fetchAll = useCallback(() => {
    fetchDashboardStats()
    fetchActivityFeed()
    fetchAlerts()
    fetchHourlyOccupancy()
    fetchParkedVehicles()
  }, [fetchDashboardStats, fetchActivityFeed, fetchAlerts, fetchHourlyOccupancy, fetchParkedVehicles])

  // ── Real-time WebSocket callbacks ───────────────────────────
  const handleNewAlert = useCallback((alert: Alert) => {
    // Prepending new alert to store
    useAdminStore.setState((state) => ({
      alerts: [alert, ...state.alerts],
    }))
  }, [])

  const handleNewActivity = useCallback((entry: ActivityLog) => {
    // Prepending new activity entry to store
    useAdminStore.setState((state) => ({
      activityFeed: [entry, ...state.activityFeed].slice(0, 50), // keep max 50
    }))
  }, [])

  useEffect(() => {
    fetchAll()

    // Connect WebSocket for real-time updates
    wsService.connect()

    return () => {
      wsService.disconnect()
    }
  }, [fetchAll])

  const stats = dashboardStats

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary font-headline break-words">
              Panel de Administración
            </h1>
            <p className="text-on-surface-var mt-1 truncate">
              Bienvenido, {user?.nombres || user?.username || 'Admin'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="info">Admin</Badge>
            <Button variant="ghost" onClick={logout} loading={authLoading}>
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>

        {/* ──────────────── WELCOME / NO TAB SELECTED ──────────────── */}
        {activeTab === null && (
          <div className="space-y-6">
            <Card variant="glass" padding="lg">
              <div className="text-center py-12 max-w-2xl mx-auto">
                <span className="material-symbols-outlined text-6xl text-primary mb-4 block">
                  admin_panel_settings
                </span>
                <h2 className="text-2xl font-bold text-primary font-headline mb-3">
                  Bienvenido al Panel de Administración
                </h2>
                <p className="text-on-surface-var mb-6 leading-relaxed">
                  Hola, <strong>{user?.nombres || user?.username || 'Admin'}</strong>. Este es tu centro de control 
                  para gestionar Punto Park U. Desde aquí puedes monitorear el estado del parqueadero en tiempo real, 
                  generar reportes financieros, ajustar tarifas, configurar horarios de atención y analizar 
                  tendencias de uso.
                </p>
                
                <div className="bg-surface-container rounded-xl p-5 text-left space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-2xl text-primary mt-0.5">auto_awesome</span>
                    <div>
                      <p className="text-sm font-bold text-on-bg">Inteligencia Artificial Integrada</p>
                      <p className="text-xs text-on-surface-var leading-relaxed">
                        Tu parqueadero cuenta con análisis predictivo impulsado por IA (Prophet) que anticipa 
                        la ocupación para los próximos 7 días. Además, el sistema de precios dinámicos ajusta 
                        automáticamente las tarifas según la demanda en tiempo real, maximizando tus ingresos 
                        sin intervención manual.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-2xl text-success mt-0.5">check_circle</span>
                    <div>
                      <p className="text-sm font-bold text-on-bg">Todo bajo control</p>
                      <p className="text-xs text-on-surface-var leading-relaxed">
                        Selecciona cualquier opción del menú lateral para comenzar. Todas las secciones 
                        están diseñadas para ser intuitivas y fáciles de usar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ──────────────── DASHBOARD TAB ──────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 6 KPI Cards — responsive: 1 -> 2 -> 3 cols */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KPICard
                title="Vehículos Hoy"
                value={stats ? formatNumber(stats.entriesToday) : '0'}
                icon="directions_car"
                trend={stats?.vehiclesTodayTrend}
                trendColor="#60a5fa"
              />
              <KPICard
                title="Ingresos Hoy"
                value={stats ? formatCurrency(stats.revenueToday) : '$0'}
                icon="payments"
                trend={stats?.revenueTodayTrend}
                trendColor="#34d399"
              />
              <KPICard
                title="Ocupación Actual"
                value={stats ? formatPercentage(stats.occupancyRate) : '0%'}
                icon="donut_large"
                trend={stats?.occupancyTrend}
                trendColor="#fbbf24"
              />
              <KPICard
                title="Tiempo Promedio"
                value={stats?.averageParkingTime ? formatDuration(stats.averageParkingTime) : '0 min'}
                icon="schedule"
                subtitle="promedio"
              />
              <KPICard
                title="Operadores Activos"
                value={stats ? formatNumber(stats.activeOperators ?? 0) : '0'}
                icon="badge"
                subtitle="en turno"
              />
              <KPICard
                title="Hora Pico"
                value={stats?.peakHour ?? '--'}
                icon="trending_up"
                subtitle="hoy"
              />
            </div>

            {/* Chart + Alerts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <OccupancyChart data={hourlyOccupancy} className="lg:col-span-2" />
              <AlertsPanel alerts={alerts} onNewAlert={handleNewAlert} />
            </div>

            {/* Vehicles Table */}
            <VehiclesTable vehicles={parkedVehicles} />

            {/* Activity + History row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityFeed entries={activityFeed} onNewEntry={handleNewActivity} />
              <HistoryLog entries={activityFeed} />
            </div>
          </div>
        )}

        {/* ──────────────── REPORTS TAB ──────────────── */}
        {activeTab === 'reports' && <ReportGenerator />}

        {/* ──────────────── USERS TAB ──────────────── */}
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

        {/* ──────────────── TARIFFS TAB ──────────────── */}
        {activeTab === 'tariffs' && (
          <Card variant="glass" padding="lg">
            <TariffEditor />
          </Card>
        )}

        {/* ──────────────── SCHEDULE TAB ──────────────── */}
        {activeTab === 'schedule' && (
          <Card variant="glass" padding="lg">
            <ScheduleEditor />
          </Card>
        )}

        {/* ──────────────── MAP TAB ──────────────── */}
        {activeTab === 'map' && (
          <Card variant="glass" padding="lg">
            <ParkingMap />
          </Card>
        )}

        {/* ──────────────── ANALYTICS TAB ──────────────── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <ProphetAIAssistant />
            <AnalyticsPanel />
            <OccupancyForecast />
          </div>
        )}

        {/* ──────────────── PRICING TAB ──────────────── */}
        {activeTab === 'pricing' && (
          <PricingPanel />
        )}

        {/* ──────────────── PAYMENTS TAB ──────────────── */}
        {activeTab === 'payments' && (
          <ManualPaymentsPanel />
        )}

        {/* ──────────────── ACTIVITY TAB ──────────────── */}
        {activeTab === 'activity' && (
          <ActivityFeed entries={activityFeed} onNewEntry={handleNewActivity} standalone />
        )}
      </div>
    </AdminLayout>
  )
}

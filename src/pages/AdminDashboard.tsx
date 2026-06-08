import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { AdminLayout } from '@/components/layout'
import { Card, Button, Badge } from '@/components/ui'
import { KPICard, OccupancyChart, VehiclesTable, AlertsPanel, ActivityFeed, HistoryLog, TariffEditor, ScheduleEditor, ParkingMap, ReportGenerator, AnalyticsPanel, PricingPanel, HardwarePanel } from '@/components/admin'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/adminStore'
import { formatCurrency, formatPercentage, formatNumber, formatDuration } from '@/utils/formatters'
import wsService from '@/services/websocket.service'
import type { Alert, ActivityLog } from '@/types'

type AdminTab = 'dashboard' | 'reports' | 'users' | 'tariffs' | 'schedule' | 'map' | 'activity' | 'analytics' | 'pricing' | 'hardware'

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
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  
  // Read tab from URL query params
  const location = useLocation()
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab') as AdminTab
    if (tab) setActiveTab(tab)
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
            <Button variant="ghost" onClick={logout} loading={authLoading}>
              <span className="material-symbols-outlined text-base">logout</span>
              Cerrar Sesión
            </Button>
          </div>
        </div>

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
          <AnalyticsPanel />
        )}

        {/* ──────────────── PRICING TAB ──────────────── */}
        {activeTab === 'pricing' && (
          <PricingPanel />
        )}

        {/* ──────────────── HARDWARE TAB ──────────────── */}
        {activeTab === 'hardware' && (
          <HardwarePanel />
        )}

        {/* ──────────────── ACTIVITY TAB ──────────────── */}
        {activeTab === 'activity' && (
          <ActivityFeed entries={activityFeed} onNewEntry={handleNewActivity} />
        )}
      </div>
    </AdminLayout>
  )
}

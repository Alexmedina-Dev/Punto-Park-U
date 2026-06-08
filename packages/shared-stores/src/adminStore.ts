import { create } from 'zustand'
import type { AdminStats, ReportData, User, ParkingEntry, ActivityLog, Alert, HourlyOccupancy, ParkedVehicle } from '@punto-park-u/shared-types'
import {
  getDashboardStatsService,
  getReportDataService,
  getAdminUsersService,
  getAllEntriesService,
  getOccupancyService,
  getParkedVehiclesService,
  getActivityLogService,
  getAlertsService,
  withRetry,
} from '@punto-park-u/shared-api'

export interface AdminState {
  // Dashboard
  dashboardStats: AdminStats | null
  recentVehicles: ParkingEntry[]

  // Parking
  parkingSpots: any[]

  // Reports
  reportData: ReportData | null
  reportType: string

  // Users
  users: User[]

  // Phase 3 — Admin Dashboard Core
  activityFeed: ActivityLog[]
  alerts: Alert[]
  hourlyOccupancy: HourlyOccupancy[]
  parkedVehicles: ParkedVehicle[]

  // Loading
  isLoading: boolean

  // Actions
  setDashboardStats: (stats: AdminStats) => void
  setRecentVehicles: (vehicles: ParkingEntry[]) => void
  setParkingSpots: (spots: any[]) => void
  setReportData: (data: ReportData) => void
  setReportType: (type: string) => void
  setUsers: (users: User[]) => void
  setActivityFeed: (feed: ActivityLog[]) => void
  setAlerts: (alerts: Alert[]) => void
  setHourlyOccupancy: (data: HourlyOccupancy[]) => void
  setParkedVehicles: (vehicles: ParkedVehicle[]) => void
  setLoading: (loading: boolean) => void

  // Data fetching
  fetchDashboardStats: () => Promise<void>
  fetchReportData: () => Promise<void>
  fetchUsers: () => Promise<void>
  fetchRecentEntries: () => Promise<void>
  fetchActivityFeed: () => Promise<void>
  fetchAlerts: () => Promise<void>
  fetchHourlyOccupancy: () => Promise<void>
  fetchParkedVehicles: () => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  dashboardStats: null,
  recentVehicles: [],
  parkingSpots: [],
  reportData: null,
  reportType: 'financial',
  users: [],
  activityFeed: [],
  alerts: [],
  hourlyOccupancy: [],
  parkedVehicles: [],
  isLoading: false,

  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setRecentVehicles: (vehicles) => set({ recentVehicles: vehicles }),
  setParkingSpots: (spots) => set({ parkingSpots: spots }),
  setReportData: (data) => set({ reportData: data }),
  setReportType: (type) => set({ reportType: type }),
  setUsers: (users) => set({ users }),
  setActivityFeed: (feed) => set({ activityFeed: feed }),
  setAlerts: (alerts) => set({ alerts }),
  setHourlyOccupancy: (data) => set({ hourlyOccupancy: data }),
  setParkedVehicles: (vehicles) => set({ parkedVehicles: vehicles }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchDashboardStats: async () => {
    set({ isLoading: true })
    try {
      const stats = await withRetry(() => getDashboardStatsService())
      set({ dashboardStats: stats, isLoading: false })
    } catch {
      set({
        dashboardStats: {
          totalVehicles: 45,
          totalRevenue: 12500000,
          occupancyRate: 0.65,
          totalUsers: 120,
          activeReservations: 12,
          revenueToday: 450000,
          entriesToday: 28,
          averageParkingTime: 95,
          activeOperators: 4,
          peakHour: '10:00 - 11:00',
          vehiclesTodayTrend: [12, 18, 24, 30, 35, 38, 42, 45, 43, 40, 36, 28],
          revenueTodayTrend: [150000, 280000, 350000, 420000, 450000, 430000, 380000, 320000],
          occupancyTrend: [30, 45, 55, 60, 65, 68, 62, 50],
        },
        isLoading: false,
      })
    }
  },

  fetchReportData: async () => {
    set({ isLoading: true })
    try {
      const { reportType } = get()
      const data = await withRetry(() => getReportDataService(reportType))
      set({ reportData: data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchUsers: async () => {
    set({ isLoading: true })
    try {
      const users = await withRetry(() => getAdminUsersService())
      set({ users, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchRecentEntries: async () => {
    set({ isLoading: true })
    try {
      const entries = await withRetry(() => getAllEntriesService())
      set({ recentVehicles: entries, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchActivityFeed: async () => {
    try {
      const feed = await withRetry(() => getActivityLogService())
      set({ activityFeed: feed })
    } catch {
      set({
        activityFeed: [
          { id: '1', action: 'Pago registrado', description: 'Vehículo ABC-123 pagó $12,000', user: 'Carlos M.', userRole: 'operator', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), type: 'payment' },
          { id: '2', action: 'Entrada de vehículo', description: 'Moto XYZ-789 ingresó al parqueadero', user: 'Sistema', userRole: 'system', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), type: 'entry' },
          { id: '3', action: 'Salida de vehículo', description: 'Camioneta DEF-456 salió del parqueadero', user: 'Sistema', userRole: 'system', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), type: 'exit' },
          { id: '4', action: 'Usuario registrado', description: 'Nuevo usuario: Pedro López', user: 'Admin', userRole: 'admin', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), type: 'create' },
          { id: '5', action: 'Tarifa actualizada', description: 'Tarifa de automóviles actualizada a $4,000/h', user: 'Admin', userRole: 'admin', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), type: 'update' },
        ],
      })
    }
  },

  fetchAlerts: async () => {
    try {
      const alerts = await withRetry(() => getAlertsService())
      set({ alerts })
    } catch {
      set({
        alerts: [
          { id: '1', type: 'warning', title: 'Ocupación alta', message: 'El parqueadero está al 85% de capacidad', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), resolved: false },
          { id: '2', type: 'info', title: 'Mantenimiento programado', message: 'Mantenimiento de sensores zona B a las 3:00 PM', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), resolved: false },
          { id: '3', type: 'success', title: 'Pago masivo procesado', message: 'Lote de 15 pagos procesados correctamente', timestamp: new Date(Date.now() - 120 * 60000).toISOString(), resolved: false },
        ],
      })
    }
  },

  fetchHourlyOccupancy: async () => {
    try {
      const data = await withRetry(() => getOccupancyService())
      set({ hourlyOccupancy: data })
    } catch {
      const mockOccupancy: HourlyOccupancy[] = []
      for (let i = 6; i <= 20; i++) {
        const count = Math.round(20 + Math.sin((i - 6) * Math.PI / 7) * 25 + Math.random() * 10)
        mockOccupancy.push({ hour: `${i}:00`, count, capacity: 60 })
      }
      set({ hourlyOccupancy: mockOccupancy })
    }
  },

  fetchParkedVehicles: async () => {
    try {
      const vehicles = await withRetry(() => getParkedVehiclesService())
      set({ parkedVehicles: vehicles })
    } catch {
      set({
        parkedVehicles: [
          { id: '1', plate: 'ABC-123', type: 'car', brand: 'Toyota', model: 'Corolla', color: 'Blanco', zone: 'A', entryTime: new Date(Date.now() - 120 * 60000).toISOString(), duration: '2h 10m', paymentStatus: 'paid', operator: 'Carlos M.' },
          { id: '2', plate: 'XYZ-789', type: 'moto', brand: 'Yamaha', model: 'MT-07', color: 'Azul', zone: 'C', entryTime: new Date(Date.now() - 60 * 60000).toISOString(), duration: '1h 05m', paymentStatus: 'pending', operator: 'María L.' },
          { id: '3', plate: 'DEF-456', type: 'car', brand: 'Mazda', model: 'CX-5', color: 'Rojo', zone: 'B', entryTime: new Date(Date.now() - 180 * 60000).toISOString(), duration: '3h 30m', paymentStatus: 'paid', operator: 'Carlos M.' },
          { id: '4', plate: 'GHI-789', type: 'car', brand: 'Renault', model: 'Sandero', color: 'Gris', zone: 'A', entryTime: new Date(Date.now() - 45 * 60000).toISOString(), duration: '0h 50m', paymentStatus: 'pending', operator: 'Pedro R.' },
          { id: '5', plate: 'JKL-012', type: 'bike', brand: 'GW', model: 'City', color: 'Negro', zone: 'C', entryTime: new Date(Date.now() - 90 * 60000).toISOString(), duration: '1h 35m', paymentStatus: 'paid', operator: 'María L.' },
        ],
      })
    }
  },
}))

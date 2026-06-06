import { create } from 'zustand'
import type { AdminStats, ReportData, User, ParkingEntry } from '@/types'
import {
  getDashboardStatsService,
  getReportDataService,
  getUsersService,
  getAllEntriesService,
} from '@/services/admin.service'
import { withRetry } from '@/utils/errorHandler'

interface AdminState {
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

  // Loading
  isLoading: boolean

  // Actions
  setDashboardStats: (stats: AdminStats) => void
  setRecentVehicles: (vehicles: ParkingEntry[]) => void
  setParkingSpots: (spots: any[]) => void
  setReportData: (data: ReportData) => void
  setReportType: (type: string) => void
  setUsers: (users: User[]) => void
  setLoading: (loading: boolean) => void

  // Data fetching
  fetchDashboardStats: () => Promise<void>
  fetchReportData: () => Promise<void>
  fetchUsers: () => Promise<void>
  fetchRecentEntries: () => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  dashboardStats: null,
  recentVehicles: [],
  parkingSpots: [],
  reportData: null,
  reportType: 'financial',
  users: [],
  isLoading: false,

  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setRecentVehicles: (vehicles) => set({ recentVehicles: vehicles }),
  setParkingSpots: (spots) => set({ parkingSpots: spots }),
  setReportData: (data) => set({ reportData: data }),
  setReportType: (type) => set({ reportType: type }),
  setUsers: (users) => set({ users }),
  setLoading: (loading) => set({ isLoading: loading }),

  fetchDashboardStats: async () => {
    set({ isLoading: true })
    try {
      const stats = await withRetry(() => getDashboardStatsService())
      set({ dashboardStats: stats, isLoading: false })
    } catch {
      // Fallback mock stats
      set({
        dashboardStats: {
          totalVehicles: 45,
          totalRevenue: 12500000,
          occupancyRate: 0.65,
          totalUsers: 120,
          activeReservations: 12,
          revenueToday: 450000,
          entriesToday: 28,
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
      const users = await withRetry(() => getUsersService())
      set({ users, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchRecentEntries: async () => {
    set({ isLoading: true })
    try {
      const entries = await withRetry(() => getAllEntriesService())
      // Map to recentVehicles format (ParkingEntry[])
      set({ recentVehicles: entries, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))

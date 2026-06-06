import { create } from 'zustand'

interface AdminState {
  // Dashboard
  dashboardStats: any | null
  recentVehicles: any[]
  
  // Parking
  parkingSpots: any[]
  
  // Reports
  reportData: any | null
  reportType: string
  
  // Actions
  setDashboardStats: (stats: any) => void
  setRecentVehicles: (vehicles: any[]) => void
  setParkingSpots: (spots: any[]) => void
  setReportData: (data: any) => void
  setReportType: (type: string) => void
}

export const useAdminStore = create<AdminState>((set) => ({
  dashboardStats: null,
  recentVehicles: [],
  parkingSpots: [],
  reportData: null,
  reportType: 'financial',

  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setRecentVehicles: (vehicles) => set({ recentVehicles: vehicles }),
  setParkingSpots: (spots) => set({ parkingSpots: spots }),
  setReportData: (data) => set({ reportData: data }),
  setReportType: (type) => set({ reportType: type }),
}))

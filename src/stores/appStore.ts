import { create } from 'zustand'
import type { PricingConfig, Schedule } from '@/types'
import { getTariffsService, getScheduleService, getAvailabilityService } from '@/services/parking.service'
import { withRetry } from '@/utils/errorHandler'

interface AvailabilityData {
  spots: any[]
  stats: any
}

interface AppState {
  // UI State
  isMobileMenuOpen: boolean
  isLoading: boolean
  activeTab: string

  // Data
  tariffs: PricingConfig | null
  schedule: Schedule | null
  availability: AvailabilityData | null

  // Actions
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  setActiveTab: (tab: string) => void
  setLoading: (loading: boolean) => void
  setTariffs: (tariffs: PricingConfig) => void
  setSchedule: (schedule: Schedule) => void
  setAvailability: (availability: AvailabilityData) => void

  // Data fetching
  fetchTariffs: () => Promise<void>
  fetchSchedule: () => Promise<void>
  fetchAvailability: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  isMobileMenuOpen: false,
  isLoading: false,
  activeTab: 'home',
  tariffs: null,
  schedule: null,
  availability: null,

  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setLoading: (loading) => set({ isLoading: loading }),
  setTariffs: (tariffs) => set({ tariffs }),
  setSchedule: (schedule) => set({ schedule }),
  setAvailability: (availability) => set({ availability }),

  fetchTariffs: async () => {
    try {
      const tariffs = await withRetry(() => getTariffsService())
      set({ tariffs })
    } catch {
      // Fallback to default tariffs if API unavailable
      set({
        tariffs: {
          car: { hour: 3000, day: 25000, month: 300000 },
          moto: { hour: 1500, day: 12000, month: 150000 },
          bike: { hour: 1000, day: 8000, month: 100000 },
        },
      })
    }
  },

  fetchSchedule: async () => {
    try {
      const schedule = await withRetry(() => getScheduleService())
      set({ schedule })
    } catch {
      // Fallback to default schedule
      set({
        schedule: {
          weekday: { open: '07:00', close: '19:00' },
          sunday: { open: '09:00', close: '17:00' },
        },
      })
    }
  },

  fetchAvailability: async () => {
    try {
      const availability = await withRetry(() => getAvailabilityService())
      set({ availability })
    } catch {
      // Fallback to default availability
      set({
        availability: {
          spots: Array.from({ length: 30 }, (_, i) => ({
            id: `${String.fromCharCode(65 + (i % 3))}${i + 1}`,
            zone: String.fromCharCode(65 + (i % 3)) as 'A' | 'B' | 'C',
            status: (i % 3 === 0 ? 'ocupado' : 'libre') as 'libre' | 'ocupado',
          })),
          stats: {
            cars: { used: 8, total: 15 },
            motos: { used: 3, total: 10 },
            bikes: { used: 2, total: 5 },
          },
        },
      })
    }
  },
}))

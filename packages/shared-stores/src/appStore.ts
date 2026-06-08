import { create } from 'zustand'
import type { PricingConfig, Schedule, ParkingSpot, ParkingStats } from '@punto-park-u/shared-types'
import { getTariffsService, getScheduleService, getAvailabilityService, withRetry } from '@punto-park-u/shared-api'

interface AvailabilityData {
  spots: ParkingSpot[]
  stats: ParkingStats
}

export interface AppState {
  // UI State
  isMobileMenuOpen: boolean
  isLoading: boolean
  loadingState: {
    tariffs: boolean
    schedule: boolean
    availability: boolean
  }
  errorState: {
    tariffs: string | null
    schedule: string | null
    availability: string | null
  }
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
  fetchAll: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  isMobileMenuOpen: false,
  isLoading: false,
  loadingState: {
    tariffs: false,
    schedule: false,
    availability: false,
  },
  errorState: {
    tariffs: null,
    schedule: null,
    availability: null,
  },
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
    set((state) => ({
      loadingState: { ...state.loadingState, tariffs: true },
      errorState: { ...state.errorState, tariffs: null },
    }))
    try {
      const tariffs = await withRetry(() => getTariffsService())
      set((state) => ({
        tariffs,
        loadingState: { ...state.loadingState, tariffs: false },
      }))
    } catch {
      set((state) => ({
        tariffs: {
          car: { hour: 3000, day: 25000, month: 300000 },
          moto: { hour: 1500, day: 12000, month: 150000 },
          bike: { hour: 1000, day: 8000, month: 100000 },
        },
        loadingState: { ...state.loadingState, tariffs: false },
        errorState: {
          ...state.errorState,
          tariffs: 'No se pudieron cargar las tarifas. Mostrando valores por defecto.',
        },
      }))
    }
  },

  fetchSchedule: async () => {
    set((state) => ({
      loadingState: { ...state.loadingState, schedule: true },
      errorState: { ...state.errorState, schedule: null },
    }))
    try {
      const schedule = await withRetry(() => getScheduleService())
      set((state) => ({
        schedule,
        loadingState: { ...state.loadingState, schedule: false },
      }))
    } catch {
      set((state) => ({
        schedule: {
          weekday: { open: '07:00', close: '19:00' },
          sunday: { open: '09:00', close: '17:00' },
        },
        loadingState: { ...state.loadingState, schedule: false },
        errorState: {
          ...state.errorState,
          schedule: 'No se pudieron cargar los horarios. Mostrando valores por defecto.',
        },
      }))
    }
  },

  fetchAvailability: async () => {
    set((state) => ({
      loadingState: { ...state.loadingState, availability: true },
      errorState: { ...state.errorState, availability: null },
    }))
    try {
      const availability = await withRetry(() => getAvailabilityService())
      set((state) => ({
        availability,
        loadingState: { ...state.loadingState, availability: false },
      }))
    } catch {
      set((state) => ({
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
        loadingState: { ...state.loadingState, availability: false },
        errorState: {
          ...state.errorState,
          availability: 'No se pudo cargar la disponibilidad. Mostrando valores estimados.',
        },
      }))
    }
  },

  fetchAll: async () => {
    set({ isLoading: true })
    await Promise.allSettled([
      get().fetchTariffs(),
      get().fetchSchedule(),
      get().fetchAvailability(),
    ])
    set({ isLoading: false })
  },
}))

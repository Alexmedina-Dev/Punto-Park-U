import { create } from 'zustand'

interface AppState {
  // UI State
  isMobileMenuOpen: boolean
  isLoading: boolean
  activeTab: string
  
  // Data
  tariffs: any | null
  schedule: any | null
  availability: any | null
  
  // Actions
  toggleMobileMenu: () => void
  closeMobileMenu: () => void
  setActiveTab: (tab: string) => void
  setLoading: (loading: boolean) => void
  setTariffs: (tariffs: any) => void
  setSchedule: (schedule: any) => void
  setAvailability: (availability: any) => void
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
}))

import { create } from 'zustand'
import type { PricingStats, PricingForecast, PricingSettings } from '@punto-park-u/shared-types'
import {
  getPricingStatsService,
  getPricingForecastService,
  updatePricingSettingsService,
  withRetry,
} from '@punto-park-u/shared-api'

export interface PricingState {
  // Data
  stats: PricingStats | null
  forecast: PricingForecast[]
  settings: PricingSettings | null

  // Loading & Error
  loading: boolean
  error: string | null

  // Actions
  setStats: (stats: PricingStats | null) => void
  setForecast: (forecast: PricingForecast[]) => void
  setSettings: (settings: PricingSettings | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Async Actions
  fetchStats: () => Promise<void>
  fetchForecast: () => Promise<void>
  updateSettings: (settings: Partial<PricingSettings>) => Promise<void>
}

export const usePricingStore = create<PricingState>((set, get) => ({
  // Initial state
  stats: null,
  forecast: [],
  settings: null,
  loading: false,
  error: null,

  // Setters
  setStats: (stats) => set({ stats }),
  setForecast: (forecast) => set({ forecast }),
  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Fetch pricing stats
  fetchStats: async () => {
    set({ loading: true, error: null })
    try {
      const stats = await withRetry(() => getPricingStatsService())
      set({ stats, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar estadísticas de precios', loading: false })
    }
  },

  // Fetch pricing forecast
  fetchForecast: async () => {
    set({ loading: true, error: null })
    try {
      const forecast = await withRetry(() => getPricingForecastService())
      set({ forecast, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar pronóstico', loading: false })
    }
  },

  // Update pricing settings
  updateSettings: async (newSettings) => {
    set({ loading: true, error: null })
    try {
      const current = get().settings
      const merged: PricingSettings = {
        enabled: newSettings.enabled ?? current?.enabled ?? false,
        rules: {
          lowThreshold: newSettings.rules?.lowThreshold ?? current?.rules?.lowThreshold ?? 30,
          highThreshold: newSettings.rules?.highThreshold ?? current?.rules?.highThreshold ?? 60,
          peakThreshold: newSettings.rules?.peakThreshold ?? current?.rules?.peakThreshold ?? 80,
        },
      }
      const settings = await withRetry(() => updatePricingSettingsService(merged))
      set({ settings, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al actualizar configuración', loading: false })
    }
  },
}))

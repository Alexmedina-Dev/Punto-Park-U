import { create } from 'zustand'
import type { AnomalyStats, Anomaly } from '@punto-park-u/shared-types'
import {
  getAnomalyStatsService,
  getRecentAnomaliesService,
  runAnomalyDetectionService,
  resolveAnomalyService,
  withRetry,
} from '@punto-park-u/shared-api'

export interface AnalyticsState {
  // Data
  stats: AnomalyStats | null
  anomalies: Anomaly[]
  recentAnomalies: Anomaly[]

  // Loading & Error
  loading: boolean
  error: string | null

  // Actions
  setStats: (stats: AnomalyStats | null) => void
  setAnomalies: (anomalies: Anomaly[]) => void
  setRecentAnomalies: (anomalies: Anomaly[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Async Actions
  fetchStats: () => Promise<void>
  fetchRecentAnomalies: () => Promise<void>
  resolveAnomaly: (id: string) => Promise<void>
  runDetection: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  // Initial state
  stats: null,
  anomalies: [],
  recentAnomalies: [],
  loading: false,
  error: null,

  // Setters
  setStats: (stats) => set({ stats }),
  setAnomalies: (anomalies) => set({ anomalies }),
  setRecentAnomalies: (recentAnomalies) => set({ recentAnomalies }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Fetch anomaly stats
  fetchStats: async () => {
    set({ loading: true, error: null })
    try {
      const stats = await withRetry(() => getAnomalyStatsService())
      set({ stats, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar estadísticas', loading: false })
    }
  },

  // Fetch recent anomalies
  fetchRecentAnomalies: async () => {
    set({ loading: true, error: null })
    try {
      const anomalies = await withRetry(() => getRecentAnomaliesService())
      set({ recentAnomalies: anomalies, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar anomalías', loading: false })
    }
  },

  // Resolve anomaly
  resolveAnomaly: async (id) => {
    try {
      await withRetry(() => resolveAnomalyService(id))
    } catch (err: any) {
      set({ error: err.message || 'Error al resolver anomalía' })
    }
  },

  // Run manual detection
  runDetection: async () => {
    set({ loading: true, error: null })
    try {
      await withRetry(() => runAnomalyDetectionService())
      set({ loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al ejecutar detección', loading: false })
    }
  },
}))

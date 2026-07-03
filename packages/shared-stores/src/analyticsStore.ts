import { create } from 'zustand'
import type { AnomalyStats, Anomaly } from '@punto-park-u/shared-types'
import type { OccupancyPrediction, AIInsight } from '@punto-park-u/shared-api'
import {
  getAnomalyStatsService,
  getRecentAnomaliesService,
  runAnomalyDetectionService,
  resolveAnomalyService,
  getOccupancyPredictionService,
  getAIInsightsService,
  withRetry,
} from '@punto-park-u/shared-api'

export interface AnalyticsState {
  // Data
  stats: AnomalyStats | null
  anomalies: Anomaly[]
  recentAnomalies: Anomaly[]
  occupancyPrediction: OccupancyPrediction | null
  aiInsights: AIInsight | null

  // Loading & Error
  loading: boolean
  error: string | null

  // Actions
  setStats: (stats: AnomalyStats | null) => void
  setAnomalies: (anomalies: Anomaly[]) => void
  setRecentAnomalies: (anomalies: Anomaly[]) => void
  setOccupancyPrediction: (prediction: OccupancyPrediction | null) => void
  setAIInsights: (insights: AIInsight | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Async Actions
  fetchStats: () => Promise<void>
  fetchRecentAnomalies: () => Promise<void>
  fetchOccupancyPrediction: (days?: number) => Promise<void>
  fetchAIInsights: () => Promise<void>
  resolveAnomaly: (id: string) => Promise<void>
  runDetection: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  // Initial state
  stats: null,
  anomalies: [],
  recentAnomalies: [],
  occupancyPrediction: null,
  aiInsights: null,
  loading: false,
  error: null,

  // Setters
  setStats: (stats) => set({ stats }),
  setAnomalies: (anomalies) => set({ anomalies }),
  setRecentAnomalies: (recentAnomalies) => set({ recentAnomalies }),
  setOccupancyPrediction: (occupancyPrediction) => set({ occupancyPrediction }),
  setAIInsights: (aiInsights) => set({ aiInsights }),
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

  // Fetch Prophet occupancy prediction
  fetchOccupancyPrediction: async (days = 7) => {
    set({ loading: true, error: null })
    try {
      const prediction = await withRetry(() => getOccupancyPredictionService(days))
      set({ occupancyPrediction: prediction, loading: false })
    } catch (err: any) {
      set({
        occupancyPrediction: {
          forecast: [],
          historical_days: 0,
          model: 'prophet',
          generated_at: new Date().toISOString(),
          error: err.message || 'Error al obtener predicción',
        },
        loading: false,
      })
    }
  },

  // Fetch AI Insights from Prophet
  fetchAIInsights: async () => {
    set({ loading: true, error: null })
    try {
      const insights = await withRetry(() => getAIInsightsService())
      set({ aiInsights: insights, loading: false })
    } catch (err: any) {
      set({
        aiInsights: {
          insights: ['⚠️ No se pudieron cargar los insights.'],
          recommendations: ['Intenta nuevamente más tarde.'],
          stats: {},
          generated_at: new Date().toISOString(),
        },
        loading: false,
      })
    }
  },
}))

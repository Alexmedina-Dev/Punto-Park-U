import { getApiClient } from './api.js'
import type { ApiResponse, AnomalyStats, Anomaly, PricingStats, PricingForecast, PricingSettings } from '@punto-park-u/shared-types'

// ── Analytics / Anomaly Services ──────────────────────────────────────

export async function getAnomalyStatsService(days = 7): Promise<AnomalyStats> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<AnomalyStats>>(`/anomalies/stats?days=${days}`)
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener estadísticas de anomalías')
  }
  return data.data
}

export async function getRecentAnomaliesService(limit = 20): Promise<Anomaly[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<Anomaly[]>>(`/anomalies/recent?limit=${limit}`)
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener anomalías recientes')
  }
  return data.data
}

export async function runAnomalyDetectionService(): Promise<{ count: number; anomalies: Anomaly[] }> {
  const api = getApiClient()
  const { data } = await api.post<ApiResponse<{ count: number; anomalies: Anomaly[] }>>('/anomalies/run')
  if (!data.success) {
    throw new Error(data.message || 'Error al ejecutar detección de anomalías')
  }
  return data.data
}

export async function resolveAnomalyService(id: string): Promise<Anomaly> {
  const api = getApiClient()
  const { data } = await api.put<ApiResponse<Anomaly>>(`/anomalies/${id}/resolve`)
  if (!data.success) {
    throw new Error(data.message || 'Error al resolver anomalía')
  }
  return data.data
}

// ── Pricing Services ─────────────────────────────────────────────────

export async function getPricingStatsService(): Promise<PricingStats> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<PricingStats>>('/pricing/stats')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener estadísticas de precios')
  }
  return data.data
}

export async function getPricingForecastService(vehicleType = 'car'): Promise<PricingForecast[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<PricingForecast[]>>(`/pricing/forecast?vehicleType=${vehicleType}`)
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener pronóstico de precios')
  }
  return data.data
}

export async function updatePricingSettingsService(settings: PricingSettings): Promise<PricingSettings> {
  const api = getApiClient()
  const { data } = await api.put<ApiResponse<PricingSettings>>('/pricing/settings', settings)
  if (!data.success) {
    throw new Error(data.message || 'Error al actualizar configuración de precios')
  }
  return data.data
}

export async function getOptimalSpotAssignmentService(reservationId: string): Promise<any> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<any>>(`/pricing/assignment/${reservationId}`)
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener asignación óptima')
  }
  return data.data
}

// ── Prophet Occupancy Prediction ───────────────────────────────────

export interface OccupancyForecastPoint {
  ds: string
  yhat: number
  yhat_lower: number
  yhat_upper: number
}

export interface OccupancyPrediction {
  forecast: OccupancyForecastPoint[]
  historical_days: number
  model: string
  generated_at: string
  error?: string
}

export async function getOccupancyPredictionService(days = 7): Promise<OccupancyPrediction> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<OccupancyPrediction>>(`/admin/analytics/occupancy-prediction?days=${days}`)
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener predicción de ocupación')
  }
  return data.data
}

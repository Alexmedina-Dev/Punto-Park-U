import { getApiClient } from './api.js'
import type { ApiResponse, AdminStats, ReportData, User, ParkingEntry, HourlyOccupancy, ParkedVehicle } from '@punto-park-u/shared-types'

export async function getDashboardStatsService(): Promise<AdminStats> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<AdminStats>>('/admin/stats')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener estadísticas')
  }
  return data.data
}

export async function getReportDataService(reportType: string): Promise<ReportData> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<ReportData>>(`/admin/reports/${reportType}`)
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener reporte')
  }
  return data.data
}

export async function getUsersService(): Promise<User[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<User[]>>('/admin/users')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener usuarios')
  }
  return data.data
}

export async function getAllEntriesService(): Promise<ParkingEntry[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<ParkingEntry[]>>('/admin/entries')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener entradas')
  }
  return data.data
}

export async function updateTariffsService(tariffs: Record<string, unknown>): Promise<void> {
  const api = getApiClient()
  const { data } = await api.put<ApiResponse<null>>('/admin/tariffs', tariffs)
  if (!data.success) {
    throw new Error(data.message || 'Error al actualizar tarifas')
  }
}

export async function updateScheduleService(schedule: Record<string, unknown>): Promise<void> {
  const api = getApiClient()
  const { data } = await api.put<ApiResponse<null>>('/admin/schedule', schedule)
  if (!data.success) {
    throw new Error(data.message || 'Error al actualizar horarios')
  }
}

export async function getOccupancyService(): Promise<HourlyOccupancy[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<HourlyOccupancy[]>>('/admin/occupancy')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener datos de ocupación')
  }
  return data.data
}

export async function getParkedVehiclesService(): Promise<ParkedVehicle[]> {
  const api = getApiClient()
  const { data } = await api.get<ApiResponse<ParkedVehicle[]>>('/admin/parked-vehicles')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener vehículos estacionados')
  }
  return data.data
}

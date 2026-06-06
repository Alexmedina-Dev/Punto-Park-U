import api from './api'
import type { ApiResponse, AdminStats, ReportData, User, ParkingEntry } from '@/types'

/**
 * Get admin dashboard statistics.
 */
export async function getDashboardStatsService(): Promise<AdminStats> {
  const { data } = await api.get<ApiResponse<AdminStats>>('/admin/stats')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener estadísticas')
  }
  return data.data
}

/**
 * Get report data for charts (financial, occupancy, etc.).
 */
export async function getReportDataService(reportType: string): Promise<ReportData> {
  const { data } = await api.get<ApiResponse<ReportData>>(`/admin/reports/${reportType}`)
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener reporte')
  }
  return data.data
}

/**
 * Get all registered users (admin only).
 */
export async function getUsersService(): Promise<User[]> {
  const { data } = await api.get<ApiResponse<User[]>>('/admin/users')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener usuarios')
  }
  return data.data
}

/**
 * Get all parking entries (admin only).
 */
export async function getAllEntriesService(): Promise<ParkingEntry[]> {
  const { data } = await api.get<ApiResponse<ParkingEntry[]>>('/admin/entries')
  if (!data.success) {
    throw new Error(data.message || 'Error al obtener entradas')
  }
  return data.data
}

/**
 * Update parking tariffs.
 */
export async function updateTariffsService(tariffs: Record<string, unknown>): Promise<void> {
  const { data } = await api.put<ApiResponse<null>>('/admin/tariffs', tariffs)
  if (!data.success) {
    throw new Error(data.message || 'Error al actualizar tarifas')
  }
}

/**
 * Update parking schedule.
 */
export async function updateScheduleService(schedule: Record<string, unknown>): Promise<void> {
  const { data } = await api.put<ApiResponse<null>>('/admin/schedule', schedule)
  if (!data.success) {
    throw new Error(data.message || 'Error al actualizar horarios')
  }
}

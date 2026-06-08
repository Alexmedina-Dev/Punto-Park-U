import { create } from 'zustand'
import type { Reservation } from '@punto-park-u/shared-types'
import {
  getReservationsService,
  createReservationService,
  cancelReservationService,
  getReservationStatsService,
  withRetry,
} from '@punto-park-u/shared-api'

export interface ReservationState {
  reservations: Reservation[]
  stats: {
    pending: number
    active: number
    completed: number
    cancelled: number
    total: number
  } | null
  isLoading: boolean
  error: string | null

  // Actions
  fetchReservations: () => Promise<void>
  fetchStats: () => Promise<void>
  createReservation: (data: {
    vehicle: string
    spot?: string
    entryTime: string
    date?: string
    startTime?: string
    endTime?: string
    notes?: string
  }) => Promise<boolean>
  cancelReservation: (id: string) => Promise<boolean>
  clearError: () => void
}

export const useReservationStore = create<ReservationState>((set) => ({
  reservations: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchReservations: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await withRetry(() => getReservationsService())
      set({ reservations: data, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchStats: async () => {
    try {
      const stats = await withRetry(() => getReservationStatsService())
      set({ stats })
    } catch {
      // Stats fetch is non-critical
    }
  },

  createReservation: async (reservationData) => {
    set({ isLoading: true, error: null })
    try {
      const reservation = await withRetry(() => createReservationService(reservationData))
      set((state) => ({
        reservations: [reservation, ...state.reservations],
        isLoading: false,
      }))
      return true
    } catch (error: any) {
      const msg = error?.message || 'Error al crear la reserva'
      set({ isLoading: false, error: msg })
      return false
    }
  },

  cancelReservation: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await withRetry(() => cancelReservationService(id))
      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.id === id ? { ...r, status: 'cancelled' as const } : r
        ),
        isLoading: false,
      }))
      return true
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  clearError: () => set({ error: null }),
}))

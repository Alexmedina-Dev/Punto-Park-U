import { create } from 'zustand'
import type { Vehicle } from '@punto-park-u/shared-types'
import {
  getVehiclesService,
  createVehicleService,
  updateVehicleService,
  deleteVehicleService,
  withRetry,
} from '@punto-park-u/shared-api'

export interface VehicleState {
  vehicles: Vehicle[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchVehicles: () => Promise<void>
  createVehicle: (data: {
    plate: string
    type: string
    brand?: string
    model?: string
    color?: string
  }) => Promise<boolean>
  updateVehicle: (id: string, updates: {
    plate?: string
    type?: string
    brand?: string
    model?: string
    color?: string
    isActive?: boolean
  }) => Promise<boolean>
  deleteVehicle: (id: string) => Promise<boolean>
  clearError: () => void
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  isLoading: false,
  error: null,

  fetchVehicles: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await withRetry(() => getVehiclesService({ isActive: true }))
      set({ vehicles: data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  createVehicle: async (vehicleData) => {
    set({ isLoading: true, error: null })
    try {
      console.log('[VehicleStore] Enviando createVehicle:', vehicleData)
      const vehicle = await withRetry(() => createVehicleService(vehicleData))
      console.log('[VehicleStore] Vehículo creado:', vehicle)
      set((state) => ({
        vehicles: [vehicle, ...state.vehicles],
        isLoading: false,
      }))
      return true
    } catch (error: any) {
      console.error('[VehicleStore] Error en createVehicle:', error?.message, error?.response?.data)
      const msg = error?.message || 'Error al registrar el vehiculo'
      set({ isLoading: false, error: msg })
      return false
    }
  },

  updateVehicle: async (id, updates) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await withRetry(() => updateVehicleService(id, updates))
      set((state) => ({
        vehicles: state.vehicles.map((v) => (v.id === id ? updated : v)),
        isLoading: false,
      }))
      return true
    } catch (error) {
      set({ isLoading: false })
      return false
    }
  },

  deleteVehicle: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await withRetry(() => deleteVehicleService(id))
      set((state) => ({
        vehicles: state.vehicles.filter((v) => v.id !== id),
        isLoading: false,
      }))
      return true
    } catch (error) {
      set({ isLoading: false })
      return false
    }
  },

  clearError: () => set({ error: null }),
}))

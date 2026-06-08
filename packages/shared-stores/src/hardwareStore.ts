import { create } from 'zustand'
import type { HardwareSensor, HardwareStatus, BarrierStatus } from '@punto-park-u/shared-types'
import {
  getSensorsService,
  getHardwareStatusService,
  getBarriersService,
  openBarrierService,
  closeBarrierService,
  withRetry,
} from '@punto-park-u/shared-api'

export interface HardwareState {
  // Data
  sensors: HardwareSensor[]
  barriers: BarrierStatus[]
  status: HardwareStatus | null

  // Loading & Error
  loading: boolean
  error: string | null

  // Actions
  setSensors: (sensors: HardwareSensor[]) => void
  setBarriers: (barriers: BarrierStatus[]) => void
  setStatus: (status: HardwareStatus | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Async Actions
  fetchSensors: () => Promise<void>
  fetchBarriers: () => Promise<void>
  fetchStatus: () => Promise<void>
  openBarrier: (id: string, simulated?: boolean) => Promise<void>
  closeBarrier: (id: string, simulated?: boolean) => Promise<void>
}

export const useHardwareStore = create<HardwareState>((set) => ({
  // Initial state
  sensors: [],
  barriers: [],
  status: null,
  loading: false,
  error: null,

  // Setters
  setSensors: (sensors) => set({ sensors }),
  setBarriers: (barriers) => set({ barriers }),
  setStatus: (status) => set({ status }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Fetch sensors
  fetchSensors: async () => {
    set({ loading: true, error: null })
    try {
      const sensors = await withRetry(() => getSensorsService())
      set({ sensors, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar sensores', loading: false })
    }
  },

  // Fetch barriers
  fetchBarriers: async () => {
    set({ loading: true, error: null })
    try {
      const barriers = await withRetry(() => getBarriersService())
      set({ barriers, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar barreras', loading: false })
    }
  },

  // Fetch hardware status
  fetchStatus: async () => {
    set({ loading: true, error: null })
    try {
      const status = await withRetry(() => getHardwareStatusService())
      set({ status, loading: false })
    } catch (err: any) {
      set({ error: err.message || 'Error al cargar estado del hardware', loading: false })
    }
  },

  // Open barrier
  openBarrier: async (id: string, simulated = false) => {
    try {
      await withRetry(() => openBarrierService(id, simulated))
      // Refresh barriers
      const barriers = await withRetry(() => getBarriersService())
      set({ barriers })
    } catch (err: any) {
      set({ error: err.message || 'Error al abrir barrera' })
    }
  },

  // Close barrier
  closeBarrier: async (id: string, simulated = false) => {
    try {
      await withRetry(() => closeBarrierService(id, simulated))
      // Refresh barriers
      const barriers = await withRetry(() => getBarriersService())
      set({ barriers })
    } catch (err: any) {
      set({ error: err.message || 'Error al cerrar barrera' })
    }
  },
}))

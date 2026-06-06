import { useCallback } from 'react'
import { useAppStore } from '@/stores/appStore'
import { showErrorToast } from '@/utils/errorHandler'

/**
 * Hook for fetching and managing parking data.
 * Provides tariffs, schedule, and availability data.
 */
export function useParkingData() {
  const store = useAppStore()

  const fetchTariffs = useCallback(async () => {
    store.setLoading(true)
    try {
      await store.fetchTariffs()
    } catch (error) {
      showErrorToast(error)
    } finally {
      store.setLoading(false)
    }
  }, [store])

  const fetchSchedule = useCallback(async () => {
    store.setLoading(true)
    try {
      await store.fetchSchedule()
    } catch (error) {
      showErrorToast(error)
    } finally {
      store.setLoading(false)
    }
  }, [store])

  const fetchAvailability = useCallback(async () => {
    store.setLoading(true)
    try {
      await store.fetchAvailability()
    } catch (error) {
      showErrorToast(error)
    } finally {
      store.setLoading(false)
    }
  }, [store])

  return {
    tariffs: store.tariffs,
    schedule: store.schedule,
    availability: store.availability,
    isLoading: store.isLoading,
    fetchTariffs,
    fetchSchedule,
    fetchAvailability,
  }
}

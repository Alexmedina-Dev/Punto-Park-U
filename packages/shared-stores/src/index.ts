// ╔══════════════════════════════════════════════════════════════════════╗
// ║  @punto-park-u/shared-stores                                        ║
// ║  Shared Zustand stores with platform-agnostic storage               ║
// ╚══════════════════════════════════════════════════════════════════════╝

export { setStorageAdapter, getStorage, STORAGE_KEYS } from './storage.js'
export { createWebStorageAdapter, createMobileStorageAdapter, createMemoryStorageAdapter } from './createStorageAdapter.js'

export { useAuthStore } from './authStore.js'
export type { AuthState } from './authStore.js'

export { useAppStore } from './appStore.js'
export type { AppState } from './appStore.js'

export { useVehicleStore } from './vehicleStore.js'
export type { VehicleState } from './vehicleStore.js'

export { useReservationStore } from './reservationStore.js'
export type { ReservationState } from './reservationStore.js'

export { usePaymentStore } from './paymentStore.js'
export type { PaymentState } from './paymentStore.js'

export { useAdminStore } from './adminStore.js'
export type { AdminState } from './adminStore.js'

export { useNotificationStore } from './notificationStore.js'
export type { NotificationsState } from './notificationStore.js'
export type { Notification } from './notificationStore.js'

export { useAnalyticsStore } from './analyticsStore.js'
export type { AnalyticsState } from './analyticsStore.js'

export { usePricingStore } from './pricingStore.js'
export type { PricingState } from './pricingStore.js'

export { useHardwareStore } from './hardwareStore.js'
export type { HardwareState } from './hardwareStore.js'

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  @punto-park-u/shared-api                                           ║
// ║  Shared API services and Axios instance                             ║
// ╚══════════════════════════════════════════════════════════════════════╝

export { initApiClient, getApiClient, clearApiCache } from './api.js'
export { parseError, withRetry } from './errorHandler.js'

// Service re-exports
export {
  loginService,
  adminLoginService,
  registerService,
  logoutService,
  forgotPasswordService,
  resetPasswordService,
  refreshTokenService,
  verify2FAService,
  verifyBackupCodeService,
  getSessionsService,
  revokeSessionService,
  revokeAllSessionsService,
  sendActivityHeartbeatService,
  getSessionStatsService,
  getUsersService,
  getUserService,
  updateUserService,
  updateUserRoleService,
  deleteUserService,
  getUserStatsService,
  getProfileService,
  sendVerificationService,
  verifyEmailService,
  resendVerificationService,
  get2FAStatusService,
  setup2FAService,
  verifySetup2FAService,
  disable2FAService,
  generateBackupCodesService,
  deleteOwnAccountService,
} from './auth.service.js'

export {
  getVehiclesService,
  getVehicleService,
  createVehicleService,
  updateVehicleService,
  deleteVehicleService,
} from './vehicle.service.js'

export {
  getReservationsService,
  getReservationService,
  createReservationService,
  updateReservationService,
  cancelReservationService,
  getReservationStatsService,
} from './reservation.service.js'

export {
  getPaymentsService,
  getPaymentService,
  createPaymentService,
  getPaymentStatsService,
  createEpaycoCheckoutService,
  getEpaycoPaymentStatusService,
  refundEpaycoPaymentService,
  confirmManualPaymentService,
} from './payment.service.js'

export {
  getTariffsService,
  getScheduleService,
  getAvailabilityService,
  getParkingSpotsService,
  getRecentEntriesService,
  getUserReservationsService,
} from './parking.service.js'

export {
  generateQRService,
  getQRTicketService,
  validateQRService,
  processExitService,
} from './qr.service.js'

export {
  getDashboardStatsService,
  getReportDataService,
  getUsersService as getAdminUsersService,
  getAllEntriesService,
  updateTariffsService,
  updateScheduleService,
  getOccupancyService,
  getParkedVehiclesService,
} from './admin.service.js'

export {
  getActivityLogService,
} from './activity.service.js'

export {
  getAlertsService,
  dismissAlertService,
} from './alert.service.js'

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToPush,
  unsubscribeFromPush,
  getVapidPublicKey,
} from './notification.service.js'
export type { Notification } from './notification.service.js'

export {
  getAnomalyStatsService,
  getRecentAnomaliesService,
  runAnomalyDetectionService,
  resolveAnomalyService,
  getPricingStatsService,
  getPricingForecastService,
  updatePricingSettingsService,
  getOptimalSpotAssignmentService,
  getOccupancyPredictionService,
  getAIInsightsService,
} from './analytics.service.js'
export type { OccupancyForecastPoint, OccupancyPrediction, AIInsight } from './analytics.service.js'

export {
  getSensorsService,
  getSensorByIdService,
  getHardwareStatusService,
  getBarriersService,
  openBarrierService,
  closeBarrierService,
  overrideBarrierService,
} from './hardware.service.js'

export {
  WebSocketService,
} from './websocket.service.js'
export type {
  WsEventCallback,
} from './websocket.service.js'

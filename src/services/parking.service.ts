// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Re-export wrapper — web app                                       ║
// ║  Parking services now come from @punto-park-u/shared-api            ║
// ╚══════════════════════════════════════════════════════════════════════╝

export {
  getTariffsService,
  getScheduleService,
  getAvailabilityService,
  getParkingSpotsService,
  getRecentEntriesService,
  getUserReservationsService,
} from '@punto-park-u/shared-api'

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Re-export wrapper — web app                                       ║
// ║  Admin services now come from @punto-park-u/shared-api              ║
// ╚══════════════════════════════════════════════════════════════════════╝

export {
  getDashboardStatsService,
  getReportDataService,
  getAdminUsersService as getUsersService,
  getAllEntriesService,
  updateTariffsService,
  updateScheduleService,
  getOccupancyService,
  getParkedVehiclesService,
} from '@punto-park-u/shared-api'

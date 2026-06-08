// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Re-export wrapper — web app                                       ║
// ║  Vehicle services now come from @punto-park-u/shared-api            ║
// ╚══════════════════════════════════════════════════════════════════════╝

export {
  getVehiclesService,
  getVehicleService,
  createVehicleService,
  updateVehicleService,
  deleteVehicleService,
} from '@punto-park-u/shared-api'

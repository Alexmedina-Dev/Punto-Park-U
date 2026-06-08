// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Re-export wrapper — web app                                       ║
// ║  QR services now come from @punto-park-u/shared-api                 ║
// ╚══════════════════════════════════════════════════════════════════════╝

export {
  generateQRService,
  getQRTicketService,
  validateQRService,
  processExitService,
} from '@punto-park-u/shared-api'

// ╔══════════════════════════════════════════════════════════════════════╗
// ║  WebSocket service                                                  ║
// ║  Re-exports from shared-api with web-specific token source          ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { WebSocketService as BaseWebSocketService } from '@punto-park-u/shared-api'
import { STORAGE_KEYS } from '@/utils/constants'

export type {
  WsEventCallback,
} from '@punto-park-u/shared-api'

export type { WsSpotUpdate, WsAlertEvent, WsActivityEvent } from '@punto-park-u/shared-types'

/**
 * Web-specific WebSocket service.
 * Uses localStorage for JWT token (browser-compatible).
 */
const wsService = new BaseWebSocketService({
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
})

export { BaseWebSocketService as WebSocketService }
export default wsService

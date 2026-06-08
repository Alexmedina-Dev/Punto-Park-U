import { io, Socket } from 'socket.io-client'

// ── Types ──

export interface WsSpotUpdate {
  id: string
  zone: string
  status: 'libre' | 'ocupado' | 'reservado'
  vehicleType?: string
  plate?: string
}

export interface WsAlertEvent {
  id: string
  type: string
  message: string
  severity?: string
  zone?: string
  timestamp: string
  resolved: boolean
  createdAt?: string
  updatedAt?: string
}

export interface WsActivityEvent {
  id: string
  action: string
  userId?: string
  type: string
  details?: Record<string, unknown>
  timestamp: string
}

export type WsEventCallback<T = unknown> = (data: T) => void

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed'
type PollCallback = () => Promise<void>

// ── Service ──

export class WebSocketService {
  private socket: Socket | null = null
  private state: ConnectionState = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectDelay = 30000
  private baseReconnectDelay = 1000
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private fallbackTimer: ReturnType<typeof setInterval> | null = null
  private fallbackCallbacks: PollCallback[] = []
  private eventHandlers = new Map<string, Set<WsEventCallback>>()
  private serverUrl: string
  private getToken: () => Promise<string | null> | string | null

  constructor(config: {
    serverUrl?: string
    getToken: () => Promise<string | null> | string | null
  }) {
    const apiUrl = config.serverUrl || 'http://localhost:3000'
    this.serverUrl = apiUrl.replace('/api', '').replace(/^http/, 'ws')
    this.getToken = config.getToken
  }

  connect(): void {
    if (this.socket?.connected) return

    this.state = 'connecting'
    const token = this.getToken()

    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: false,
      timeout: 10000,
    })

    this.socket.on('connect', () => {
      this.state = 'connected'
      this.reconnectAttempts = 0
      this.clearFallback()

      if (token) {
        this.socket?.emit('auth', { token }, (response: { success: boolean; error?: string }) => {
          if (!response.success) {
            this.state = 'failed'
            this.startFallback()
          } else {
            this.flushBufferedEvents()
          }
        })
      }
    })

    this.socket.on('disconnect', () => {
      this.state = 'disconnected'
      this.scheduleReconnect()
    })

    this.socket.on('connect_error', () => {
      this.state = 'failed'
      this.socket?.close()
      this.startFallback()
    })

    this.eventHandlers.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb as WsEventCallback)
      })
    })

    this.socket.connect()
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )

    this.state = 'connecting'

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private startFallback(): void {
    if (this.fallbackTimer) return
    this.fallbackTimer = setInterval(async () => {
      for (const cb of this.fallbackCallbacks) {
        try {
          await cb()
        } catch {
          // Silently handle poll errors
        }
      }
    }, 10000)
  }

  private clearFallback(): void {
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer)
      this.fallbackTimer = null
    }
  }

  registerFallback(cb: PollCallback): void {
    this.fallbackCallbacks.push(cb)
  }

  private bufferedEvents: Array<{ event: string; data: unknown }> = []

  private flushBufferedEvents(): void {
    while (this.bufferedEvents.length > 0) {
      const { event, data } = this.bufferedEvents.shift()!
      this.emit(event, data)
    }
  }

  on<T = unknown>(event: string, callback: WsEventCallback<T>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(callback as WsEventCallback)

    this.socket?.on(event, callback as WsEventCallback)

    return () => {
      this.eventHandlers.get(event)?.delete(callback as WsEventCallback)
      this.socket?.off(event, callback as WsEventCallback)
    }
  }

  off<T = unknown>(event: string, callback: WsEventCallback<T>): void {
    this.eventHandlers.get(event)?.delete(callback as WsEventCallback)
    this.socket?.off(event, callback as WsEventCallback)
  }

  emit(event: string, data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      this.bufferedEvents.push({ event, data })
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.clearFallback()
    this.socket?.close()
    this.socket = null
    this.state = 'disconnected'
    this.reconnectAttempts = 0
  }

  isConnected(): boolean {
    return this.state === 'connected'
  }

  getState(): ConnectionState {
    return this.state
  }
}

import React, { useEffect } from 'react'
import { Card, Badge } from '@/components/ui'
import wsService from '@/services/websocket.service'
import type { Alert } from '@/types'
import type { WsAlertEvent } from '@/services/websocket.service'
import { formatDateTime } from '@/utils/formatters'

interface AlertsPanelProps {
  alerts: Alert[]
  className?: string
  onNewAlert?: (alert: Alert) => void
}

const alertIcons: Record<string, string> = {
  warning: 'warning',
  error: 'error',
  info: 'info',
  success: 'check_circle',
}

const alertBadge: Record<string, 'warning' | 'error' | 'info' | 'success'> = {
  warning: 'warning',
  error: 'error',
  info: 'info',
  success: 'success',
}

/**
 * Map a WsAlertEvent (from WebSocket) to the Alert type used by the component.
 */
function mapWsAlertToAlert(wsAlert: WsAlertEvent): Alert {
  return {
    id: wsAlert.id,
    type: (wsAlert.type === 'system' || wsAlert.type === 'hardware' || wsAlert.type === 'security' || wsAlert.type === 'occupancy'
      ? 'warning'
      : wsAlert.type) as Alert['type'],
    title: wsAlert.type.charAt(0).toUpperCase() + wsAlert.type.slice(1),
    message: wsAlert.message,
    timestamp: wsAlert.timestamp,
    resolved: wsAlert.resolved,
  }
}

/**
 * Active alerts panel — displays unresolved system alerts.
 * Subscribes to real-time alert updates via WebSocket.
 */
export function AlertsPanel({ alerts, className = '', onNewAlert }: AlertsPanelProps) {
  // Subscribe to real-time alerts
  useEffect(() => {
    wsService.connect()

    const unsubscribe = wsService.on<WsAlertEvent>('alert:new', (wsAlert) => {
      const alert = mapWsAlertToAlert(wsAlert)
      onNewAlert?.(alert)
    })

    return () => {
      unsubscribe()
    }
  }, [onNewAlert])

  const activeAlerts = alerts.filter((a) => !a.resolved)

  if (activeAlerts.length === 0) {
    return (
      <Card variant="glass" title="Alertas Activas" className={className}>
        <div className="text-center py-6 text-on-surface-var text-sm">
          <span className="material-symbols-outlined text-3xl mb-2 block text-green-400">
            check_circle
          </span>
          <p>No hay alertas activas.</p>
          <p className="text-xs mt-1">Todo funcionando correctamente.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="glass" title="Alertas Activas" className={className}>
      <div className="space-y-3">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`
              flex items-start gap-3 p-3 rounded-lg border
              ${alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                alert.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
                alert.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                'bg-primary/10 border-primary/20'}
            `}
          >
            <span
              className={`material-symbols-outlined text-lg mt-0.5 ${
                alert.type === 'warning' ? 'text-yellow-400' :
                alert.type === 'error' ? 'text-red-400' :
                alert.type === 'success' ? 'text-green-400' :
                'text-primary'
              }`}
            >
              {alertIcons[alert.type] || 'info'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{alert.title}</span>
                <Badge variant={alertBadge[alert.type] || 'info'}>{alert.type}</Badge>
              </div>
              <p className="text-xs text-on-surface-var mt-0.5">{alert.message}</p>
              <p className="text-[10px] text-on-surface-var/60 mt-1">
                {formatDateTime(alert.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

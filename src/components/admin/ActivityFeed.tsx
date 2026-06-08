import React, { useEffect } from 'react'
import { Card, Badge } from '@/components/ui'
import wsService from '@/services/websocket.service'
import type { ActivityLog } from '@/types'
import type { WsActivityEvent } from '@/services/websocket.service'
import { formatDateTime } from '@/utils/formatters'

interface ActivityFeedProps {
  entries: ActivityLog[]
  className?: string
  onNewEntry?: (entry: ActivityLog) => void
}

const typeIcons: Record<string, string> = {
  create: 'add_circle',
  update: 'edit',
  delete: 'delete',
  payment: 'payments',
  entry: 'login',
  exit: 'logout',
}

const typeColors: Record<string, string> = {
  create: 'text-green-400',
  update: 'text-primary',
  delete: 'text-red-400',
  payment: 'text-green-400',
  entry: 'text-primary',
  exit: 'text-yellow-400',
}

/**
 * Map a WsActivityEvent (from WebSocket) to the ActivityLog type.
 */
function mapWsActivityToLog(wsActivity: WsActivityEvent): ActivityLog {
  return {
    id: wsActivity.id,
    action: wsActivity.action,
    description: wsActivity.details?.description as string || wsActivity.action,
    user: wsActivity.details?.userName as string || 'Sistema',
    userRole: wsActivity.details?.userRole as string || 'system',
    timestamp: wsActivity.timestamp,
    type: wsActivity.type === 'payment' ? 'payment'
      : wsActivity.type === 'vehicle' ? 'create'
      : 'update',
  }
}

/**
 * Recent activity feed — "Actividad Reciente".
 * Shows a timeline of the latest actions in the system.
 * Subscribes to real-time activity updates via WebSocket.
 */
export function ActivityFeed({ entries, className = '', onNewEntry }: ActivityFeedProps) {
  // Subscribe to real-time activity
  useEffect(() => {
    wsService.connect()

    const unsubscribe = wsService.on<WsActivityEvent>('activity:new', (wsActivity) => {
      const entry = mapWsActivityToLog(wsActivity)
      onNewEntry?.(entry)
    })

    return () => {
      unsubscribe()
    }
  }, [onNewEntry])

  if (entries.length === 0) {
    return (
      <Card variant="glass" title="Actividad Reciente" className={className}>
        <div className="text-center py-6 text-on-surface-var text-sm">
          <span className="material-symbols-outlined text-3xl mb-2 block">history</span>
          <p>No hay actividad reciente.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="glass" title="Actividad Reciente" className={className}>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3.5 top-3 bottom-3 w-px bg-outline/20" />

        <div className="space-y-0">
          {entries.slice(0, 10).map((entry, i) => (
            <div key={entry.id} className="flex gap-3 py-2.5 relative">
              {/* Timeline dot */}
              <div className="relative z-10 flex items-start pt-0.5">
                <span
                  className={`material-symbols-outlined text-sm ${
                    typeColors[entry.type] || 'text-on-surface-var'
                  } bg-surface-container`}
                >
                  {typeIcons[entry.type] || 'circle'}
                </span>
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{entry.action}</span>
                  <Badge variant={
                    entry.userRole === 'admin' ? 'info' :
                    entry.userRole === 'operator' ? 'warning' :
                    'success'
                  }>
                    {entry.user}
                  </Badge>
                </div>
                <p className="text-xs text-on-surface-var mt-0.5 line-clamp-1">
                  {entry.description}
                </p>
                <p className="text-[10px] text-on-surface-var/60 mt-0.5">
                  {formatDateTime(entry.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

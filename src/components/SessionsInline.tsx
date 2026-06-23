import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Badge } from '@/components/ui'
import {
  getSessionsService,
  revokeSessionService,
  revokeAllSessionsService,
} from '@/services/auth.service'
import type { SessionData } from '@/types'
import { showSuccessToast, showErrorToast } from '@/utils/errorHandler'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Justo ahora'
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`

  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`

  return formatDate(dateStr)
}

function getDeviceIcon(device: string): string {
  switch (device) {
    case 'mobile':
      return 'phone_android'
    case 'tablet':
      return 'tablet'
    case 'bot':
      return 'smart_toy'
    default:
      return 'laptop'
  }
}

export function SessionsInline() {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getSessionsService()
      setSessions(data)
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  const handleRevoke = async (sessionId: string) => {
    setRevokingId(sessionId)
    try {
      await revokeSessionService(sessionId)
      showSuccessToast('Sesión cerrada correctamente')
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (error) {
      showErrorToast(error)
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeAll = async () => {
    setIsLoading(true)
    try {
      const result = await revokeAllSessionsService()
      showSuccessToast(`${result.modifiedCount} sesión(es) cerrada(s)`)
      await loadSessions()
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsLoading(false)
    }
  }

  const activeSessions = sessions.filter((s) => !s.isExpired && !s.isInactive)

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-sm text-on-surface-var">
          {activeSessions.length} sesión(es) activa(s)
        </p>
        {activeSessions.length > 1 && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleRevokeAll}
            loading={isLoading}
            className="w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-base">devices_off</span>
            Cerrar todas
          </Button>
        )}
      </div>

      {/* Sessions List */}
      <Card variant="glass" className="overflow-hidden">
        {isLoading && sessions.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-on-surface-var">
            <span className="material-symbols-outlined text-3xl sm:text-4xl mb-3 block">hourglass_empty</span>
            <p className="text-sm sm:text-base">Cargando sesiones...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-on-surface-var">
            <span className="material-symbols-outlined text-3xl sm:text-4xl mb-3 block">devices_off</span>
            <p className="text-sm sm:text-base">No hay sesiones activas</p>
          </div>
        ) : (
          <div className="divide-y divide-outline/10">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`flex flex-col sm:flex-row sm:items-start gap-3 p-3 sm:p-4 transition-colors hover:bg-surface-container/50 ${
                  session.isCurrent ? 'bg-primary/5' : ''
                }`}
              >
                {/* Device Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">
                    {getDeviceIcon(session.device)}
                  </span>
                </div>

                {/* Session Info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-on-bg capitalize text-sm sm:text-base">
                      {session.device === 'desktop'
                        ? 'Computador'
                        : session.device === 'mobile'
                          ? 'Teléfono'
                          : session.device === 'tablet'
                            ? 'Tablet'
                            : session.device}
                    </span>
                    {session.isCurrent && (
                      <Badge variant="success" className="text-xs">Actual</Badge>
                    )}
                    {session.isInactive && !session.isCurrent && (
                      <Badge variant="warning" className="text-xs">Inactiva</Badge>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm text-on-surface-var space-y-0.5">
                    {session.ipAddress && (
                      <p className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-xs flex-shrink-0">language</span>
                        <span className="truncate">{session.ipAddress}</span>
                      </p>
                    )}
                    {session.userAgent && (
                      <p className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs flex-shrink-0">info</span>
                        <span className="truncate block max-w-[200px] sm:max-w-none">{session.userAgent}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs flex-shrink-0">schedule</span>
                      Última actividad: {getRelativeTime(session.lastActiveAt)}
                    </p>
                    <p className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs flex-shrink-0">calendar_today</span>
                      Creada: {formatDate(session.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Revoke Button */}
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(session.id)}
                    loading={revokingId === session.id}
                    className="flex-shrink-0 text-error self-start sm:self-auto mt-1 sm:mt-0"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                    Cerrar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Box */}
      <Card variant="glass">
        <div className="flex items-start gap-3 text-xs sm:text-sm text-on-surface-var">
          <span className="material-symbols-outlined text-primary flex-shrink-0">info</span>
          <div>
            <p className="font-medium text-on-bg mb-1">Acerca de las sesiones</p>
            <p>
              Las sesiones se cierran automáticamente después de 30 minutos de inactividad.
              Puedes cerrar sesiones individuales para proteger tu cuenta en caso de
              haber iniciado sesión en un dispositivo que no reconoces.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/layout'
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

export function SessionsPage() {
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
      // Remove from local state
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
      // Reload to get updated list (current session remains)
      await loadSessions()
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsLoading(false)
    }
  }

  const activeSessions = sessions.filter((s) => !s.isExpired && !s.isInactive)

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline">
              Sesiones Activas
            </h1>
            <p className="text-on-surface-var mt-1">
              {activeSessions.length} sesión(es) activa(s) — Gestiona tus dispositivos conectados
            </p>
          </div>
          {activeSessions.length > 1 && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleRevokeAll}
              loading={isLoading}
            >
              <span className="material-symbols-outlined text-base">devices_off</span>
              Cerrar todas
            </Button>
          )}
        </div>

        {/* Sessions List */}
        <Card variant="glass">
          {isLoading && sessions.length === 0 ? (
            <div className="text-center py-12 text-on-surface-var">
              <span className="material-symbols-outlined text-4xl mb-3 block">hourglass_empty</span>
              <p>Cargando sesiones...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-on-surface-var">
              <span className="material-symbols-outlined text-4xl mb-3 block">devices_off</span>
              <p>No hay sesiones activas</p>
            </div>
          ) : (
            <div className="divide-y divide-outline/10">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-start gap-4 p-4 transition-colors hover:bg-surface-container/50 ${
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-on-bg capitalize">
                        {session.device === 'desktop'
                          ? 'Computador'
                          : session.device === 'mobile'
                            ? 'Teléfono'
                            : session.device === 'tablet'
                              ? 'Tablet'
                              : session.device}
                      </span>
                      {session.isCurrent && (
                        <Badge variant="success">
                          Actual
                        </Badge>
                      )}
                      {session.isInactive && !session.isCurrent && (
                        <Badge variant="warning">
                          Inactiva
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-on-surface-var space-y-0.5">
                      {session.ipAddress && (
                        <p className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">language</span>
                          {session.ipAddress}
                        </p>
                      )}
                      {session.userAgent && (
                        <p className="truncate flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">info</span>
                          {session.userAgent}
                        </p>
                      )}
                      <p className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        Última actividad: {getRelativeTime(session.lastActiveAt)}
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
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
                      className="flex-shrink-0 text-error"
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
        <Card variant="glass" className="mt-6">
          <div className="flex items-start gap-3 text-sm text-on-surface-var">
            <span className="material-symbols-outlined text-primary">info</span>
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
    </Layout>
  )
}

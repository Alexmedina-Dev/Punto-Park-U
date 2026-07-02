import { useState, useEffect } from 'react'
import { Card, Badge } from '@/components/ui'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters'

export function AnalyticsPanel() {
  const {
    stats,
    anomalies,
    recentAnomalies,
    loading,
    error,
    fetchStats,
    fetchRecentAnomalies,
    resolveAnomaly,
    runDetection,
  } = useAnalyticsStore()

  const [activeSection, setActiveSection] = useState<'overview' | 'anomalies'>('overview')

  useEffect(() => {
    fetchStats()
    fetchRecentAnomalies()
  }, [fetchStats, fetchRecentAnomalies])

  const handleResolve = async (id: string) => {
    await resolveAnomaly(id)
    fetchRecentAnomalies()
  }

  const handleRunDetection = async () => {
    await runDetection()
    fetchRecentAnomalies()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-error text-on-error'
      case 'medium': return 'bg-warning text-on-warning'
      case 'low': return 'bg-info text-on-info'
      default: return 'bg-surface-container text-on-surface'
    }
  }

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-on-bg font-headline">
            Analítica Predictiva — Flux AI v2.0
          </h2>
          <p className="text-sm text-on-surface-var mt-1">
            Motor de inteligencia artificial para predicción de ocupación y detección de anomalías
          </p>
        </div>
        <Card variant="glass" padding="lg">
          <div className="text-center py-8 text-on-surface-var">
            <span className="material-symbols-outlined text-4xl mb-2 animate-spin">refresh</span>
            <p>Cargando datos de analítica...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-on-bg font-headline">
            Analítica Predictiva — Flux AI v2.0
          </h2>
          <p className="text-sm text-on-surface-var mt-1">
            Motor de inteligencia artificial para predicción de ocupación y detección de anomalías
          </p>
        </div>
        <Card variant="glass" padding="lg">
          <div className="text-center py-8 text-on-surface-var">
            <span className="material-symbols-outlined text-4xl mb-2">error</span>
            <p>No se pudieron cargar los datos de analítica.</p>
            <p className="text-sm mt-2">El servicio de IA puede no estar disponible. Verifique la conexión con el backend.</p>
            <button
              onClick={() => { fetchStats(); fetchRecentAnomalies() }}
              className="mt-4 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-light transition-colors"
            >
              Reintentar
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-on-bg font-headline break-words">
            Analítica Predictiva — Flux AI v2.0
          </h2>
          <p className="text-sm text-on-surface-var mt-1 break-words">
            Motor de inteligencia artificial para predicción de ocupación y detección de anomalías
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              activeSection === 'overview'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-var hover:text-on-bg'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveSection('anomalies')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
              activeSection === 'anomalies'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-var hover:text-on-bg'
            }`}
          >
            Anomalías
          </button>
        </div>
      </div>

      {/* System Status Banner */}
      <Card variant="glass" padding="md">
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-3 h-3 rounded-full ${stats?.status === 'active' ? 'bg-success animate-pulse' : 'bg-warning'}`} />
            <span className="text-sm font-bold text-on-bg">
              {stats?.status === 'active' ? 'Motor IA Activo' : 'Motor en entrenamiento'}
            </span>
          </div>
          <div className="h-4 w-px bg-outline/20 shrink-0" />
          <div className="text-xs text-on-surface-var min-w-0 break-words">
            <span className="material-symbols-outlined text-xs align-text-bottom">info</span>
            {' '}Modelo de predicción de ocupación basado en Prophet y detección de anomalías en tiempo real
          </div>
        </div>
      </Card>

      {/* Overview Section */}
      {activeSection === 'overview' && stats && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-primary">
                  monitoring
                </span>
                <div>
                  <p className="text-sm text-on-surface-var">Predicción Hoy</p>
                  <p className="text-2xl font-bold text-on-bg">
                    {formatNumber(stats.todayPrediction)}
                  </p>
                </div>
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-secondary">
                  schedule
                </span>
                <div>
                  <p className="text-sm text-on-surface-var">Hora Pico Predicha</p>
                  <p className="text-2xl font-bold text-on-bg">
                    {stats.peakHourPrediction}
                  </p>
                </div>
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-tertiary">
                  percent
                </span>
                <div>
                  <p className="text-sm text-on-surface-var">Precisión</p>
                  <p className="text-2xl font-bold text-on-bg">
                    {formatPercentage(stats.accuracy * 100)}
                  </p>
                </div>
              </div>
            </Card>
            <Card variant="glass" padding="md">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-error">
                  warning
                </span>
                <div>
                  <p className="text-sm text-on-surface-var">Anomalías 24h</p>
                  <p className="text-2xl font-bold text-on-bg">
                    {stats.anomalyCount24h}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="glass" title="Métricas del Modelo Predictivo">
                <div className="space-y-3">
                <div className="flex justify-between items-center gap-3 py-2 border-b border-outline min-w-0">
                  <span className="text-sm text-on-surface-var break-words min-w-0">MAE (Error Absoluto Medio)</span>
                  <span className="font-bold text-on-bg shrink-0">{formatNumber(stats.mae)}</span>
                </div>
                <div className="flex justify-between items-center gap-3 py-2 border-b border-outline min-w-0">
                  <span className="text-sm text-on-surface-var break-words min-w-0">RMSE (Raíz Error Cuadrático)</span>
                  <span className="font-bold text-on-bg shrink-0">{formatNumber(stats.rmse)}</span>
                </div>
                <div className="flex justify-between items-center gap-3 py-2 border-b border-outline min-w-0">
                  <span className="text-sm text-on-surface-var break-words min-w-0">R² (Coeficiente de Determinación)</span>
                  <span className="font-bold text-on-bg shrink-0">{formatNumber(stats.r2)}</span>
                </div>
                <div className="flex justify-between items-center gap-3 py-2 border-b border-outline min-w-0">
                  <span className="text-sm text-on-surface-var break-words min-w-0">Tasa de Predicción Temprana</span>
                  <span className="font-bold text-on-bg shrink-0">{formatPercentage(stats.earlyPredictionRate * 100)}</span>
                </div>
                <div className="flex justify-between items-center gap-3 py-2 min-w-0">
                  <span className="text-sm text-on-surface-var break-words min-w-0">Predicciones Últimos 7 Días</span>
                  <span className="font-bold text-on-bg shrink-0">{formatNumber(stats.predictionsLast7Days)}</span>
                </div>
              </div>
            </Card>

            <Card variant="glass" title="Estado del Sistema IA">
              <div className="space-y-3">
                <div className="flex items-center gap-3 py-2">
                  <div className={`w-3 h-3 rounded-full ${stats.status === 'active' ? 'bg-success' : 'bg-warning'}`} />
                  <span className="text-sm text-on-surface-var">Estado del Modelo</span>
                  <span className="font-bold text-on-bg ml-auto">
                    {stats.status === 'active' ? 'Activo' : 'Entrenando'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline">
                  <span className="text-sm text-on-surface-var">Último Entrenamiento</span>
                  <span className="font-bold text-on-bg">
                    {stats.lastTrained ? new Date(stats.lastTrained).toLocaleString('es-CO') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline">
                  <span className="text-sm text-on-surface-var">Datos de Entrenamiento</span>
                  <span className="font-bold text-on-bg">{formatNumber(stats.trainingDataCount)} registros</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline">
                  <span className="text-sm text-on-surface-var">Tasa de Falsos Positivos</span>
                  <span className="font-bold text-on-bg">{formatPercentage(stats.falsePositiveRate * 100)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-on-surface-var">Tasa de Falsos Negativos</span>
                  <span className="font-bold text-on-bg">{formatPercentage(stats.falseNegativeRate * 100)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Anomalies Section */}
      {activeSection === 'anomalies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-on-surface-var">
              {recentAnomalies.length} anomalías sin resolver
            </p>
            <button
              onClick={handleRunDetection}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:bg-primary-light transition-colors self-start sm:self-auto"
              disabled={loading}
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              {loading ? 'Analizando...' : 'Detectar Ahora'}
            </button>
          </div>

          {recentAnomalies.length === 0 ? (
            <Card variant="glass" padding="lg">
              <div className="text-center text-on-surface-var">
                <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                <p>No hay anomalías detectadas recientemente</p>
                <p className="text-sm mt-2">El sistema está operando dentro de parámetros normales</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentAnomalies.map((anomaly) => (
                <Card key={anomaly._id} variant="glass" padding="md">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                        <span className="text-xs text-on-surface-var">
                          {new Date(anomaly.timestamp).toLocaleString('es-CO')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-on-bg break-words">{anomaly.title}</p>
                      <p className="text-sm text-on-surface-var break-words">{anomaly.message}</p>
                      {anomaly.score && (
                        <p className="text-xs text-on-surface-var">
                          Score: {formatNumber(anomaly.score)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleResolve(anomaly._id)}
                      className="px-3 py-1 bg-surface-container text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-high transition-colors"
                    >
                      Resolver
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

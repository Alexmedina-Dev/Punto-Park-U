import { useState, useEffect, useCallback } from 'react'
import { Card, Button } from '@/components/ui'
import { useAnalyticsStore } from '@/stores/analyticsStore'

interface ProphetAIAssistantProps {
  className?: string
}

export function ProphetAIAssistant({ className = '' }: ProphetAIAssistantProps) {
  const {
    aiInsights,
    loading,
    fetchAIInsights,
  } = useAnalyticsStore()

  const [isExpanded, setIsExpanded] = useState(false)

  const loadInsights = useCallback(() => {
    fetchAIInsights()
  }, [fetchAIInsights])

  useEffect(() => {
    loadInsights()
  }, [loadInsights])

  const insights = aiInsights?.insights || []
  const recommendations = aiInsights?.recommendations || []
  const stats = aiInsights?.stats || {}

  return (
    <Card variant="glass" className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">
              psychology
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-bg font-headline">
              Prophet AI Assistant
            </h3>
            <p className="text-xs text-on-surface-var">
              Insights y recomendaciones inteligentes
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadInsights}
          disabled={loading}
          className="shrink-0"
        >
          <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>
            {loading ? 'refresh' : 'sync'}
          </span>
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-3xl text-primary animate-pulse">
              model_training
            </span>
            <p className="text-sm text-on-surface-var">Prophet está analizando los datos...</p>
          </div>
        </div>
      )}

      {!loading && insights.length === 0 && (
        <div className="text-center py-6 text-on-surface-var text-sm">
          <span className="material-symbols-outlined text-3xl mb-2 block">query_stats</span>
          <p>No hay insights disponibles aún.</p>
        </div>
      )}

      {!loading && insights.length > 0 && (
        <div className="space-y-4">
          {/* Stats Grid */}
          {stats.total_reservations !== undefined && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-primary">{stats.total_reservations}</p>
                <p className="text-xs text-on-surface-var">Total Reservas</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-primary">{stats.today_reservations}</p>
                <p className="text-xs text-on-surface-var">Hoy</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-primary">
                  ${stats.total_revenue?.toLocaleString('es-CO') || 0}
                </p>
                <p className="text-xs text-on-surface-var">Ingresos</p>
              </div>
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-primary">{stats.week_reservations}</p>
                <p className="text-xs text-on-surface-var">Esta Semana</p>
              </div>
            </div>
          )}

          {/* Insights */}
          <div>
            <h4 className="text-sm font-bold text-on-bg mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">lightbulb</span>
              Insights
            </h4>
            <div className="space-y-2">
              {insights.slice(0, isExpanded ? undefined : 3).map((insight, idx) => (
                <div
                  key={idx}
                  className="bg-surface-container rounded-lg p-3 text-sm text-on-surface-var"
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h4 className="text-sm font-bold text-on-bg mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">recommend</span>
              Recomendaciones
            </h4>
            <div className="space-y-2">
              {recommendations.slice(0, isExpanded ? undefined : 2).map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm text-on-surface-var"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>

          {/* Expand/Collapse */}
          {(insights.length > 3 || recommendations.length > 2) && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary font-bold hover:underline w-full text-center"
            >
              {isExpanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}

          {/* Generated at */}
          {aiInsights?.generated_at && (
            <p className="text-xs text-on-surface-var text-center">
              Actualizado: {new Date(aiInsights.generated_at).toLocaleString('es-CO')}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

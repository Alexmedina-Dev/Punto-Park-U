import { useState, useEffect } from 'react'
import { Card, Badge, Button } from '@/components/ui'
import { usePricingStore } from '@/stores/pricingStore'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

function safeCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '$0'
  return formatCurrency(value)
}

function safeMultiplier(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return '1.0'
  return String(value)
}

export function PricingPanel() {
  const {
    stats,
    forecast,
    settings,
    loading,
    fetchStats,
    fetchForecast,
    updateSettings,
  } = usePricingStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editRules, setEditRules] = useState({
    lowThreshold: 30,
    highThreshold: 60,
    peakThreshold: 80,
  })

  useEffect(() => {
    fetchStats()
    fetchForecast()
  }, [fetchStats, fetchForecast])

  useEffect(() => {
    if (settings?.rules) {
      setEditRules(settings.rules)
    }
  }, [settings])

  const handleSaveSettings = async () => {
    await updateSettings({
      enabled: true,
      rules: editRules,
    })
    setIsEditing(false)
    fetchStats()
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'peak': return 'bg-error text-on-error'
      case 'high': return 'bg-warning text-on-warning'
      case 'low': return 'bg-success text-on-success'
      default: return 'bg-info text-on-info'
    }
  }

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'peak': return 'Demanda máxima'
      case 'high': return 'Alta demanda'
      case 'low': return 'Baja demanda'
      default: return 'Demanda normal'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-on-bg font-headline break-words">
            Precios Dinámicos — Flux AI v2.0
          </h2>
          <p className="text-sm text-on-surface-var mt-1 break-words">
            Ajuste automático de tarifas según la demanda en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={stats?.enabled ? 'success' : 'info'}>
            {stats?.enabled ? 'Activo' : 'Inactivo'}
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <span className="material-symbols-outlined text-base">
              {isEditing ? 'close' : 'settings'}
            </span>
            {isEditing ? 'Cancelar' : 'Configurar'}
          </Button>
        </div>
      </div>

      {/* How it works banner */}
      <Card variant="glass" padding="md">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-2xl text-primary mt-0.5">auto_awesome</span>
          <div className="space-y-1">
            <p className="text-sm font-bold text-on-bg">Cómo funcionan los precios dinámicos</p>
            <p className="text-xs text-on-surface-var">
              El sistema ajusta automáticamente las tarifas según la ocupación del parqueadero.
              Cuando hay poca demanda, los precios bajan para atraer usuarios.
              En horas pico, los precios suben para optimizar ingresos.
              Los valores se actualizan cada 15 minutos basándose en datos en tiempo real.
            </p>
          </div>
        </div>
      </Card>

      {/* NaN explanation */}
      {!stats?.currentPricing && (
        <Card variant="glass" padding="md">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl text-warning mt-0.5">info</span>
            <div className="space-y-1">
              <p className="text-sm font-bold text-on-bg">Sin datos de precios disponibles</p>
              <p className="text-xs text-on-surface-var">
                Los valores aparecen en $0 porque aún no hay suficientes datos de transacciones
                para calcular las tarifas dinámicas. El sistema comenzará a generar datos
                una vez que se registren entradas y salidas de vehículos.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Current Pricing Overview */}
      {stats?.currentPricing && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="glass" padding="md">
            <div className="space-y-2">
              <p className="text-sm text-on-surface-var">Tarifa por Hora</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-bg">
                  {safeCurrency(stats.currentPricing.hour)}
                </span>
                {stats.currentMultiplier !== 1 && (
                  <span className="text-sm text-on-surface-var">
                    ({safeMultiplier(stats.currentMultiplier)}x)
                  </span>
                )}
              </div>
              {stats.currentMultiplier > 1 && (
                <p className="text-xs text-on-surface-var">
                  Precio ajustado por alta demanda
                </p>
              )}
            </div>
          </Card>
          <Card variant="glass" padding="md">
            <div className="space-y-2">
              <p className="text-sm text-on-surface-var">Tarifa por Día</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-bg">
                  {safeCurrency(stats.currentPricing.day)}
                </span>
              </div>
            </div>
          </Card>
          <Card variant="glass" padding="md">
            <div className="space-y-2">
              <p className="text-sm text-on-surface-var">Tarifa por Mes</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-bg">
                  {safeCurrency(stats.currentPricing.month)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" title="Ingresos">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-outline">
              <span className="text-sm text-on-surface-var">Hoy</span>
              <span className="font-bold text-on-bg">{safeCurrency(stats?.revenueToday)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-outline">
              <span className="text-sm text-on-surface-var">Ayer</span>
              <span className="font-bold text-on-bg">{safeCurrency(stats?.revenueYesterday)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-on-surface-var">Cambio vs Ayer</span>
              <span className={`font-bold ${(stats?.change || 0) >= 0 ? 'text-success' : 'text-error'}`}>
                {(stats?.change || 0) >= 0 ? '+' : ''}{formatPercentage(stats?.change || 0)}%
              </span>
            </div>
          </div>
        </Card>

        <Card variant="glass" title="Nivel de Demanda Actual">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${getTierColor(stats?.currentTier || 'normal')}`} />
              <span className="text-lg font-bold text-on-bg">
                {getTierLabel(stats?.currentTier || 'normal')}
              </span>
            </div>
            <div className="text-sm text-on-surface-var">
              Multiplicador aplicado: {safeMultiplier(stats?.currentMultiplier)}x
            </div>
            <div className="w-full bg-surface-container rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stats?.currentTier === 'peak' ? 'bg-error' :
                  stats?.currentTier === 'high' ? 'bg-warning' :
                  stats?.currentTier === 'low' ? 'bg-success' :
                  'bg-info'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(0, ((stats?.currentMultiplier || 1) - 0.9) / 0.4 * 100))}%`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-on-surface-var">
              <span>0.9x (baja)</span>
              <span>1.3x (pico)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Pricing Forecast */}
      <Card variant="glass" title="Pronóstico de Precios (24h)">
        {forecast.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {forecast.map((item, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg text-center ${getTierColor(item.tier)}`}
              >
                <p className="text-xs font-bold">{item.hour}</p>
                <p className="text-sm font-bold">{safeCurrency(item.price)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-on-surface-var text-sm">
            <span className="material-symbols-outlined text-3xl mb-2 block">schedule</span>
            <p>No hay pronóstico disponible</p>
            <p className="text-xs mt-1">El pronóstico se genera cada hora con datos actualizados</p>
          </div>
        )}
      </Card>

      {/* Tier Legend */}
      <Card variant="glass" padding="md">
        <p className="text-sm font-bold text-on-bg mb-3">Referencia de niveles de demanda</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-on-surface-var">Baja demanda (descuento)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-info" />
            <span className="text-xs text-on-surface-var">Demanda normal (tarifa base)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-xs text-on-surface-var">Alta demanda (sobrecargo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error" />
            <span className="text-xs text-on-surface-var">Pico (sobrecargo máximo)</span>
          </div>
        </div>
      </Card>

      {/* Settings Editor */}
      {isEditing && (
        <Card variant="glass" title="Configuración de Precios Dinámicos">
          <div className="space-y-4">
            <p className="text-sm text-on-surface-var">
              Configure los umbrales de ocupación que activan cada nivel de precio.
              Los porcentajes representan la ocupación del parqueadero.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-var mb-1">
                  Umbral Baja Demanda (%)
                </label>
                <input
                  type="number"
                  value={editRules.lowThreshold}
                  onChange={(e) => setEditRules({ ...editRules, lowThreshold: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-surface-container border border-outline rounded-lg text-sm"
                />
                <p className="text-xs text-on-surface-var mt-1">Por debajo: tarifa con descuento</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-var mb-1">
                  Umbral Alta Demanda (%)
                </label>
                <input
                  type="number"
                  value={editRules.highThreshold}
                  onChange={(e) => setEditRules({ ...editRules, highThreshold: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-surface-container border border-outline rounded-lg text-sm"
                />
                <p className="text-xs text-on-surface-var mt-1">Por encima: tarifa con sobrecargo</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-var mb-1">
                  Umbral Pico Demanda (%)
                </label>
                <input
                  type="number"
                  value={editRules.peakThreshold}
                  onChange={(e) => setEditRules({ ...editRules, peakThreshold: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-surface-container border border-outline rounded-lg text-sm"
                />
                <p className="text-xs text-on-surface-var mt-1">Por encima: tarifa máxima</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveSettings} loading={loading}>
                Guardar Configuración
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

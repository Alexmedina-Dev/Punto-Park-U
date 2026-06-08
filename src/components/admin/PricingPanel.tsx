import { useState, useEffect } from 'react'
import { Card, Badge, Button } from '@/components/ui'
import { usePricingStore } from '@/stores/pricingStore'
import { formatCurrency, formatPercentage } from '@/utils/formatters'

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-on-bg font-headline">
          Precios Dinámicos — Flux AI v2.0
        </h2>
        <div className="flex items-center gap-3">
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

      {/* Current Pricing Overview */}
      {stats?.currentPricing && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="glass" padding="md">
            <div className="space-y-2">
              <p className="text-sm text-on-surface-var">Tarifa por Hora</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-bg">
                  {formatCurrency(stats.currentPricing.hour)}
                </span>
                {stats.currentMultiplier !== 1 && (
                  <span className="text-sm text-on-surface-var">
                    ({stats.currentMultiplier}x)
                  </span>
                )}
              </div>
            </div>
          </Card>
          <Card variant="glass" padding="md">
            <div className="space-y-2">
              <p className="text-sm text-on-surface-var">Tarifa por Día</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-bg">
                  {formatCurrency(stats.currentPricing.day)}
                </span>
              </div>
            </div>
          </Card>
          <Card variant="glass" padding="md">
            <div className="space-y-2">
              <p className="text-sm text-on-surface-var">Tarifa por Mes</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-on-bg">
                  {formatCurrency(stats.currentPricing.month)}
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
              <span className="font-bold text-on-bg">{formatCurrency(stats?.revenueToday || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-outline">
              <span className="text-sm text-on-surface-var">Ayer</span>
              <span className="font-bold text-on-bg">{formatCurrency(stats?.revenueYesterday || 0)}</span>
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
                {stats?.tiers?.[stats?.currentTier]?.label || 'Demanda normal'}
              </span>
            </div>
            <div className="text-sm text-on-surface-var">
              Multiplicador aplicado: {stats?.currentMultiplier || 1}x
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
                  width: `${((stats?.currentMultiplier || 1) - 0.9) / 0.4 * 100}%`
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Pricing Forecast */}
      <Card variant="glass" title="Pronóstico de Precios (24h)">
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {forecast.map((item, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg text-center ${getTierColor(item.tier)}`}
            >
              <p className="text-xs font-bold">{item.hour}</p>
              <p className="text-sm font-bold">{formatCurrency(item.price)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Settings Editor */}
      {isEditing && (
        <Card variant="glass" title="Configuración de Precios Dinámicos">
          <div className="space-y-4">
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

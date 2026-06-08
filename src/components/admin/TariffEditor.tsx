import { useState, useEffect, useCallback } from 'react'
import { Card, Button } from '@/components/ui'
import { getTariffsService } from '@/services/parking.service'
import { updateTariffsService } from '@/services/admin.service'
import { formatCurrency } from '@/utils/formatters'
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler'
import type { PricingConfig } from '@/types'

type VehicleKey = 'car' | 'moto' | 'bike'
type PeriodKey = 'hour' | 'day' | 'month'

const VEHICLE_LABELS: Record<VehicleKey, string> = {
  car: 'Carros',
  moto: 'Motos',
  bike: 'Bicicletas',
}

const VEHICLE_ICONS: Record<VehicleKey, string> = {
  car: 'directions_car',
  moto: 'two_wheeler',
  bike: 'pedal_bike',
}

const VEHICLE_SUBTITLE: Record<VehicleKey, string> = {
  car: 'Incluye camionetas',
  moto: 'Motocicletas',
  bike: 'Ciclas y patinetas',
}

const PERIOD_LABELS: Record<PeriodKey, { label: string; icon: string; desc: string }> = {
  hour: { label: 'Por Hora', icon: 'schedule', desc: 'Tarifa mínima de ingreso' },
  day: { label: 'Por Día', icon: 'calendar_today', desc: 'Estadía de hasta 24 horas' },
  month: { label: 'Mensualidad', icon: 'date_range', desc: 'Cupo fijo mensual' },
}

const DEFAULT_TARIFFS: PricingConfig = {
  car: { hour: 3000, day: 15000, month: 250000 },
  moto: { hour: 1500, day: 8000, month: 120000 },
  bike: { hour: 1000, day: 5000, month: 80000 },
}

export function TariffEditor() {
  const [tariffs, setTariffs] = useState<PricingConfig>(DEFAULT_TARIFFS)
  const [activeVehicle, setActiveVehicle] = useState<VehicleKey>('car')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    getTariffsService()
      .then((data) => {
        if (mounted) setTariffs(data)
      })
      .catch(() => {
        // Use defaults on error
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const handlePriceChange = useCallback(
    (vehicle: VehicleKey, period: PeriodKey, value: string) => {
      const num = parseInt(value, 10)
      if (isNaN(num) || num < 0) return
      setTariffs((prev) => ({
        ...prev,
        [vehicle]: { ...prev[vehicle], [period]: num },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await updateTariffsService(tariffs as unknown as Record<string, unknown>)
      showSuccessToast('Tarifas actualizadas correctamente')
    } catch (err) {
      showErrorToast(err)
    } finally {
      setIsSaving(false)
    }
  }, [tariffs])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Save */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-primary font-headline">Tarifas</h3>
          <p className="text-sm text-on-surface-var mt-1">
            Configura las tarifas por tipo de vehículo y período
          </p>
        </div>
        <Button onClick={handleSave} loading={isSaving}>
          <span className="material-symbols-outlined text-base">save</span>
          Guardar Cambios
        </Button>
      </div>

      {/* Vehicle Selector Tabs */}
      <div className="flex gap-2">
        {(Object.keys(VEHICLE_LABELS) as VehicleKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setActiveVehicle(key)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg border transition-all
              ${
                activeVehicle === key
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-surface-container border-outline/20 text-on-surface-var hover:border-outline/40'
              }
            `}
          >
            <span className="material-symbols-outlined text-2xl">{VEHICLE_ICONS[key]}</span>
            <div className="text-left">
              <div className="text-sm font-bold">{VEHICLE_LABELS[key]}</div>
              <div className="text-xs opacity-70">{VEHICLE_SUBTITLE[key]}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Price Cards for Active Vehicle */}
      <Card variant="glass" padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((period) => {
            const periodInfo = PERIOD_LABELS[period]
            const currentValue = tariffs[activeVehicle][period]
            return (
              <div
                key={period}
                className="bg-surface-container border border-outline/20 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5">
                    {periodInfo.icon}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-on-bg">{periodInfo.label}</h4>
                    <p className="text-xs text-on-surface-var">{periodInfo.desc}</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={currentValue}
                    onChange={(e) => handlePriceChange(activeVehicle, period, e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-bg border border-outline/20 rounded-lg text-on-bg font-bold
                      focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                      transition-colors"
                  />
                </div>
                <div className="text-sm text-primary font-bold">
                  {formatCurrency(currentValue)}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Live Preview Summary */}
      <Card variant="glass" title="Resumen de Tarifas" padding="md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline/20">
                <th className="text-left py-2 px-3 text-on-surface-var font-bold">Vehículo</th>
                <th className="text-right py-2 px-3 text-on-surface-var font-bold">Hora</th>
                <th className="text-right py-2 px-3 text-on-surface-var font-bold">Día</th>
                <th className="text-right py-2 px-3 text-on-surface-var font-bold">Mes</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(VEHICLE_LABELS) as VehicleKey[]).map((key) => (
                <tr key={key} className="border-b border-outline/10 last:border-0">
                  <td className="py-2 px-3 font-bold text-on-bg">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">{VEHICLE_ICONS[key]}</span>
                      {VEHICLE_LABELS[key]}
                    </span>
                  </td>
                  <td className="text-right py-2 px-3 text-primary font-bold">
                    {formatCurrency(tariffs[key].hour)}
                  </td>
                  <td className="text-right py-2 px-3 text-primary font-bold">
                    {formatCurrency(tariffs[key].day)}
                  </td>
                  <td className="text-right py-2 px-3 text-primary font-bold">
                    {formatCurrency(tariffs[key].month)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

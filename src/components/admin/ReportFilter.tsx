import React, { useState } from 'react'
import { Card, Button } from '@/components/ui'
import type { ReportFilters } from '@/types'

interface ReportFilterProps {
  onFiltersChange: (filters: ReportFilters) => void
  className?: string
}

const PERIODS = [
  { key: 'today' as const, label: 'Hoy' },
  { key: 'week' as const, label: 'Semana' },
  { key: 'month' as const, label: 'Mes' },
  { key: 'custom' as const, label: 'Personalizado' },
]

const VEHICLE_TYPES = [
  { key: 'all' as const, label: 'Todos' },
  { key: 'car' as const, label: 'Automóvil' },
  { key: 'moto' as const, label: 'Motocicleta' },
  { key: 'bike' as const, label: 'Bicicleta' },
]

const PAYMENT_METHODS = [
  { key: 'all' as const, label: 'Todos' },
  { key: 'cash' as const, label: 'Efectivo' },
  { key: 'pos' as const, label: 'Datáfono' },
  { key: 'epayco' as const, label: 'ePayco' },
  { key: 'nequi' as const, label: 'Nequi' },
  { key: 'daviplata' as const, label: 'Daviplata' },
  { key: 'transfer' as const, label: 'Transferencia' },
]

/**
 * Report filter controls — period, vehicle type, and payment method.
 * Follows the same filter button pattern as VehiclesTable.
 */
export function ReportFilter({ onFiltersChange, className = '' }: ReportFilterProps) {
  const [period, setPeriod] = useState<ReportFilters['period']>('today')
  const [vehicleType, setVehicleType] = useState<ReportFilters['type']>('all')
  const [payment, setPayment] = useState<ReportFilters['payment']>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const applyFilters = () => {
    onFiltersChange({
      period,
      type: vehicleType,
      payment,
      ...(period === 'custom' ? { dateFrom, dateTo } : {}),
    })
  }

  return (
    <Card variant="glass" padding="md" className={className}>
      {/* Period */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-on-surface-var uppercase tracking-wider mb-2">
          Período
        </label>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                period === p.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-var hover:text-on-bg'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-lg bg-surface-container/50">
          <label className="text-xs text-on-surface-var">Desde:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-1 text-xs rounded border border-outline bg-surface-container text-on-bg focus:outline-none focus:border-primary"
          />
          <label className="text-xs text-on-surface-var">Hasta:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-1 text-xs rounded border border-outline bg-surface-container text-on-bg focus:outline-none focus:border-primary"
          />
          <Button variant="primary" size="sm" onClick={applyFilters}>
            Aplicar
          </Button>
        </div>
      )}

      {/* Vehicle Type */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-on-surface-var uppercase tracking-wider mb-2">
          Tipo de Vehículo
        </label>
        <div className="flex flex-wrap gap-1">
          {VEHICLE_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setVehicleType(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                vehicleType === t.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-var hover:text-on-bg'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-on-surface-var uppercase tracking-wider mb-2">
          Método de Pago
        </label>
        <div className="flex flex-wrap gap-1">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setPayment(m.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                payment === m.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-var hover:text-on-bg'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apply button (always visible) */}
      <Button variant="primary" size="sm" onClick={applyFilters} className="w-full">
        <span className="material-symbols-outlined text-base">refresh</span>
        Actualizar Reporte
      </Button>
    </Card>
  )
}

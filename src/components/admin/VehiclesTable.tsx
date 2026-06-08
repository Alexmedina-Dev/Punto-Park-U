import React, { useState, useMemo } from 'react'
import { Card, Badge } from '@/components/ui'
import type { ParkedVehicle } from '@/types'
import { getVehicleLabel, formatDateTime } from '@/utils/formatters'

interface VehiclesTableProps {
  vehicles: ParkedVehicle[]
  className?: string
}

const VEHICLE_FILTERS = ['all', 'car', 'moto', 'suv', 'bike'] as const
const PAYMENT_FILTERS = ['all', 'paid', 'pending'] as const

/**
 * Admin table of currently parked vehicles.
 * Filterable by vehicle type and payment status.
 */
export function VehiclesTable({ vehicles, className = '' }: VehiclesTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (typeFilter !== 'all' && v.type !== typeFilter) return false
      if (paymentFilter !== 'all' && v.paymentStatus !== paymentFilter) return false
      return true
    })
  }, [vehicles, typeFilter, paymentFilter])

  return (
    <Card variant="glass" title="Vehículos en Parqueadero" className={className}>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Type filters */}
        <div className="flex gap-1 flex-wrap">
          {VEHICLE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                typeFilter === f
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-var hover:text-on-bg'
              }`}
            >
              {f === 'all' ? 'Todos' : getVehicleLabel(f)}
            </button>
          ))}
        </div>
        {/* Payment filters */}
        <div className="flex gap-1 flex-wrap">
          {PAYMENT_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setPaymentFilter(f)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                paymentFilter === f
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-var hover:text-on-bg'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'paid' ? 'Pagados' : 'Pendientes'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-6 text-on-surface-var text-sm">
          <span className="material-symbols-outlined text-3xl mb-2 block">directions_car</span>
          <p>No hay vehículos con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline/10">
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold">Placa</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold hidden sm:table-cell">Tipo</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold hidden lg:table-cell">Vehículo</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold">Zona</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold hidden md:table-cell">Ingreso</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold">Duración</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold">Pago</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b border-outline/5 hover:bg-surface-container/40 transition-colors">
                  <td className="py-2.5 px-2 font-mono font-bold text-primary">{v.plate}</td>
                  <td className="py-2.5 px-2 hidden sm:table-cell">{getVehicleLabel(v.type)}</td>
                  <td className="py-2.5 px-2 text-on-surface-var hidden lg:table-cell">
                    {v.brand} {v.model} ({v.color})
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-primary/15 text-primary font-bold text-xs">
                      {v.zone}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-xs text-on-surface-var hidden md:table-cell">
                    {formatDateTime(v.entryTime)}
                  </td>
                  <td className="py-2.5 px-2">{v.duration}</td>
                  <td className="py-2.5 px-2">
                    <Badge variant={v.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {v.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="mt-3 text-xs text-on-surface-var text-right">
          {filtered.length} de {vehicles.length} vehículos
        </div>
      )}
    </Card>
  )
}

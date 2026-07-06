import { useState } from 'react'
import type { ParkingSpot as ParkingSpotType } from '@/types'

export type SpotStatus = 'libre' | 'ocupado' | 'reservado'

const STATUS_CLASSES: Record<SpotStatus, string> = {
  libre: 'bg-green-500/20 border-green-500 text-green-400 hover:bg-green-500/30',
  ocupado: 'bg-orange-500/20 border-orange-500 text-orange-400 hover:bg-orange-500/30',
  reservado: 'bg-blue-500/20 border-blue-500 text-blue-400 hover:bg-blue-500/30',
}

const STATUS_LABELS: Record<SpotStatus, string> = {
  libre: 'Libre',
  ocupado: 'Ocupado',
  reservado: 'Reservado',
}

const STATUS_DOT: Record<SpotStatus, string> = {
  libre: 'bg-green-400',
  ocupado: 'bg-orange-400',
  reservado: 'bg-blue-400',
}

export interface ParkingSpotProps {
  spot: ParkingSpotType
  onClick?: (spot: ParkingSpotType) => void
}

export function ParkingSpot({ spot, onClick }: ParkingSpotProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const status = spot.status as SpotStatus
  const isClickable = !!onClick
  const hasVehicle = spot.vehicle && (spot.vehicle.plate || spot.vehicle.brand)
  const isOccupied = status === 'ocupado' || status === 'reservado'

  return (
    <div className="relative">
      <button
        onClick={() => onClick?.(spot)}
        disabled={!isClickable}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-full aspect-square rounded-lg border-2 flex items-center justify-center
          text-xs font-bold transition-all duration-200
          ${STATUS_CLASSES[status]}
          ${isClickable ? 'cursor-pointer' : 'cursor-default'}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        `}
        data-testid={`parking-spot-${spot.id}`}
      >
        <span className="leading-none">{spot.code || spot.id}</span>
      </button>

      {/* Rich Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none
          bg-surface-high border border-surface-border rounded-lg shadow-xl p-3 min-w-[200px]
          animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
            <span className="font-bold text-on-bg text-sm">{spot.code}</span>
            <span className="text-on-surface-var text-xs ml-auto">{STATUS_LABELS[status]}</span>
          </div>

          {/* Vehicle Info */}
          {isOccupied && hasVehicle && (
            <div className="border-t border-surface-border pt-2 space-y-1">
              {spot.vehicle?.plate && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-on-surface-var">pin</span>
                  <span className="text-on-bg text-sm font-mono font-bold">{spot.vehicle.plate}</span>
                </div>
              )}
              {(spot.vehicle?.brand || spot.vehicle?.model) && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-on-surface-var">directions_car</span>
                  <span className="text-on-surface-var text-xs">
                    {[spot.vehicle?.brand, spot.vehicle?.model].filter(Boolean).join(' ')}
                  </span>
                </div>
              )}
              {spot.vehicle?.color && (
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs text-on-surface-var">palette</span>
                  <span className="text-on-surface-var text-xs">{spot.vehicle.color}</span>
                </div>
              )}
            </div>
          )}

          {/* No vehicle info for demo overlay */}
          {isOccupied && !hasVehicle && (
            <div className="border-t border-surface-border pt-2">
              <span className="text-on-surface-var text-xs italic">Vehículo estacionado</span>
            </div>
          )}

          {/* Free spot */}
          {status === 'libre' && (
            <div className="border-t border-surface-border pt-1">
              <span className="text-on-surface-var text-xs">Disponible para reserva</span>
            </div>
          )}

          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
            border-l-[6px] border-l-transparent
            border-r-[6px] border-r-transparent
            border-t-[6px] border-t-surface-high" />
        </div>
      )}
    </div>
  )
}

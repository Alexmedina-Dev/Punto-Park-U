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
  const status = spot.status as SpotStatus
  const isClickable = !!onClick
  const hasVehicle = spot.vehicle && (spot.vehicle.plate || spot.vehicle.brand)
  const isOccupied = status === 'ocupado' || status === 'reservado'

  return (
    <div className="relative group/spot">
      <button
        onClick={() => onClick?.(spot)}
        disabled={!isClickable}
        className={`
          w-full aspect-square rounded-lg border-2 flex items-center justify-center
          text-xs font-bold transition-all duration-200
          ${STATUS_CLASSES[status]}
          ${isClickable ? 'cursor-pointer' : 'cursor-default'}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
        `}
        data-testid={`parking-spot-${spot.id}`}
        title={`${spot.code || spot.id} — ${STATUS_LABELS[status]}`}
      >
        <span className="leading-none">{spot.code || spot.id}</span>
      </button>

      {/* Rich Tooltip — CSS hover via group */}
      <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none
        opacity-0 group-hover/spot:opacity-100 transition-opacity duration-150
        rounded-lg shadow-xl p-3 min-w-[200px]"
        style={{ backgroundColor: '#272a32', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
          <span className="font-bold text-sm" style={{ color: '#e1e2ec' }}>{spot.code}</span>
          <span className="text-xs ml-auto" style={{ color: '#c1c6d5' }}>{STATUS_LABELS[status]}</span>
        </div>

        {/* Vehicle Info */}
        {isOccupied && hasVehicle && (
          <div className="border-t pt-2 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            {spot.vehicle?.plate && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs" style={{ color: '#c1c6d5' }}>pin</span>
                <span className="text-sm font-mono font-bold" style={{ color: '#e1e2ec' }}>{spot.vehicle.plate}</span>
              </div>
            )}
            {(spot.vehicle?.brand || spot.vehicle?.model) && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs" style={{ color: '#c1c6d5' }}>directions_car</span>
                <span className="text-xs" style={{ color: '#c1c6d5' }}>
                  {[spot.vehicle?.brand, spot.vehicle?.model].filter(Boolean).join(' ')}
                </span>
              </div>
            )}
            {spot.vehicle?.color && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xs" style={{ color: '#c1c6d5' }}>palette</span>
                <span className="text-xs" style={{ color: '#c1c6d5' }}>{spot.vehicle.color}</span>
              </div>
            )}
          </div>
        )}

        {/* No vehicle info for demo overlay */}
        {isOccupied && !hasVehicle && (
          <div className="border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="text-xs italic" style={{ color: '#c1c6d5' }}>Vehículo estacionado</span>
          </div>
        )}

        {/* Free spot */}
        {status === 'libre' && (
          <div className="border-t pt-1" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <span className="text-xs" style={{ color: '#c1c6d5' }}>Disponible para reserva</span>
          </div>
        )}

        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
          border-l-[6px] border-l-transparent
          border-r-[6px] border-r-transparent
          border-t-[6px]"
          style={{ borderTopColor: '#272a32' }} />
      </div>
    </div>
  )
}

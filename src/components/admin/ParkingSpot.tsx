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

export interface ParkingSpotProps {
  spot: ParkingSpotType
  onClick?: (spot: ParkingSpotType) => void
}

export function ParkingSpot({ spot, onClick }: ParkingSpotProps) {
  const status = spot.status as SpotStatus
  const isClickable = !!onClick

  return (
    <button
      onClick={() => onClick?.(spot)}
      disabled={!isClickable}
      title={`${spot.id} — ${STATUS_LABELS[status]}`}
      className={`
        w-full aspect-square rounded-lg border-2 flex items-center justify-center
        text-xs font-bold transition-all duration-200
        ${STATUS_CLASSES[status]}
        ${isClickable ? 'cursor-pointer' : 'cursor-default'}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
      `}
      data-testid={`parking-spot-${spot.id}`}
    >
      <span className="leading-none">{spot.id}</span>
    </button>
  )
}

import { useMemo } from 'react'
import { Card, Badge } from '@/components/ui'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { ParkingSpot, VehicleType } from '@/types'

interface SpotSelectorProps {
  spots: ParkingSpot[]
  selectedSpotId: string | null
  onSelect: (spotId: string) => void
  vehicleType: VehicleType
  isLoading: boolean
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: 'success' | 'error' | 'warning'; ring: string }
> = {
  libre: { label: 'Disponible', badge: 'success', ring: 'ring-green-400/40' },
  ocupado: { label: 'Ocupado', badge: 'error', ring: 'ring-red-400/40' },
  reservado: { label: 'Reservado', badge: 'warning', ring: 'ring-yellow-400/40' },
}

const TYPE_ICONS: Record<string, string> = {
  car: 'directions_car',
  moto: 'two_wheeler',
  bike: 'pedal_bike',
}

export function SpotSelector({
  spots,
  selectedSpotId,
  onSelect,
  isLoading,
}: SpotSelectorProps) {
  const sortedSpots = useMemo(
    () => [...spots].sort((a, b) => a.code.localeCompare(b.code)),
    [spots]
  )

  if (isLoading) {
    return <LoadingSpinner size="md" text="Cargando espacios..." />
  }

  if (sortedSpots.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="material-symbols-outlined text-4xl text-on-surface-var mb-2 block">
          parking
        </span>
        <p className="text-on-surface-var text-sm">
          No hay espacios disponibles para este horario
        </p>
      </div>
    )
  }

  return (
    <Card variant="default" padding="sm">
      <h4 className="text-sm font-medium text-on-surface-var mb-3">
        Selecciona un espacio
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {sortedSpots.map((spot) => {
          const config = STATUS_CONFIG[spot.status] || STATUS_CONFIG.libre
          const isSelected = selectedSpotId === spot.id
          const isOccupied = spot.status === 'ocupado' || spot.status === 'reservado'

          return (
            <button
              key={spot.id}
              type="button"
              disabled={isOccupied}
              onClick={() => onSelect(spot.id)}
              className={`
                relative flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-all
                ${
                  isSelected
                    ? 'bg-primary/15 border-primary ring-2 ' + config.ring
                    : isOccupied
                      ? 'bg-surface-container/50 border-outline/10 opacity-50 cursor-not-allowed'
                      : 'bg-surface-container border-outline/20 hover:border-primary/50 cursor-pointer'
                }
              `}
            >
              <span className="material-symbols-outlined text-lg text-on-surface-var">
                {TYPE_ICONS[spot.type] || 'local_parking'}
              </span>
              <span className="font-bold text-on-bg font-label">{spot.code}</span>
              <Badge variant={config.badge} className="text-[10px]">
                {config.label}
              </Badge>
              <div className="flex items-center gap-1 text-[10px] text-on-surface-var">
                <span className="material-symbols-outlined text-xs">
                  layers
                </span>
                <span>Z{spot.zone}</span>
                {spot.floor != null && <span>· P{spot.floor}</span>}
              </div>
              {spot.accessible && (
                <span className="material-symbols-outlined text-xs text-primary">
                  accessibility_new
                </span>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}

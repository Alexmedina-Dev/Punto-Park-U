import { useState, useEffect } from 'react'
import { Card } from '@/components/ui'
import { ParkingSpot } from './ParkingSpot'
import { getParkingSpotsService } from '@/services/parking.service'
import wsService from '@/services/websocket.service'
import type { ParkingSpot as ParkingSpotType } from '@/types'
import type { WsSpotUpdate } from '@/services/websocket.service'

interface ZoneConfig {
  label: string
  vehicleType: string
  spotCount: number
  cols: number
}

const ZONES: Record<string, ZoneConfig> = {
  A: { label: 'Zona A — Carros', vehicleType: 'car', spotCount: 20, cols: 5 },
  B: { label: 'Zona B — Motos', vehicleType: 'moto', spotCount: 20, cols: 5 },
  C: { label: 'Zona C — Bicicletas', vehicleType: 'bike', spotCount: 10, cols: 5 },
}

export function ParkingMap() {
  const [spots, setSpots] = useState<ParkingSpotType[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ── Initial data fetch ──────────────────────────────────────
  useEffect(() => {
    let mounted = true
    getParkingSpotsService()
      .then((data) => {
        if (mounted) setSpots(data)
      })
      .catch(() => {
        // Fallback handled by service
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => { mounted = false }
  }, [])

  // ── Real-time spot updates via WebSocket ────────────────────
  useEffect(() => {
    // Connect if not already connected
    wsService.connect()

    // Subscribe to spot updates
    const unsubscribe = wsService.on<WsSpotUpdate>('spot:update', (update) => {
      setSpots((prev) => {
        const updated = [...prev]
        const index = updated.findIndex((s) => s.id === update.id)

        if (index >= 0) {
          // Update existing spot
          updated[index] = {
            ...updated[index],
            status: update.status,
            plate: update.plate,
          }
        } else {
          // Add new spot
          updated.push({
            id: update.id,
            zone: update.zone as 'A' | 'B' | 'C',
            status: update.status,
            vehicleType: update.vehicleType as 'car' | 'moto' | 'bike' | undefined,
            plate: update.plate,
          })
        }

        return updated
      })
    })

    // Register fallback polling
    wsService.registerFallback(async () => {
      try {
        const data = await getParkingSpotsService()
        setSpots(data)
      } catch {
        // Silent fallback
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const getZoneSpots = (zone: string) => {
    // Try to show spots from API first, or generate placeholder ones
    const zoneSpots = spots.filter((s) => s.zone === zone)
    const config = ZONES[zone]
    if (zoneSpots.length >= config.spotCount) return zoneSpots

    // Fill missing spots with placeholders
    const filled: ParkingSpotType[] = [...zoneSpots]
    for (let i = filled.length + 1; i <= config.spotCount; i++) {
      filled.push({
        id: `${zone}${i}`,
        zone: zone as 'A' | 'B' | 'C',
        status: 'libre',
      })
    }
    return filled
  }

  const getStats = () => {
    const total = Object.keys(ZONES).reduce(
      (acc, zone) => acc + ZONES[zone].spotCount,
      0
    )
    const occupied = spots.filter((s) => s.status !== 'libre').length
    return { total, occupied }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-primary font-headline">Mapa del Parqueadero</h3>
        <p className="text-sm text-on-surface-var mt-1">
          Distribución actual de espacios —{' '}
          <strong className="text-primary">{stats.occupied}</strong> ocupados /{' '}
          <strong>{stats.total}</strong> totales
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500/40 border border-green-500" />
          Libre
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-orange-500/40 border border-orange-500" />
          Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-500/40 border border-blue-500" />
          Reservado
        </span>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* Zone Grids */
        <div className="space-y-6">
          {Object.entries(ZONES).map(([zoneKey, config]) => (
            <Card key={zoneKey} variant="glass" padding="md">
              <h4 className="text-base font-bold text-primary font-headline mb-4">
                {config.label}
              </h4>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                }}
              >
                {getZoneSpots(zoneKey).map((spot) => (
                  <ParkingSpot key={spot.id} spot={spot} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

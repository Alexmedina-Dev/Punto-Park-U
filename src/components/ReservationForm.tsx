import { useState, useEffect, useCallback } from 'react'
import { Input, Button } from '@/components/ui'
import { SpotSelector } from '@/components/SpotSelector'
import { getParkingSpotsService } from '@punto-park-u/shared-api'
import type { Vehicle, ParkingSpot } from '@/types'

interface ReservationFormData {
  vehicleId: string
  date: string | Date
  startTime: string
  endTime: string
  spotId: string
  notes: string
}

interface ReservationFormProps {
  vehicles: Vehicle[]
  onSubmit: (data: {
    vehicle: string
    entryTime: string
    date?: string
    startTime?: string
    endTime?: string
    spotId?: string
    notes?: string
  }) => Promise<boolean>
  onCancel?: () => void
  isLoading?: boolean
  error?: string | null
}

const INITIAL_FORM: ReservationFormData = {
  vehicleId: '',
  date: '',
  startTime: '',
  endTime: '',
  spotId: '',
  notes: '',
}

export function ReservationForm({
  vehicles,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}: ReservationFormProps) {
  const [form, setForm] = useState<ReservationFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationFormData, string>>>({})
  const [spots, setSpots] = useState<ParkingSpot[]>([])
  const [spotsLoading, setSpotsLoading] = useState(false)

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId)
  const hasDateTime = form.date && form.startTime && form.endTime
  const showSpotSelector = !!selectedVehicle && hasDateTime

  const fetchSpots = useCallback(async () => {
    if (!showSpotSelector) return
    setSpotsLoading(true)
    try {
      const result = await getParkingSpotsService({
        type: selectedVehicle!.type,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
      })
      setSpots(result)
    } catch {
      setSpots([])
    } finally {
      setSpotsLoading(false)
    }
  }, [showSpotSelector, selectedVehicle?.type, form.date, form.startTime, form.endTime])

  useEffect(() => {
    if (showSpotSelector) {
      fetchSpots()
    } else {
      setSpots([])
      setForm((prev) => ({ ...prev, spotId: '' }))
    }
  }, [showSpotSelector, fetchSpots])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ReservationFormData, string>> = {}

    if (!form.vehicleId) {
      newErrors.vehicleId = 'Selecciona un vehículo'
    }

    if (!form.date) {
      newErrors.date = 'Selecciona una fecha'
    } else {
      // Handle both string (YYYY-MM-DD) and Date objects
      let selected: Date
      if (typeof form.date === 'string') {
        const [year, month, day] = form.date.split('-').map(Number)
        selected = new Date(year, month - 1, day)
      } else {
        selected = new Date(form.date)
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      if (selected < tomorrow) {
        newErrors.date = 'Debes reservar con al menos 1 día de anticipación. Selecciona a partir de mañana.'
      }
    }

    if (!form.startTime) {
      newErrors.startTime = 'Selecciona la hora de entrada'
    }

    if (!form.endTime) {
      newErrors.endTime = 'Selecciona la hora de salida'
    } else if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      newErrors.endTime = 'La hora de salida debe ser posterior a la de entrada'
    }

    if (!form.spotId) {
      newErrors.spotId = 'Selecciona un espacio de parqueo'
    }

    if (form.notes && form.notes.length > 500) {
      newErrors.notes = 'Las notas no pueden exceder 500 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Normalize date to YYYY-MM-DD string (handles both Date object and string)
    const dateStr = typeof form.date === 'string' ? form.date : form.date.toISOString().slice(0, 10)

    // Build entryTime as ISO string from date + startTime
    const entryTime = new Date(`${dateStr}T${form.startTime}:00`).toISOString()

    const success = await onSubmit({
      vehicle: form.vehicleId,
      entryTime,
      date: dateStr,
      startTime: form.startTime,
      endTime: form.endTime,
      spotId: form.spotId || undefined,
      notes: form.notes || undefined,
    })

    if (success) {
      setForm(INITIAL_FORM)
    }
  }

  const handleChange = (field: keyof ReservationFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  // Get today's date in YYYY-MM-DD for min attribute
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDateStr = tomorrow.toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Vehicle Selection */}
      <div>
        <label className="block text-sm font-medium text-on-surface-var mb-1">
          Vehículo
        </label>
        {vehicles.length === 0 ? (
          <p className="text-sm text-red-400">
            No tienes vehículos registrados. Agrega uno primero.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {vehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleChange('vehicleId', v.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm border text-left transition-colors
                  ${
                    form.vehicleId === v.id
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container text-on-surface-var border-outline/20 hover:border-primary/50'
                  }
                `}
              >
                <span className="material-symbols-outlined text-base">
                  {v.type === 'moto' ? 'two_wheeler' : v.type === 'bike' ? 'pedal_bike' : 'directions_car'}
                </span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{v.plate}</p>
                  <p className="text-xs opacity-75 truncate">
                    {v.brand} {v.model}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        {errors.vehicleId && (
          <p className="mt-1 text-sm text-red-400">{errors.vehicleId}</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Fecha"
          type="date"
          icon="calendar_month"
          value={typeof form.date === 'string' ? form.date : form.date.toISOString().slice(0, 10)}
          onChange={(e) => handleChange('date', e.target.value)}
          min={minDateStr}
          error={errors.date}
        />
        <Input
          label="Hora Entrada"
          type="time"
          icon="login"
          value={form.startTime}
          onChange={(e) => handleChange('startTime', e.target.value)}
          error={errors.startTime}
        />
        <Input
          label="Hora Salida"
          type="time"
          icon="logout"
          value={form.endTime}
          onChange={(e) => handleChange('endTime', e.target.value)}
          error={errors.endTime}
        />
      </div>

      {/* Spot Selector */}
      {showSpotSelector && (
        <div>
          <SpotSelector
            spots={spots}
            selectedSpotId={form.spotId || null}
            onSelect={(spotId) => handleChange('spotId', spotId)}
            vehicleType={selectedVehicle!.type}
            isLoading={spotsLoading}
          />
          {errors.spotId && (
            <p className="mt-1 text-sm text-red-400">{errors.spotId}</p>
          )}
        </div>
      )}

      {/* Notes */}
      <Input
        label="Notas (opcional)"
        placeholder="Ej: Necesito espacio para carga..."
        icon="notes"
        value={form.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        error={errors.notes}
        maxLength={500}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 flex items-start gap-2">
          <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading}>
          Crear Reserva
        </Button>
      </div>
    </form>
  )
}
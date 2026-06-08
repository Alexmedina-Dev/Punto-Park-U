import { useState } from 'react'
import { Input, Button } from '@/components/ui'
import type { Vehicle } from '@/types'

interface ReservationFormData {
  vehicleId: string
  spot: string
  date: string
  startTime: string
  endTime: string
  notes: string
}

interface ReservationFormProps {
  vehicles: Vehicle[]
  onSubmit: (data: {
    vehicle: string
    spot: string
    entryTime: string
    date?: string
    startTime?: string
    endTime?: string
    notes?: string
  }) => Promise<boolean>
  onCancel?: () => void
  isLoading?: boolean
}

const INITIAL_FORM: ReservationFormData = {
  vehicleId: '',
  spot: '',
  date: '',
  startTime: '',
  endTime: '',
  notes: '',
}

const SPOTS = ['A1', 'A2', 'A3', 'A4', 'A5', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'C4', 'C5']

export function ReservationForm({
  vehicles,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReservationFormProps) {
  const [form, setForm] = useState<ReservationFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ReservationFormData, string>> = {}

    if (!form.vehicleId) {
      newErrors.vehicleId = 'Selecciona un vehículo'
    }

    if (!form.spot) {
      newErrors.spot = 'Selecciona un espacio'
    }

    if (!form.date) {
      newErrors.date = 'Selecciona una fecha'
    } else {
      const selected = new Date(form.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selected < today) {
        newErrors.date = 'La fecha no puede ser en el pasado'
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

    if (form.notes && form.notes.length > 500) {
      newErrors.notes = 'Las notas no pueden exceder 500 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Build entryTime as ISO string from date + startTime
    const entryTime = new Date(`${form.date}T${form.startTime}:00`).toISOString()

    const success = await onSubmit({
      vehicle: form.vehicleId,
      spot: form.spot,
      entryTime,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
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
  const todayStr = new Date().toISOString().split('T')[0]

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
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
                  {v.type === 'moto' ? 'motorcycle' : v.type === 'bike' ? 'pedal_bike' : 'directions_car'}
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

      {/* Spot Selection */}
      <div>
        <label className="block text-sm font-medium text-on-surface-var mb-1">
          Espacio de Estacionamiento
        </label>
        <div className="grid grid-cols-5 gap-1.5">
          {SPOTS.map((spot) => (
            <button
              key={spot}
              type="button"
              onClick={() => handleChange('spot', spot)}
              className={`
                px-2 py-1.5 rounded text-xs font-medium border transition-colors text-center
                ${
                  form.spot === spot
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container text-on-surface-var border-outline/20 hover:border-primary/50'
                }
              `}
            >
              {spot}
            </button>
          ))}
        </div>
        {errors.spot && (
          <p className="mt-1 text-sm text-red-400">{errors.spot}</p>
        )}
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Fecha"
          type="date"
          icon="calendar_month"
          value={form.date}
          onChange={(e) => handleChange('date', e.target.value)}
          min={todayStr}
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

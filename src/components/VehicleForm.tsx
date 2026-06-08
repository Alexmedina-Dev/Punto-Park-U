import { useState } from 'react'
import { Input, Button } from '@/components/ui'

interface VehicleFormData {
  plate: string
  type: string
  brand: string
  model: string
  color: string
}

interface VehicleFormProps {
  initialData?: Partial<VehicleFormData>
  onSubmit: (data: VehicleFormData) => Promise<boolean>
  onCancel?: () => void
  isLoading?: boolean
  error?: string | null
}

const VEHICLE_TYPES = [
  { value: 'car', label: 'Vehículo', icon: 'directions_car' },
  { value: 'moto', label: 'Moto', icon: 'two_wheeler' },
  { value: 'bike', label: 'Bicicleta', icon: 'pedal_bike' },
]

const INITIAL_FORM: VehicleFormData = {
  plate: '',
  type: 'car',
  brand: '',
  model: '',
  color: '',
}

const COLOR_OPTIONS = [
  'Blanco',
  'Negro',
  'Gris',
  'Plateado',
  'Rojo',
  'Azul',
  'Verde',
  'Amarillo',
  'Naranja',
  'Marrón',
  'Beige',
  'Otro',
]

export function VehicleForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  error,
}: VehicleFormProps) {
  const [form, setForm] = useState<VehicleFormData>({
    ...INITIAL_FORM,
    ...initialData,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({})
  const [isCustomColor, setIsCustomColor] = useState(false)

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleFormData, string>> = {}

    if (!form.plate.trim()) {
      newErrors.plate = 'La placa es obligatoria'
    } else if (!/^[A-Z0-9]+$/.test(form.plate.trim())) {
      newErrors.plate = 'Solo se permiten letras y números (sin espacios ni guiones)'
    } else if (form.plate.trim().length < 5 || form.plate.trim().length > 6) {
      newErrors.plate = 'La placa debe tener 5 o 6 caracteres'
    } else if (!/^[A-Z]{3}[0-9]{2,3}[A-Z]?$/.test(form.plate.trim()) && !/^[A-Z]{2}[0-9]{4}$/.test(form.plate.trim())) {
      newErrors.plate = 'Formato inválido. Ejemplos: ABC123, ABC12D, ABC12, AB1234'
    }

    if (!form.type) {
      newErrors.type = 'Selecciona el tipo de vehículo'
    }

    if (form.brand && form.brand.length > 50) {
      newErrors.brand = 'La marca no puede exceder 50 caracteres'
    }

    if (form.model && form.model.length > 50) {
      newErrors.model = 'El modelo no puede exceder 50 caracteres'
    }

    if (form.color && form.color.length > 30) {
      newErrors.color = 'El color no puede exceder 30 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const success = await onSubmit({
      ...form,
      plate: form.plate.toUpperCase().trim(),
    })

    if (success && !initialData) {
      // Reset form after successful creation
      setForm(INITIAL_FORM)
      setIsCustomColor(false)
    }
  }

  const handleChange = (field: keyof VehicleFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-on-surface-var mb-2">
          Tipo de Vehículo
        </label>
        <div className="grid grid-cols-3 gap-2">
          {VEHICLE_TYPES.map((vt) => (
            <button
              key={vt.value}
              type="button"
              onClick={() => handleChange('type', vt.value)}
              className={`
                flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-medium border transition-colors min-h-[44px]
                ${
                  form.type === vt.value
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container text-on-surface-var border-outline/20 hover:border-primary/50'
                }
              `}
            >
              <span className="material-symbols-outlined text-xl">{vt.icon}</span>
              {vt.label}
            </button>
          ))}
        </div>
        {errors.type && (
          <p className="mt-1 text-sm text-red-400">{errors.type}</p>
        )}
      </div>

      <Input
        label="Placa"
        placeholder="ABC123"
        icon="directions_car"
        value={form.plate}
        onChange={(e) => handleChange('plate', e.target.value.toUpperCase())}
        error={errors.plate}
        maxLength={6}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Marca"
          placeholder="Ej: Toyota"
          icon="badge"
          value={form.brand}
          onChange={(e) => handleChange('brand', e.target.value)}
          error={errors.brand}
          maxLength={50}
        />
        <Input
          label="Modelo"
          placeholder="Ej: Corolla"
          icon="tag"
          value={form.model}
          onChange={(e) => handleChange('model', e.target.value)}
          error={errors.model}
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-on-surface-var mb-1">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                if (color === 'Otro') {
                  handleChange('color', '')
                  setIsCustomColor(true)
                } else {
                  handleChange('color', color)
                  setIsCustomColor(false)
                }
              }}
              className={`
                px-3 py-3 rounded-lg text-xs font-medium border transition-colors min-h-[44px]
                ${
                  (color !== 'Otro' && form.color === color) || (color === 'Otro' && isCustomColor)
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container text-on-surface-var border-outline/20 hover:border-primary/50'
                }
              `}
            >
              {color}
            </button>
          ))}
        </div>
        {errors.color && (
          <p className="mt-1 text-sm text-red-400">{errors.color}</p>
        )}
      </div>

      {isCustomColor && (
        <Input
          label="Otro color"
          placeholder="Especifica el color"
          value={form.color}
          onChange={(e) => handleChange('color', e.target.value)}
          maxLength={30}
        />
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400 flex items-start gap-2">
          <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData ? 'Guardar Cambios' : 'Registrar Vehículo'}
        </Button>
      </div>
    </form>
  )
}
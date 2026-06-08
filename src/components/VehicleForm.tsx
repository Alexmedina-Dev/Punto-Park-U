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
}

const VEHICLE_TYPES = [
  { value: 'car', label: 'Automóvil' },
  { value: 'moto', label: 'Motocicleta' },
  { value: 'suv', label: 'Camioneta' },
  { value: 'bike', label: 'Bicicleta' },
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
}: VehicleFormProps) {
  const [form, setForm] = useState<VehicleFormData>({
    ...INITIAL_FORM,
    ...initialData,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof VehicleFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VehicleFormData, string>> = {}

    if (!form.plate.trim()) {
      newErrors.plate = 'La placa es obligatoria'
    } else if (!/^[A-Za-z0-9-]{4,10}$/.test(form.plate.trim())) {
      newErrors.plate = 'Formato de placa inválido (4-10 caracteres alfanuméricos)'
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
        <label className="block text-sm font-medium text-on-surface-var mb-1">
          Tipo de Vehículo
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VEHICLE_TYPES.map((vt) => (
            <button
              key={vt.value}
              type="button"
              onClick={() => handleChange('type', vt.value)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium border transition-colors
                ${
                  form.type === vt.value
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container text-on-surface-var border-outline/20 hover:border-primary/50'
                }
              `}
            >
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
        maxLength={10}
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
              onClick={() => handleChange('color', color === 'Otro' ? '' : color)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${
                  form.color === color || (color === 'Otro' && !COLOR_OPTIONS.slice(0, -1).includes(form.color))
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

      {!COLOR_OPTIONS.slice(0, -1).includes(form.color) && form.color && (
        <Input
          label="Otro color"
          placeholder="Especifica el color"
          value={form.color}
          onChange={(e) => handleChange('color', e.target.value)}
          maxLength={30}
        />
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

// ── Currency Formatters ──

/**
 * Format a number as Colombian Pesos (COP).
 * Example: 3000 → "$3.000"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format a number as Colombian Pesos without currency symbol.
 * Example: 3000 → "3.000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value)
}

// ── Date Formatters ──

/**
 * Format a date string to a localized date.
 * Example: "2024-01-15T10:30:00" → "15 ene 2024"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Format a date string to a localized date and time.
 * Example: "2024-01-15T10:30:00" → "15 ene 2024, 10:30 a. m."
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/**
 * Format a time string (HH:mm) to localized time.
 * Example: "07:00" → "7:00 a. m."
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes))
  return new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// ── Duration Formatters ──

/**
 * Format minutes into a human-readable duration.
 * Example: 150 → "2 h 30 min"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) return `${remainingMinutes} min`
  if (remainingMinutes === 0) return `${hours} h`
  return `${hours} h ${remainingMinutes} min`
}

// ── Percentage Formatters ──

/**
 * Format a decimal as percentage.
 * Example: 0.75 → "75%"
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`
}

// ── Vehicle Type Formatters ──

const VEHICLE_LABELS: Record<string, string> = {
  car: 'Vehículo',
  moto: 'Moto',
  bike: 'Bicicleta',
}

/**
 * Get human-readable vehicle type label.
 * Example: "car" → "Vehículo"
 */
export function getVehicleLabel(type: string): string {
  return VEHICLE_LABELS[type] || type
}

// ── Status Formatters ──

const STATUS_LABELS: Record<string, string> = {
  libre: 'Libre',
  ocupado: 'Ocupado',
  reservado: 'Reservado',
  active: 'Activo',
  cancelled: 'Cancelado',
  completed: 'Completado',
  paid: 'Pagado',
  pending: 'Pendiente',
}

/**
 * Get human-readable status label.
 */
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

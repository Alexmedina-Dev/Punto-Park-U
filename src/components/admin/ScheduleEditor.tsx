import { useState, useEffect, useCallback } from 'react'
import { Card, Button } from '@/components/ui'
import { getScheduleService } from '@/services/parking.service'
import { updateScheduleService } from '@/services/admin.service'
import { formatTime } from '@/utils/formatters'
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler'
import type { Schedule } from '@/types'

const DEFAULT_SCHEDULE: Schedule = {
  weekday: { open: '07:00', close: '19:00' },
  sunday: { open: '09:00', close: '17:00' },
}

export function ScheduleEditor() {
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    getScheduleService()
      .then((data) => {
        if (mounted) setSchedule(data)
      })
      .catch(() => {
        // Use defaults on error
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const handleTimeChange = useCallback(
    (day: 'weekday' | 'sunday', field: 'open' | 'close', value: string) => {
      setSchedule((prev) => ({
        ...prev,
        [day]: { ...prev[day], [field]: value },
      }))
    },
    []
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await updateScheduleService(schedule as unknown as Record<string, unknown>)
      showSuccessToast('Horarios actualizados correctamente')
    } catch (err) {
      showErrorToast(err)
    } finally {
      setIsSaving(false)
    }
  }, [schedule])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const getDayLabel = (day: 'weekday' | 'sunday') => {
    if (day === 'weekday') return '📅 Lunes a Sábado'
    return '🎉 Domingos y Festivos'
  }

  return (
    <div className="space-y-6">
      {/* Header with Save */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-primary font-headline">Horarios de Atención</h3>
          <p className="text-sm text-on-surface-var mt-1">
            Configura los horarios de apertura y cierre del parqueadero
          </p>
        </div>
        <Button onClick={handleSave} loading={isSaving} className="self-start sm:self-auto">
          <span className="material-symbols-outlined text-base">save</span>
          Guardar Horarios
        </Button>
      </div>

      {/* Schedule Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['weekday', 'sunday'] as const).map((day) => (
          <Card key={day} variant="glass" padding="md">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">{getDayLabel(day)}</span>
              </div>
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-on-surface-var mb-1">
                    <span className="material-symbols-outlined text-base align-middle mr-1">wb_sunny</span>
                    Apertura
                  </label>
                  <input
                    type="time"
                    value={schedule[day].open}
                    onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-outline/20 rounded-lg text-on-bg
                      focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                      transition-colors"
                  />
                </div>
                <span className="hidden lg:inline text-on-surface-var mt-6 text-lg">→</span>
                <span className="lg:hidden text-on-surface-var text-center text-lg">↓</span>
                <div className="flex-1">
                  <label className="block text-xs text-on-surface-var mb-1">
                    <span className="material-symbols-outlined text-base align-middle mr-1">nights_stay</span>
                    Cierre
                  </label>
                  <input
                    type="time"
                    value={schedule[day].close}
                    onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-outline/20 rounded-lg text-on-bg
                      focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30
                      transition-colors"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Live Preview */}
      <Card variant="glass" title="Vista Previa en Vivo" padding="md">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 bg-surface-container rounded-lg">
            <span className="text-sm font-bold text-on-bg">Lunes a Sábado</span>
            <span className="text-sm text-primary font-bold">
              {formatTime(schedule.weekday.open)} — {formatTime(schedule.weekday.close)}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 bg-surface-container rounded-lg">
            <span className="text-sm font-bold text-on-bg">Domingos y Festivos</span>
            <span className="text-sm text-primary font-bold">
              {formatTime(schedule.sunday.open)} — {formatTime(schedule.sunday.close)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}

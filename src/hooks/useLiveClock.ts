import { useEffect, useState } from 'react'

interface UseLiveClockOptions {
  /** Interval in ms. Default: 1000 */
  intervalMs?: number
  /** Locale for formatting. Default: 'es-CO' */
  locale?: string
  /** Custom format function. Default: formats as "hh:mm:ss AM/PM" */
  format?: (date: Date) => string
}

function defaultFormat(date: Date): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 || 12
  const hh = h12.toString().padStart(2, '0')
  const mm = minutes.toString().padStart(2, '0')
  const ss = seconds.toString().padStart(2, '0')
  return `${hh}:${mm}:${ss} ${ampm}`
}

/**
 * Live clock hook that updates at a configurable interval.
 *
 * Usage:
 * ```tsx
 * const { time, date } = useLiveClock()
 * // time => "02:30:45 PM"
 * ```
 */
export function useLiveClock(options: UseLiveClockOptions = {}) {
  const { intervalMs = 1000, format = defaultFormat } = options

  const [time, setTime] = useState(() => format(new Date()))
  const [date, setDate] = useState(() => new Date())

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(format(now))
      setDate(now)
    }

    // Update immediately on mount
    update()

    const interval = setInterval(update, intervalMs)
    return () => clearInterval(interval)
  }, [intervalMs, format])

  return { time, date }
}

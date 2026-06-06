import { useEffect, useRef, useState } from 'react'

interface UseCounterOptions {
  /** Target value to count to. Default: 0 */
  target: number
  /** Duration in ms. Default: 1500 */
  duration?: number
  /** Easing function (0-1 progression). Default: easeOutQuad */
  easing?: (t: number) => number
  /** Start counting only when visible. Default: true */
  animateOnVisible?: boolean
  /** Whether element is visible (pass from useAnimation). Default: true */
  isVisible?: boolean
  /** Format the displayed value. Default: Math.round */
  format?: (value: number) => string
}

const DEFAULT_EASING = (t: number): number => t * (2 - t)

/**
 * Animated number counter (0 to target).
 *
 * Usage:
 * ```tsx
 * const { ref, isVisible } = useAnimation()
 * const { displayValue } = useCounter({ target: 42, isVisible })
 * ```
 */
export function useCounter({
  target,
  duration = 1500,
  easing = DEFAULT_EASING,
  animateOnVisible = true,
  isVisible = true,
  format = (v) => Math.round(v).toString(),
}: UseCounterOptions) {
  const [displayValue, setDisplayValue] = useState(
    animateOnVisible ? '0' : format(target),
  )
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const prevTargetRef = useRef(target)

  useEffect(() => {
    // Always set visible start value
    if (animateOnVisible && !isVisible) {
      setDisplayValue('0')
      return
    }

    // Immediate if target is 0 or duration is 0
    if (target === 0 || duration === 0) {
      setDisplayValue(format(target))
      return
    }

    // If target changed, start from current displayed value
    const startValue = prevTargetRef.current !== target
      ? parseFloat(displayValue.replace(/[^0-9.]/g, '')) || 0
      : 0

    const startTime = performance.now()
    startTimeRef.current = startTime

    const animate = (now: number) => {
      const elapsed = now - (startTimeRef.current ?? startTime)
      const rawProgress = Math.min(elapsed / duration, 1)
      const easedProgress = easing(rawProgress)
      const current = startValue + (target - startValue) * easedProgress

      setDisplayValue(format(current))

      if (rawProgress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(format(target))
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    prevTargetRef.current = target

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, isVisible])

  return { displayValue }
}

// ─── Pre-built common easings ───

export const easings = {
  /** t * (2 - t) — smooth deceleration */
  easeOutQuad: (t: number): number => t * (2 - t),
  /** t^3 — fast then slow */
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  /** t^4 — pronounced deceleration */
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
  /** Overshoots slightly then settles */
  easeOutBack: (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  /** Smooth start and end */
  easeInOutQuad: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  /** Bounces at the end */
  easeOutBounce: (t: number): number => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
}

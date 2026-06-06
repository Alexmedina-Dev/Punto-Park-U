import { useScrollProgress } from '@/hooks/useAnimations'

/**
 * Scroll progress indicator bar at the top of the page.
 * Thin line that fills from left to right as the user scrolls.
 */
export function ScrollProgress() {
  const progress = useScrollProgress()

  // Don't render if no scroll is needed
  if (progress === undefined) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-surface-low"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progreso de lectura"
    >
      <div
        className="h-full bg-primary scroll-progress transition-transform duration-100 ease-out will-change-transform"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  )
}

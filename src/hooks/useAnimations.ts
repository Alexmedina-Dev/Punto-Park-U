import { useEffect, useRef, useState, useCallback } from 'react'

type AnimationType = 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale-in'

interface UseAnimationOptions {
  /** IntersectionObserver threshold (0-1). Default: 0.15 */
  threshold?: number
  /** Root margin for early trigger. Default: '0px 0px -40px 0px' */
  rootMargin?: string
  /** Animation type. Default: 'slide-up' */
  animation?: AnimationType
  /** Delay in ms before adding the visible class. Default: 0 */
  delay?: number
  /** Only animate once. Default: true */
  once?: boolean
  /** Stagger delay per element index in ms. Default: 0 */
  staggerIndex?: number
  /** Custom CSS class to add when visible. Default: derived from animation */
  animationClass?: string
}

type UseAnimationReturn<T extends HTMLElement> = {
  ref: React.RefObject<T | null>
  isVisible: boolean
  animationClass: string
}

/**
 * IntersectionObserver hook for scroll-triggered animations.
 *
 * Usage:
 * ```tsx
 * const { ref, isVisible } = useAnimation({ animation: 'slide-up', delay: 200 })
 * <div ref={ref} className={isVisible ? 'animate-visible' : 'animate-hidden'}>
 * ```
 */
export function useAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseAnimationOptions = {},
): UseAnimationReturn<T> {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -40px 0px',
    animation = 'slide-up',
    delay = 0,
    once = true,
    staggerIndex = 0,
    animationClass: customClass,
  } = options

  const ref = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const rafRef = useRef<number | null>(null)

  const resolvedClass =
    customClass ?? getDefaultAnimationClass(animation, staggerIndex, delay)

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Use rAF to prevent layout thrashing
          rafRef.current = requestAnimationFrame(() => {
            setIsVisible(true)
          })
          if (once) observer.unobserve(entry.target)
        } else if (!once) {
          rafRef.current = requestAnimationFrame(() => {
            setIsVisible(false)
          })
        }
      })
    },
    [once],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin,
    })

    observer.observe(el)

    return () => {
      observer.disconnect()
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [handleIntersect, threshold, rootMargin])

  return { ref: ref as React.RefObject<T | null>, isVisible, animationClass: resolvedClass }
}

/**
 * Creates a stagger-aware container ref for animating children in sequence.
 * Each child must have `data-stagger` attribute with a 0-based index.
 */
export function useStaggerAnimation(options: UseAnimationOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -40px 0px',
    animation = 'slide-up',
    once = true,
  } = options

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => setIsVisible(true))
          if (once) observer.unobserve(entry.target)
        } else if (!once) {
          requestAnimationFrame(() => setIsVisible(false))
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  const getChildClass = (index: number, delay: number = 0): string => {
    if (!isVisible) return 'opacity-0 translate-y-6'
    return getDefaultAnimationClass(animation, index, delay)
  }

  return { containerRef, isVisible, getChildClass }
}

function getDefaultAnimationClass(
  animation: AnimationType,
  staggerIndex: number,
  delay: number,
): string {
  const staggerDelay = staggerIndex * 100
  const totalDelay = delay + staggerDelay

  const baseClasses: Record<AnimationType, string> = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-left': 'animate-slide-left',
    'slide-right': 'animate-slide-right',
    'scale-in': 'animate-scale-in',
  }

  const className = baseClasses[animation] ?? 'animate-slide-up'
  if (totalDelay > 0) {
    return `${className} animate-delay-${totalDelay}`
  }
  return className
}

// ─── Scroll Progress Indicator ───

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) {
        setProgress(0)
        return
      }
      const pct = Math.min(scrollTop / docHeight, 1)
      setProgress(pct)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}

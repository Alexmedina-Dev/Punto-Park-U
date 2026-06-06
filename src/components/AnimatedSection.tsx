import { type ReactNode } from 'react'
import { useAnimation } from '@/hooks/useAnimations'

interface AnimatedSectionProps {
  children: ReactNode
  /** Animation type. Default: 'slide-up' */
  animation?: 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale-in'
  /** Delay in ms. Default: 0 */
  delay?: number
  /** Additional className */
  className?: string
  /** Tag to render. Default: 'div' */
  as?: 'div' | 'section' | 'article'
  /** Only animate children (pass through without wrapping) */
  noWrapper?: boolean
}

/**
 * Scroll-triggered animated wrapper.
 * Uses IntersectionObserver to add animation classes when visible.
 */
export function AnimatedSection({
  children,
  animation = 'slide-up',
  delay = 0,
  className = '',
  as: Tag = 'div',
}: AnimatedSectionProps) {
  const { ref, isVisible } = useAnimation({ animation, delay })

  const hiddenClass = getHiddenClass(animation)

  return (
    <Tag
      ref={ref}
      className={`${className} ${isVisible ? 'anim-visible animate-' + animation : hiddenClass}`}
      data-animated="true"
    >
      {children}
    </Tag>
  )
}

function getHiddenClass(animation: string): string {
  switch (animation) {
    case 'fade-in':
      return 'anim-hidden-fade'
    case 'slide-up':
      return 'anim-hidden-slide-up'
    case 'slide-left':
      return 'anim-hidden-slide-left'
    case 'slide-right':
      return 'anim-hidden-slide-right'
    case 'scale-in':
      return 'anim-hidden-scale'
    default:
      return 'anim-hidden-slide-up'
  }
}

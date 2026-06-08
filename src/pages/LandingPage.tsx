import { useEffect, useRef, useState } from 'react'
import { Layout } from '@/components/layout'
import {
  HeroSection,
  WhyUsSection,
  AboutSection,
  PricingSection,
  AvailabilitySection,
  FluxAISection,
  LocationSection,
} from '@/sections'
import { AnimatedSection } from '@/components/AnimatedSection'
import { ScrollProgress } from '@/components/ScrollProgress'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAppStore } from '@/stores/appStore'

export function LandingPage() {
  const { isLoading, fetchTariffs, fetchSchedule, fetchAvailability } = useAppStore()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollRef = useRef<number | null>(null)

  // Fetch parking data on mount
  useEffect(() => {
    fetchTariffs()
    fetchSchedule()
    fetchAvailability()
  }, [fetchTariffs, fetchSchedule, fetchAvailability])

  // Scroll to top button visibility (debounced)
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current !== null) {
        cancelAnimationFrame(scrollRef.current)
      }
      scrollRef.current = requestAnimationFrame(() => {
        setShowScrollTop(window.pageYOffset > 300)
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollRef.current !== null) cancelAnimationFrame(scrollRef.current)
    }
  }, [])

  const scrollToTop = () => {
    const start = window.pageYOffset
    const duration = 800
    const startTime = performance.now()

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      window.scrollTo(0, start * (1 - eased))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }

  return (
    <Layout noHeaderPadding>
      {/* Loading indicator for initial data fetch */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-primary/20">
          <div className="h-full bg-primary animate-pulse rounded-full transition-all duration-500" style={{ width: '60%' }} />
        </div>
      )}

      {/* Scroll Progress Indicator */}
      <ScrollProgress />

      {/* Sections — each wrapped in animation container */}
      <HeroSection />

      <AnimatedSection animation="slide-up" delay={100}>
        <WhyUsSection />
      </AnimatedSection>

      <AnimatedSection animation="slide-up" delay={150}>
        <AboutSection />
      </AnimatedSection>

      <AnimatedSection animation="slide-up" delay={100}>
        <PricingSection />
      </AnimatedSection>

      <AnimatedSection animation="slide-up" delay={150}>
        <AvailabilitySection />
      </AnimatedSection>

      <AnimatedSection animation="slide-up" delay={100}>
        <FluxAISection />
      </AnimatedSection>

      <AnimatedSection animation="slide-up" delay={150}>
        <LocationSection />
      </AnimatedSection>

      {/* ── WhatsApp Float Button ── */}
      <a
        href="https://wa.me/573101234567?text=Hola,%20necesito%20información%20sobre%20el%20parqueadero"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[8rem] right-[1.875rem] z-[99] flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full shadow-lg hover:from-green-500 hover:to-green-700 transition-all duration-200 hover:scale-110 animate-pulse-green sm:bottom-[9rem]"
        title="Contáctenos por WhatsApp"
        aria-label="WhatsApp"
        data-testid="whatsapp-float"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>

      {/* ── Scroll to Top Button ── */}
      <button
        onClick={scrollToTop}
        className={`scroll-top ${showScrollTop ? 'show' : ''}`}
        title="Volver arriba"
        aria-label="Volver arriba"
        data-testid="scroll-top-btn"
      >
        <div className="scroll-top-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z" fill="white" />
          </svg>
          <span>P</span>
        </div>
      </button>
    </Layout>
  )
}

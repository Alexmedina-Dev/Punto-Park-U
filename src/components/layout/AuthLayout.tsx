import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { API_BASE_URL } from '@/utils/constants'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  showRegister?: boolean
  showForgotPassword?: boolean
}

/**
 * Standalone auth layout matching the vanilla Punto-Park-U-Web design exactly.
 * Split 50/50: form column (left) + visual column (right).
 * No shared header — these pages are self-contained.
 *
 * Vanilla mobile breakpoint: 767px (not Tailwind's sm:640)
 */
export function AuthLayout({ children, title, showRegister = false, showForgotPassword = false }: AuthLayoutProps) {
  // Wake-up ping for Render free tier (cold start)
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`, { method: 'GET', cache: 'no-store' }).catch(() => {
      // Silent fail — health endpoint is best-effort to wake up the server
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-bg text-on-bg">
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* ── LEFT: Form Column ── */}
        <section className="flex flex-col justify-center items-center px-6 py-12 bg-bg order-2 md:px-16">
          <div className="w-full max-w-[28rem] flex flex-col gap-8">
            {/* Brand */}
            <div>
              <h2 className="font-headline font-black text-[1.875rem] tracking-[-0.05em] uppercase italic text-primary">
                &ldquo;PUNTO PARK U&rdquo;
              </h2>
              <p className="font-label text-[0.75rem] tracking-[0.15em] text-outline uppercase mt-1">
                Sistema de Gestión de Parqueadero
              </p>
            </div>

            {/* Header */}
            <div>
              <h1 className="text-[2.5rem] font-extrabold tracking-[-0.02em] text-on-bg leading-[1] font-headline italic max-md:text-[2rem]">
                {title}
              </h1>
            </div>

            {/* Form slot */}
            {children}

            {/* Register / Forgot password links */}
            {(showRegister || showForgotPassword) && (
              <div className="text-center pt-4 flex flex-col gap-2">
                {showForgotPassword && (
                  <Link
                    to="/forgot-password"
                    className="font-label text-[0.875rem] text-primary hover:text-primary-fixed transition-colors inline-flex items-center gap-2"
                  >
                    ¿Olvidó su contraseña?{' '}
                    <span className="font-bold underline underline-offset-4">Recuperar aquí</span>
                  </Link>
                )}
                {showRegister && (
                  <Link
                    to="/register"
                    className="font-label text-[0.875rem] text-primary hover:text-primary-fixed transition-colors inline-flex items-center gap-2"
                  >
                    ¿No tienes cuenta?{' '}
                    <span className="font-bold underline underline-offset-4">Regístrate aquí</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── RIGHT: Visual Column ── */}
        <section className="relative flex items-center justify-center bg-surface-low overflow-hidden py-12 min-h-[16rem] order-1 md:min-h-0">
          {/* Watermark logo */}
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.35] pointer-events-none">
            <img
              src="/images/Logo.png"
              alt=""
              className="w-[80%] drop-shadow-[0_0_30px_rgba(0,116,217,0.5)]"
              aria-hidden="true"
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-bg via-transparent to-primary/20" />

          {/* Avatar cluster */}
          <div className="relative z-10">
            {/* Ring — vanilla: 20rem desktop, 12rem mobile */}
            <div className="w-48 h-48 md:w-[20rem] md:h-[20rem] rounded-full bg-gradient-to-br from-primary-container to-primary p-2 shadow-[0_0_80px_rgba(0,116,217,0.4)] animate-[pulse-ring_2s_ease-in-out_infinite]">
              <div className="w-full h-full rounded-full bg-bg flex items-center justify-center">
                {/* Person icon — vanilla: 9rem desktop, 6rem mobile */}
                <span className="material-symbols-outlined text-6xl md:text-[9rem] text-on-bg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  person
                </span>
              </div>
            </div>

            {/* Shield badge */}
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center shadow-[12px_12px_0_0_rgba(0,116,217,0.2)]">
              <span className="material-symbols-outlined text-on-primary-container">shield</span>
            </div>

            {/* Online badge */}
            <div className="absolute -bottom-6 -left-6 flex items-center gap-2 px-4 py-2 rounded-[1.5rem] bg-surface-high border border-outline-variant/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ffcc]" />
              </span>
              <span className="font-label text-[0.75rem] tracking-tight uppercase text-on-surface-var">
                System Online
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* ── HOME BUTTON (fixed, matching vanilla — single button, responsive label) ── */}
      <Link
        to="/"
        className="fixed bottom-[90px] md:bottom-[90px] max-md:bottom-[110px] right-6 md:right-8 z-50 flex items-center justify-center bg-surface-highest/80 text-white md:px-6 md:py-4 max-md:p-4 rounded-full shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-colors hover:bg-primary-container group touch-target"
      >
        <span className="material-symbols-outlined text-primary text-[1.5rem] group-hover:text-on-primary-container transition-colors">
          home
        </span>
        <span className="hidden md:inline font-label text-[0.875rem] font-bold tracking-[0.15em] uppercase text-on-bg group-hover:text-on-primary-container transition-colors ml-2">
          Inicio
        </span>
      </Link>

      {/* ── FOOTER (simple one-liner, matching vanilla) ── */}
      <footer className="bg-bg flex flex-col items-center justify-center gap-4 py-8 border-t border-outline-variant/10 z-40">
        <p className="font-label text-[0.875rem] text-outline-variant flex flex-wrap justify-center gap-[10px] flex-col md:flex-row gap-[5px] md:gap-[10px]">
          <span className="whitespace-nowrap">&copy; 2026 &ldquo;Punto Park U&rdquo;</span>
          <span className="whitespace-nowrap">Todos los derechos reservados</span>
        </p>
      </footer>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/authStore'
import { API_BASE_URL } from '@/utils/constants'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { forgotPassword, isLoading, error, clearError } = useAuthStore()

  const validate = () => {
    if (!email || /^\S+@\S+\.\S+$/.test(email) === false) {
      setEmailError('Ingresa un correo electrónico válido')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (!validate()) return

    const result = await forgotPassword(email)
    if (result.success) {
      setSubmitted(true)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError) {
      setEmailError('')
    }
  }

  // ── Submitted state ───────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-bg text-on-bg">
        <main className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-screen">
          {/* LEFT: Content */}
          <section className="flex flex-col justify-center items-center px-6 py-12 bg-bg order-2 md:px-16">
            <div className="w-full max-w-[28rem] flex flex-col gap-8">
              {/* Brand */}
              <div>
                <h2 className="font-headline font-black text-[1.875rem] tracking-[-0.05em] uppercase italic text-primary">
                  &ldquo;PUNTO PARK U&rdquo;
                </h2>
                <p className="font-label text-[0.75rem] tracking-[0.15em] text-outline uppercase mt-1">
                  Sistema de Gesti&oacute;n de Parqueadero
                </p>
              </div>

              {/* Success message */}
              <div>
                <h1 className="text-[2.5rem] font-extrabold tracking-[-0.02em] text-on-bg leading-[1] font-headline italic max-md:text-[2rem]">
                  Correo Enviado
                </h1>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 text-center">
                  Si existe una cuenta con ese correo electr&oacute;nico, recibir&aacute;s un enlace para restablecer tu contrase&ntilde;a.
                </div>
                <p className="text-sm text-on-surface-var text-center">
                  Revisa tu bandeja de entrada. Si no ves el correo, revisa la carpeta de spam.
                  <br />
                  <span className="block mt-2 text-xs opacity-70">
                    (Modo simulaci&oacute;n: el token se muestra en la consola del servidor)
                  </span>
                </p>
                <Link
                  to="/login"
                  className="block text-center text-primary hover:text-primary-fixed transition-colors text-sm font-label font-bold tracking-[0.15em] uppercase"
                >
                  Volver a Iniciar Sesi&oacute;n
                </Link>
              </div>
            </div>
          </section>

          {/* RIGHT: Visual */}
          <section className="relative flex items-center justify-center bg-surface-low overflow-hidden py-12 min-h-[16rem] order-1 md:min-h-0">
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.35] pointer-events-none">
              <img
                src="/images/Logo.webp"
                alt=""
                className="w-[80%] drop-shadow-[0_0_30px_rgba(0,116,217,0.5)]"
                aria-hidden="true"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-bg via-transparent to-primary/20" />
            <div className="relative z-10">
              <div className="w-48 h-48 md:w-[20rem] md:h-[20rem] rounded-full bg-gradient-to-br from-primary-container to-primary p-2 shadow-[0_0_80px_rgba(0,116,217,0.4)] animate-[pulse-ring_2s_ease-in-out_infinite]">
                <div className="w-full h-full rounded-full bg-bg flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl md:text-[9rem] text-on-bg" style={{ fontVariationSettings: "'FILL' 1" }}>
                    lock_open
                  </span>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center shadow-[12px_12px_0_0_rgba(0,116,217,0.2)]">
                <span className="material-symbols-outlined text-on-primary-container">shield</span>
              </div>
              <div className="absolute -bottom-6 -left-6 flex items-center gap-2 px-4 py-2 rounded-[1.5rem] bg-surface-high border border-outline-variant/20">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ffcc]" />
                </span>
                <span className="font-label text-[0.75rem] tracking-tight uppercase text-on-surface-var">
                  Seguro
                </span>
              </div>
            </div>
          </section>
        </main>

        {/* HOME BUTTON */}
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

        {/* FOOTER */}
        <footer className="bg-bg flex flex-col items-center justify-center gap-4 py-8 border-t border-outline-variant/10 z-40">
          <p className="font-label text-[0.875rem] text-outline-variant flex flex-wrap justify-center gap-[10px] flex-col md:flex-row gap-[5px] md:gap-[10px]">
            <span className="whitespace-nowrap">&copy; 2026 &ldquo;Punto Park U&rdquo;</span>
            <span className="whitespace-nowrap">Todos los derechos reservados</span>
          </p>
        </footer>
      </div>
    )
  }

  // ── Form state ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-bg text-on-bg">
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* LEFT: Form */}
        <section className="flex flex-col justify-center items-center px-6 py-12 bg-bg order-2 md:px-16">
          <div className="w-full max-w-[28rem] flex flex-col gap-8">
            {/* Brand */}
            <div>
              <h2 className="font-headline font-black text-[1.875rem] tracking-[-0.05em] uppercase italic text-primary">
                &ldquo;PUNTO PARK U&rdquo;
              </h2>
              <p className="font-label text-[0.75rem] tracking-[0.15em] text-outline uppercase mt-1">
                Sistema de Gesti&oacute;n de Parqueadero
              </p>
            </div>

            {/* Header */}
            <div>
              <h1 className="text-[2.5rem] font-extrabold tracking-[-0.02em] text-on-bg leading-[1] font-headline italic max-md:text-[2rem]">
                &iquest;Olvidaste tu Contrase&ntilde;a?
              </h1>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Correo Electr&oacute;nico"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Ingresa tu correo electr&oacute;nico"
                  error={emailError}
                  icon="email"
                  data-testid="forgot-password-email"
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-14 md:h-16 rounded-2xl md:rounded-[1.5rem] text-base font-bold tracking-[0.15em] uppercase shadow-[12px_12px_0_0_rgba(0,116,217,0.2)] hover:shadow-[8px_8px_0_0_rgba(0,116,217,0.3)] active:scale-[0.97] active:shadow-[4px_4px_0_0_rgba(0,116,217,0.2)] transition-all"
                  loading={isLoading}
                  data-testid="forgot-password-submit"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                  <span className="material-symbols-outlined text-xl">send</span>
                </Button>
              </form>

              <p className="text-center text-sm text-on-surface-var">
                <Link
                  to="/login"
                  className="text-primary hover:text-primary-fixed transition-colors font-label font-bold tracking-[0.15em] uppercase"
                >
                  Volver a Iniciar Sesi&oacute;n
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT: Visual */}
        <section className="relative flex items-center justify-center bg-surface-low overflow-hidden py-12 min-h-[16rem] order-1 md:min-h-0">
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.35] pointer-events-none">
            <img
              src="/images/Logo.webp"
              alt=""
              className="w-[80%] drop-shadow-[0_0_30px_rgba(0,116,217,0.5)]"
              aria-hidden="true"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-bg via-transparent to-primary/20" />
          <div className="relative z-10">
            <div className="w-48 h-48 md:w-[20rem] md:h-[20rem] rounded-full bg-gradient-to-br from-primary-container to-primary p-2 shadow-[0_0_80px_rgba(0,116,217,0.4)] animate-[pulse-ring_2s_ease-in-out_infinite]">
              <div className="w-full h-full rounded-full bg-bg flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl md:text-[9rem] text-on-bg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock_reset
                </span>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center shadow-[12px_12px_0_0_rgba(0,116,217,0.2)]">
              <span className="material-symbols-outlined text-on-primary-container">shield</span>
            </div>
            <div className="absolute -bottom-6 -left-6 flex items-center gap-2 px-4 py-2 rounded-[1.5rem] bg-surface-high border border-outline-variant/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ffcc]" />
              </span>
              <span className="font-label text-[0.75rem] tracking-tight uppercase text-on-surface-var">
                Seguro
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* HOME BUTTON */}
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

      {/* FOOTER */}
      <footer className="bg-bg flex flex-col items-center justify-center gap-4 py-8 border-t border-outline-variant/10 z-40">
        <p className="font-label text-[0.875rem] text-outline-variant flex flex-wrap justify-center gap-[10px] flex-col md:flex-row gap-[5px] md:gap-[10px]">
          <span className="whitespace-nowrap">&copy; 2026 &ldquo;Punto Park U&rdquo;</span>
          <span className="whitespace-nowrap">Todos los derechos reservados</span>
        </p>
      </footer>
    </div>
  )
}

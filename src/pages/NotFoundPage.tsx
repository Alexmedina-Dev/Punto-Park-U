import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

export function NotFoundPage() {
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

            {/* 404 Message */}
            <div className="text-center md:text-left">
              <div className="text-7xl md:text-8xl font-black text-primary/20 font-headline leading-none mb-2">
                404
              </div>
              <h1 className="text-[2rem] md:text-[2.5rem] font-extrabold tracking-[-0.02em] text-on-bg leading-[1] font-headline italic mb-4">
                P&aacute;gina No Encontrada
              </h1>
              <p className="text-on-surface-var mb-8">
                La p&aacute;gina que buscas no existe o ha sido movida.
              </p>
            </div>

            {/* Action */}
            <Link to="/">
              <Button
                variant="primary"
                className="w-full h-14 md:h-16 rounded-2xl md:rounded-[1.5rem] text-base font-bold tracking-[0.15em] uppercase shadow-[12px_12px_0_0_rgba(0,116,217,0.2)] hover:shadow-[8px_8px_0_0_rgba(0,116,217,0.3)] active:scale-[0.97] active:shadow-[4px_4px_0_0_rgba(0,116,217,0.2)] transition-all"
              >
                Volver al Inicio
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </Button>
            </Link>
          </div>
        </section>

        {/* RIGHT: Visual */}
        <section className="relative flex items-center justify-center bg-surface-low overflow-hidden py-12 min-h-[16rem] order-1 md:min-h-0">
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.35] pointer-events-none">
            <img
              src="/images/Logo.png"
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
                  search_off
                </span>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center shadow-[12px_12px_0_0_rgba(0,116,217,0.2)]">
              <span className="material-symbols-outlined text-on-primary-container">warning</span>
            </div>
            <div className="absolute -bottom-6 -left-6 flex items-center gap-2 px-4 py-2 rounded-[1.5rem] bg-surface-high border border-outline-variant/20">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ffcc]" />
              </span>
              <span className="font-label text-[0.75rem] tracking-tight uppercase text-on-surface-var">
                Error
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

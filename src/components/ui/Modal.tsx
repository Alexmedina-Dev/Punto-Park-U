import React, { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      data-testid="modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        data-testid="modal-backdrop"
      />

      {/* Modal Content — bottom-sheet on mobile, centered on desktop */}
      <div
        className="relative w-full max-w-md md:max-w-2xl lg:max-w-3xl bg-surface-container border border-outline/20 rounded-t-2xl md:rounded-lg shadow-brutal animate-in fade-in zoom-in-95 md:zoom-in-100 max-h-[90vh] overflow-y-auto
                   fixed bottom-0 left-0 right-0 md:static md:bottom-auto md:left-auto md:right-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialogo'}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline/20">
            <h2 className="text-lg font-bold text-primary font-headline">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-on-surface-var hover:text-on-bg transition-colors p-1 rounded-md hover:bg-surface-high"
              data-testid="modal-close"
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline/20">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

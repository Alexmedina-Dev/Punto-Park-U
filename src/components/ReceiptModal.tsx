import { useCallback, useRef } from 'react'
import { Modal, Button, Badge } from '@/components/ui'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import type { Payment } from '@/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Types ──────────────────────────────────────────────────────────────

interface ReceiptModalProps {
  /** The payment to show receipt for */
  payment: Payment
  /** Whether the modal is open */
  open: boolean
  /** Close handler */
  onClose: () => void
  /** Vehicle plate to show on receipt */
  vehiclePlate?: string
  /** Vehicle type label */
  vehicleType?: string
  /** User name for receipt header */
  userName?: string
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  pending_epayco: 'Pendiente de pago',
  failed: 'Fallido',
  refunded: 'Reembolsado',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  pos: 'Datáfono',
  epayco: 'ePayco Online',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  transfer: 'Transferencia',
}

/**
 * ReceiptModal — Shows a payment receipt with PDF download capability.
 *
 * Uses jspdf-autotable (already installed) to generate a downloadable
 * invoice PDF with the payment details, vehicle info, and breakdown.
 */
export function ReceiptModal({
  payment,
  open,
  onClose,
  vehiclePlate,
  vehicleType,
  userName,
}: ReceiptModalProps) {
  const isCompleted = payment.status === 'completed'
  const isRefunded = payment.status === 'refunded'

  // ── PDF Generation ─────────────────────────────────────────────
  const generatePdf = useCallback(() => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Punto Park U', pageWidth / 2, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Comprobante de Pago', pageWidth / 2, 28, { align: 'center' })

    // Line separator
    doc.setDrawColor(200)
    doc.line(14, 32, pageWidth - 14, 32)

    // Receipt info
    doc.setFontSize(9)
    let y = 40

    doc.setFont('helvetica', 'bold')
    doc.text('Fecha:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(formatDateTime(payment.createdAt || payment.date || ''), 50, y)
    y += 7

    doc.setFont('helvetica', 'bold')
    doc.text('Estado:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(STATUS_LABELS[payment.status] || payment.status, 50, y)
    y += 7

    if (payment.epaycoRef) {
      doc.setFont('helvetica', 'bold')
      doc.text('Transacción:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(payment.epaycoRef, 50, y)
      y += 7
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Método:', 14, y)
    doc.setFont('helvetica', 'normal')
    doc.text(METHOD_LABELS[payment.method] || payment.method, 50, y)
    y += 7

    if (userName) {
      doc.setFont('helvetica', 'bold')
      doc.text('Cliente:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(userName, 50, y)
      y += 7
    }

    if (vehiclePlate) {
      doc.setFont('helvetica', 'bold')
      doc.text('Vehículo:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(`${vehiclePlate}${vehicleType ? ` (${vehicleType})` : ''}`, 50, y)
      y += 10
    }

    if (payment.reservationId) {
      doc.setFont('helvetica', 'bold')
      doc.text('Reserva:', 14, y)
      doc.setFont('helvetica', 'normal')
      doc.text(payment.reservationId, 50, y)
      y += 7
    }

    // Amount table
    autoTable(doc, {
      startY: y + 5,
      head: [['Concepto', 'Valor']],
      body: [
        ['Servicio de parqueadero', formatCurrency(payment.amount)],
        ...(isRefunded
          ? [['Reembolso', `-${formatCurrency(payment.amount)}`]]
          : []),
      ],
      foot: [
        [
          isRefunded ? 'Total Reembolsado' : 'Total Pagado',
          formatCurrency(isRefunded ? payment.amount : payment.amount),
        ],
      ],
      theme: 'striped',
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      footStyles: {
        fillColor: [240, 240, 240],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      margin: { left: 14, right: 14 },
    })

    // Footer
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(150)
    doc.text(
      'Este es un comprobante generado automáticamente por Punto Park U.',
      pageWidth / 2,
      finalY,
      { align: 'center' }
    )
    doc.text(
      'Gracias por usar nuestros servicios.',
      pageWidth / 2,
      finalY + 5,
      { align: 'center' }
    )

    // Save the PDF
    const fileName = `PuntoParkU_Recibo_${payment.id.slice(-8)}_${new Date().toISOString().slice(0, 10)}.pdf`
    doc.save(fileName)
  }, [payment, vehiclePlate, vehicleType, userName])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comprobante de Pago"
    >
      <div className="space-y-4">
        {/* Payment info */}
        <div className="space-y-3">
          {/* Amount + Status */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-on-bg">
              {formatCurrency(payment.amount)}
            </span>
            <Badge
              variant={
                isCompleted ? 'success' :
                isRefunded ? 'info' :
                payment.status === 'failed' ? 'error' : 'warning'
              }
            >
              {STATUS_LABELS[payment.status] || payment.status}
            </Badge>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-on-surface-var text-xs">Método</p>
              <p className="font-medium text-on-bg">
                {METHOD_LABELS[payment.method] || payment.method}
              </p>
            </div>
            <div>
              <p className="text-on-surface-var text-xs">Fecha</p>
              <p className="font-medium text-on-bg">
                {formatDateTime(payment.createdAt || payment.date || '')}
              </p>
            </div>
            {payment.epaycoRef && (
              <div className="col-span-2">
                <p className="text-on-surface-var text-xs">Referencia ePayco</p>
                <p className="font-medium text-on-bg font-mono text-xs break-all">
                  {payment.epaycoRef}
                </p>
              </div>
            )}
            {vehiclePlate && (
              <div className="col-span-2">
                <p className="text-on-surface-var text-xs">Vehículo</p>
                <p className="font-medium text-on-bg">
                  {vehiclePlate}{vehicleType ? ` — ${vehicleType}` : ''}
                </p>
              </div>
            )}
            {userName && (
              <div className="col-span-2">
                <p className="text-on-surface-var text-xs">Cliente</p>
                <p className="font-medium text-on-bg">{userName}</p>
              </div>
            )}
          </div>

          {/* Status-specific messages */}
          {isCompleted && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-400 text-sm">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Pago confirmado correctamente
            </div>
          )}
          {isRefunded && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 text-blue-400 text-sm">
              <span className="material-symbols-outlined text-base">replay</span>
              Este pago ha sido reembolsado
            </div>
          )}
          {payment.status === 'failed' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              El pago no pudo ser procesado
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-outline/10">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          {isCompleted && (
            <Button variant="primary" size="sm" onClick={generatePdf}>
              <span className="material-symbols-outlined text-sm">download</span>
              Descargar PDF
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

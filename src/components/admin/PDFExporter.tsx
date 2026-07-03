import React from 'react'
import { Button } from '@/components/ui'
import { showSuccessToast, showErrorToast } from '@/utils/errorHandler'
import type { ReportContent } from '@/types'

interface PDFExporterProps {
  content: ReportContent
  disabled?: boolean
}

type RGB = [number, number, number]

const NAVY: RGB = [27, 58, 92]
const BLUE: RGB = [46, 117, 182]
const LIGHT_BLUE: RGB = [214, 228, 240]
const WHITE: RGB = [255, 255, 255]
const GRAY: RGB = [242, 242, 242]
const DARK_GRAY: RGB = [64, 64, 64]
const GREEN: RGB = [10, 102, 32]

function parseTarifa(tarifa: string): number {
  return parseInt(String(tarifa).replace(/[$.]/g, '')) || 0
}

/**
 * Export the current report as a professional PDF using jsPDF + jspdf-autotable.
 * Professional design with navy header, KPI cards, and clean tables.
 */
async function generatePDF(content: ReportContent): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { applyPlugin } = await import('jspdf-autotable')
  applyPlugin(jsPDF)

  const doc: any = new jsPDF('p', 'mm', 'a4')
  const pw = doc.internal.pageSize.getWidth()
  const ph = doc.internal.pageSize.getHeight()
  const LM = 18
  const RM = 18
  const CW = pw - LM - RM
  let y = 15

  const s = content.summary
  const rows = content.rows
  const breakdown = content.breakdown || []

  // ── Helper: draw header bar ─────────────────────────────────────────
  function drawHeaderBar() {
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, pw, 22, 'F')
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)
    doc.text('PUNTO PARK U', LM, 13)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(200, 210, 220)
    doc.text('NIT: 901.123.456-7  ·  Parqueadero autorizado  ·  Resolución 4100 de 2004', LM, 19)
  }

  // ── Helper: KPI cards ───────────────────────────────────────────────
  function drawKPICards() {
    const cardW = CW / 4
    const cardH = 18
    const startY = y

    const kpis = [
      { value: `$${s.totalIngresos.toLocaleString('es-CO')}`, label: 'Ingresos Totales' },
      { value: String(s.totalVehiculos), label: 'Vehículos' },
      { value: `${s.tasaOcupacion}%`, label: 'Ocupación' },
      { value: `$${s.ticketPromedio.toLocaleString('es-CO')}`, label: 'Ticket Promedio' },
    ]

    kpis.forEach((kpi, i) => {
      const x = LM + i * cardW
      doc.setFillColor(...LIGHT_BLUE)
      doc.rect(x, startY, cardW - 2, cardH, 'F')
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...NAVY)
      doc.text(kpi.value, x + cardW / 2 - 1, startY + 9, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...DARK_GRAY)
      doc.text(kpi.label, x + cardW / 2 - 1, startY + 15, { align: 'center' })
    })

    y = startY + cardH + 6
  }

  // ── Helper: section title ───────────────────────────────────────────
  function sectionTitle(text: string) {
    if (y > 250) {
      doc.addPage()
      y = 15
      drawHeaderBar()
      y = 28
    }
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NAVY)
    doc.text(text, LM, y)
    y += 6
  }

  // ── Helper: footer ──────────────────────────────────────────────────
  function drawFooter(pageNum: number, totalPages: number) {
    doc.setFillColor(...LIGHT_BLUE)
    doc.rect(0, ph - 12, pw, 12, 'F')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120)
    doc.text(`Documento generado por Panel Administrador — Punto Park U  ·  ${content.meta.generatedAt}`, LM, ph - 5)
    doc.text('Este reporte cumple con los requisitos de la Resolución 4100 de 2004', LM, ph - 2)
    doc.text(`Página ${pageNum} de ${totalPages}`, pw - RM, ph - 5, { align: 'right' })
  }

  // ════════════════════════════════════════════════════════════════════
  // PAGE 1: Summary + Breakdown + Payments
  // ════════════════════════════════════════════════════════════════════
  drawHeaderBar()
  y = 28

  // Title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text(content.meta.title, LM, y)
  y += 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK_GRAY)
  doc.text(`Período: ${content.meta.period}`, LM, y)
  doc.text(`Generado: ${content.meta.generatedAt}`, pw - RM, y, { align: 'right' })
  y += 8

  // KPI Cards
  drawKPICards()

  // Vehicle Breakdown
  sectionTitle('INGRESOS POR TIPO DE VEHÍCULO')
  const brkTotal = breakdown.reduce((acc, b) => acc + b.ingresos, 0)
  const brkCount = breakdown.reduce((acc, b) => acc + b.cantidad, 0)
  doc.autoTable({
    startY: y,
    head: [['Tipo', 'Vehículos', 'Ingresos', '%', 'Ticket Prom.']],
    body: breakdown.map((b) => [
      b.tipo,
      String(b.cantidad),
      `$${b.ingresos.toLocaleString('es-CO')}`,
      `${brkTotal > 0 ? ((b.ingresos / brkTotal) * 100).toFixed(1) : 0}%`,
      `$${b.cantidad > 0 ? Math.round(b.ingresos / b.cantidad).toLocaleString('es-CO') : 0}`,
    ]),
    foot: [['TOTAL', String(brkCount), `$${brkTotal.toLocaleString('es-CO')}`, '100%', `$${brkCount > 0 ? Math.round(brkTotal / brkCount).toLocaleString('es-CO') : 0}`]],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    footStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: GRAY },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: LM, right: RM },
    tableWidth: CW,
    styles: { cellPadding: 2 },
  })
  y = doc.lastAutoTable.finalY + 10

  // Payment Methods
  sectionTitle('ANÁLISIS POR MÉTODO DE PAGO')
  const pmt: Record<string, { count: number; total: number }> = {}
  rows.forEach((r) => {
    if (!pmt[r.pago]) pmt[r.pago] = { count: 0, total: 0 }
    pmt[r.pago].count++
    pmt[r.pago].total += parseTarifa(r.tarifa)
  })
  const pmtKeys = Object.keys(pmt)
  const pmtTotalSum = pmtKeys.reduce((acc, k) => acc + pmt[k].total, 0)
  doc.autoTable({
    startY: y,
    head: [['Método de Pago', 'Transacciones', 'Ingresos', '% del Total']],
    body: pmtKeys.map((k) => [
      k,
      String(pmt[k].count),
      `$${pmt[k].total.toLocaleString('es-CO')}`,
      `${pmtTotalSum > 0 ? ((pmt[k].total / pmtTotalSum) * 100).toFixed(1) : 0}%`,
    ]),
    foot: pmtKeys.length > 0
      ? [['TOTAL', String(rows.length), `$${pmtTotalSum.toLocaleString('es-CO')}`, '100%']]
      : [],
    theme: 'grid',
    headStyles: { fillColor: BLUE, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    footStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: GRAY },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 40, fontStyle: 'bold', textColor: GREEN },
      3: { halign: 'center', cellWidth: 30 },
    },
    margin: { left: LM, right: RM },
    tableWidth: CW,
    styles: { cellPadding: 2 },
  })
  y = doc.lastAutoTable.finalY + 10

  // ════════════════════════════════════════════════════════════════════
  // PAGE 2: Transaction Records
  // ════════════════════════════════════════════════════════════════════
  doc.addPage()
  drawHeaderBar()
  y = 28

  sectionTitle('REGISTRO DE VEHÍCULOS')
  doc.autoTable({
    startY: y,
    head: [['Placa', 'Tipo', 'Entrada', 'Salida', 'Duración', 'Tarifa', 'Pago', 'Conductor']],
    body: rows.map((r) => [r.placa, r.tipo, r.ingreso, r.salida, r.duracion, r.tarifa, r.pago, r.conductor]),
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: GRAY },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 25, fontStyle: 'bold', textColor: GREEN },
      6: { cellWidth: 22 },
      7: { cellWidth: 30 },
    },
    margin: { left: LM, right: RM },
    tableWidth: CW,
    styles: { cellPadding: 2, fontSize: 8 },
    didDrawPage: (data: any) => {
      // Header repeats on each page
      if (data.pageCount > 1) {
        drawHeaderBar()
      }
    },
  })
  y = doc.lastAutoTable.finalY + 15

  // Signature
  if (y > 220) {
    doc.addPage()
    drawHeaderBar()
    y = 28
  }

  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.5)
  doc.line(LM, y, pw - RM, y)
  y += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK_GRAY)
  doc.text('Autorizado por:', LM, y)
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text('Nombre: _____________________________________________', LM, y)
  y += 8
  doc.text('Firma:  _____________________________________________', LM, y)
  y += 8
  doc.text('C.C.:   _____________________________________________', LM, y)

  // Page numbers and footer
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooter(i, totalPages)
  }

  doc.save(`PuntoParkU_reporte_${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function PDFExporter({ content, disabled = false }: PDFExporterProps) {
  const handleExport = async () => {
    try {
      await generatePDF(content)
      showSuccessToast('PDF descargado correctamente')
    } catch (err) {
      console.error('PDF export error:', err)
      showErrorToast('Error al descargar el PDF')
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={disabled}>
      <span className="material-symbols-outlined text-base">picture_as_pdf</span>
      Exportar PDF
    </Button>
  )
}

import React from 'react'
import { Button } from '@/components/ui'
import { showSuccessToast, showErrorToast } from '@/utils/errorHandler'
import type { ReportContent } from '@/types'

interface PDFExporterProps {
  content: ReportContent
  disabled?: boolean
}

type RGB = [number, number, number]

/**
 * Export the current report as a professional PDF using jsPDF + jspdf-autotable.
 * Matches the vanilla Punto Park U PDF format.
 */
async function generatePDF(content: ReportContent): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const { applyPlugin } = await import('jspdf-autotable')
  applyPlugin(jsPDF)

  const doc: any = new jsPDF('p', 'mm', 'a4')
  const pw = doc.internal.pageSize.getWidth()
  const LM = 18
  const RM = 18
  const CW = pw - LM - RM
  const BOTTOM_LIMIT = 280
  const cDark: RGB = [30, 58, 95]
  const cMid: RGB = [42, 82, 152]
  const cGreen: RGB = [10, 102, 32]
  const cGray: RGB = [90, 90, 90]
  const cWhite: RGB = [255, 255, 255]
  const cZebra1: RGB = [232, 244, 253]
  const cZebra2: RGB = [248, 249, 250]
  let y = LM

  function needSpace(mm: number) {
    if (y + mm > BOTTOM_LIMIT) {
      doc.addPage()
      y = LM
    }
  }

  function sectionTitle(text: string) {
    needSpace(16)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...cDark)
    doc.text(text, LM, y)
    y += 8
  }

  function divider() {
    doc.setDrawColor(...cDark)
    doc.setLineWidth(0.6)
    doc.line(LM, y, pw - RM, y)
    y += 6
  }

  const s = content.summary
  const title = content.meta.title

  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...cDark)
  doc.text('Punto Park U', LM, y + 3)
  y += 9
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(125)
  doc.text('NIT: 901.123.456-7  ·  Parqueadero autorizado  ·  Resolución 4100 de 2004', LM, y)
  y += 5
  divider()

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...cDark)
  doc.text(title, LM, y)
  y += 7
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...cGray)
  doc.text(`Período: ${content.meta.period}`, LM, y)
  doc.text(`Generado: ${content.meta.generatedAt}`, pw - RM, y, { align: 'right' })
  y += 5
  doc.text(`Administrador: ${content.meta.subtitle}`, LM, y)
  y += 10

  // Summary
  sectionTitle('RESUMEN DEL PERÍODO')
  doc.autoTable({
    startY: y,
    head: [['Indicador', 'Valor']],
    body: [
      ['Ingresos totales', `$${s.totalIngresos.toLocaleString('es-CO')}`],
      ['Vehículos atendidos', String(s.totalVehiculos)],
      ['Tasa de ocupación', `${s.tasaOcupacion}%`],
      ['Ticket promedio', `$${s.ticketPromedio.toLocaleString('es-CO')}`],
      ['Tiempo promedio estadía', s.tiempoPromedio],
      ['Ingreso promedio / hora', `$${s.ingresosPorHora.toLocaleString('es-CO')}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: cDark, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    alternateRowStyles: { fillColor: cZebra1 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right', cellWidth: 50, fontStyle: 'bold', textColor: cGreen },
    },
    margin: { left: LM, right: RM },
    tableWidth: CW,
    styles: { cellPadding: 3 },
  })
  y = doc.lastAutoTable.finalY + 12

  // Breakdown by type
  sectionTitle('INGRESOS POR TIPO DE VEHÍCULO')
  const brkTotal = content.breakdown.reduce((acc, b) => acc + b.ingresos, 0)
  const brkCount = content.breakdown.reduce((acc, b) => acc + b.cantidad, 0)
  doc.autoTable({
    startY: y,
    head: [['Tipo', 'Vehículos', 'Ingresos', '%']],
    body: content.breakdown.map((b) => [
      b.tipo,
      String(b.cantidad),
      `$${b.ingresos.toLocaleString('es-CO')}`,
      `${brkTotal > 0 ? ((b.ingresos / brkTotal) * 100).toFixed(0) : 0}%`,
    ]),
    foot: [['TOTAL', String(brkCount), `$${brkTotal.toLocaleString('es-CO')}`, '100%']],
    theme: 'grid',
    headStyles: { fillColor: cMid, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    footStyles: { fillColor: cDark, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: cZebra2 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'right', cellWidth: 38 },
      3: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: LM, right: RM },
    tableWidth: CW,
    styles: { cellPadding: 3 },
  })
  y = doc.lastAutoTable.finalY + 12

  // Payment method totals
  sectionTitle('TOTALES POR MÉTODO DE PAGO')
  const pmt: Record<string, { count: number; total: number }> = {}
  content.rows.forEach((r) => {
    if (!pmt[r.pago]) pmt[r.pago] = { count: 0, total: 0 }
    pmt[r.pago].count++
    pmt[r.pago].total += parseInt(String(r.tarifa).replace(/[$.]/g, '')) || 0
  })
  const pmtKeys = Object.keys(pmt)
  const pmtTotalSum = pmtKeys.reduce((acc, k) => acc + pmt[k].total, 0)
  doc.autoTable({
    startY: y,
    head: [['Método de Pago', 'Cantidad', 'Total']],
    body: pmtKeys.map((k) => [k, String(pmt[k].count), `$${pmt[k].total.toLocaleString('es-CO')}`]),
    foot: pmtKeys.length > 0
      ? [['TOTAL', String(content.rows.length), `$${pmtTotalSum.toLocaleString('es-CO')}`]]
      : [],
    theme: 'grid',
    headStyles: { fillColor: cMid, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    footStyles: { fillColor: cDark, textColor: cWhite, fontStyle: 'bold', fontSize: 10 },
    alternateRowStyles: { fillColor: cZebra2 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'center', cellWidth: 28 },
      2: { halign: 'right', cellWidth: 38, fontStyle: 'bold', textColor: cGreen },
    },
    margin: { left: LM, right: RM },
    tableWidth: CW,
    styles: { cellPadding: 3 },
  })
  y = doc.lastAutoTable.finalY + 12

  // Vehicle records
  sectionTitle('REGISTRO DE VEHÍCULOS')
  doc.autoTable({
    startY: y,
    head: [['Placa', 'Tipo', 'Ingreso', 'Salida', 'Duración', 'Tarifa', 'Pago', 'Conductor']],
    body: content.rows.map((r) => [r.placa, r.tipo, r.ingreso, r.salida, r.duracion, r.tarifa, r.pago, r.conductor]),
    theme: 'grid',
    headStyles: { fillColor: cDark, textColor: cWhite, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: cZebra2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 18 },
      1: { cellWidth: 16 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'right', cellWidth: 20, fontStyle: 'bold', textColor: cGreen },
      6: { cellWidth: 20 },
      7: { cellWidth: 20 },
    },
    margin: { left: LM, right: RM },
    tableWidth: CW,
    styles: { cellPadding: 2, fontSize: 8 },
  })
  y = Math.max(doc.lastAutoTable.finalY + 12, y + 4)

  // Signature
  needSpace(55)
  divider()
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...cGray)
  doc.text('Autorizado por:', LM, y)
  y += 9
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...cDark)
  doc.text('Nombre: _____________________________________________', LM, y)
  y += 8
  doc.text('Firma:  _____________________________________________', LM, y)
  y += 8
  doc.text('C.C.:   _____________________________________________', LM, y)
  y += 14

  // Footer line
  needSpace(18)
  doc.setDrawColor(190)
  doc.setLineWidth(0.3)
  doc.line(LM, y, pw - RM, y)
  y += 5
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(155)
  doc.text(
    `Documento generado por Panel Administrador — Punto Park U  ·  ${content.meta.generatedAt}`,
    LM,
    y
  )
  y += 3
  doc.text(
    'Este reporte cumple con los requisitos de la Resolución 4100 de 2004 y normativa colombiana de parqueaderos.',
    LM,
    y
  )

  // Page numbers
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(185)
    doc.text(`Página ${i} de ${totalPages}`, pw - RM, 293, { align: 'right' })
    doc.text('Punto Park U · Panel Administrador', LM, 293)
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

import React from 'react'
import { Button } from '@/components/ui'
import { showSuccessToast, showErrorToast } from '@/utils/errorHandler'
import type { ReportContent } from '@/types'

interface ExcelExporterProps {
  content: ReportContent
  disabled?: boolean
}

const NAVY = '1B3A5C'
const BLUE = '2E75B6'
const LIGHT_BLUE = 'D6E4F0'
const WHITE = 'FFFFFF'
const GRAY = 'F2F2F2'
const DARK_GRAY = '404040'

function formatMoney(n: number): string {
  return `$${n.toLocaleString('es-CO')}`
}

function parseTarifa(tarifa: string): number {
  return parseInt(String(tarifa).replace(/[$.]/g, '')) || 0
}

function getHourFromTime(timeStr: string): number {
  const match = timeStr.match(/(\d+):/)
  return match ? parseInt(match[1]) : 0
}

function durationToMinutes(duracion: string): number {
  const hMatch = duracion.match(/(\d+)h/)
  const mMatch = duracion.match(/(\d+)min/)
  return (hMatch ? parseInt(hMatch[1]) * 60 : 0) + (mMatch ? parseInt(mMatch[1]) : 0)
}

async function generateExcel(content: ReportContent): Promise<void> {
  const XLSX = await import('xlsx-js-style')
  const s = content.summary
  const rows = content.rows
  const breakdown = content.breakdown || []

  // ── Pre-calculations ────────────────────────────────────────────────
  const paymentStats: Record<string, { count: number; total: number }> = {}
  rows.forEach((r) => {
    if (!paymentStats[r.pago]) paymentStats[r.pago] = { count: 0, total: 0 }
    paymentStats[r.pago].count++
    paymentStats[r.pago].total += parseTarifa(r.tarifa)
  })
  const paymentTotalSum = Object.values(paymentStats).reduce((a, b) => a + b.total, 0)

  const hourlyBands = [
    { label: '06:00 - 09:00', min: 6, max: 9 },
    { label: '09:00 - 12:00', min: 9, max: 12 },
    { label: '12:00 - 15:00', min: 12, max: 15 },
    { label: '15:00 - 18:00', min: 15, max: 18 },
    { label: '18:00 - 21:00', min: 18, max: 21 },
  ]
  const bandStats = hourlyBands.map((band) => {
    const bandRows = rows.filter((r) => {
      const h = getHourFromTime(r.ingreso)
      return h >= band.min && h < band.max
    })
    const count = bandRows.length
    const total = bandRows.reduce((sum, r) => sum + parseTarifa(r.tarifa), 0)
    return { ...band, count, total, avg: count > 0 ? Math.round(total / count) : 0 }
  })

  // ── Styles ──────────────────────────────────────────────────────────
  const thinBorder = {
    top: { style: 'thin', color: { rgb: LIGHT_BLUE } },
    bottom: { style: 'thin', color: { rgb: LIGHT_BLUE } },
    left: { style: 'thin', color: { rgb: LIGHT_BLUE } },
    right: { style: 'thin', color: { rgb: LIGHT_BLUE } },
  }

  const headerStyle = {
    font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Arial' },
    fill: { fgColor: { rgb: NAVY } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  }

  const kpiValueStyle = {
    font: { bold: true, sz: 14, color: { rgb: NAVY }, name: 'Arial' },
    fill: { fgColor: { rgb: LIGHT_BLUE } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  }

  const kpiLabelStyle = {
    font: { sz: 8, color: { rgb: DARK_GRAY }, name: 'Arial' },
    fill: { fgColor: { rgb: LIGHT_BLUE } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  }

  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: WHITE }, name: 'Arial' },
    fill: { fgColor: { rgb: NAVY } },
    alignment: { horizontal: 'left', vertical: 'center' },
  }

  const subtitleStyle = {
    font: { sz: 9, color: { rgb: LIGHT_BLUE }, name: 'Arial' },
    fill: { fgColor: { rgb: NAVY } },
    alignment: { horizontal: 'left', vertical: 'center' },
  }

  function styleRange(ws: any, r1: number, c1: number, r2: number, c2: number, style: any) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const ref = XLSX.utils.encode_cell({ r, c })
        if (!ws[ref]) ws[ref] = { t: 's', v: '' }
        ws[ref].s = style
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 1: DASHBOARD
  // ═══════════════════════════════════════════════════════════════════
  const dashData = [
    ['PUNTO PARK U', '', '', '', '', '', '', ''],
    ['NIT: 901.123.456-7  ·  Parqueadero autorizado  ·  Resolución 4100 de 2004', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    [formatMoney(s.totalIngresos), String(s.totalVehiculos), formatMoney(s.ticketPromedio), `${s.tasaOcupacion}%`, '', '', '', ''],
    ['Ingresos Totales', 'Vehículos Atendidos', 'Ticket Promedio', 'Tasa Ocupación', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    [formatMoney(s.ingresosPorHora), s.tiempoPromedio, 'ePayco', 'Automóvil', '', '', '', ''],
    ['Ingreso/Hora', 'Tiempo Promedio', 'Método Principal', 'Vehículo Top', '', '', '', ''],
  ]
  const dashMerges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } },
    { s: { r: 3, c: 6 }, e: { r: 3, c: 7 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
    { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
    { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } },
    { s: { r: 6, c: 2 }, e: { r: 6, c: 3 } },
    { s: { r: 6, c: 4 }, e: { r: 6, c: 5 } },
    { s: { r: 6, c: 6 }, e: { r: 6, c: 7 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } },
    { s: { r: 7, c: 2 }, e: { r: 7, c: 3 } },
    { s: { r: 7, c: 4 }, e: { r: 7, c: 5 } },
    { s: { r: 7, c: 6 }, e: { r: 7, c: 7 } },
  ]
  const dashWs = XLSX.utils.aoa_to_sheet(dashData)
  dashWs['!merges'] = dashMerges
  dashWs['!cols'] = Array(8).fill({ wch: 15 })
  styleRange(dashWs, 0, 0, 1, 7, { font: { sz: 9, color: { rgb: LIGHT_BLUE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } } })
  dashWs['A1'].s = titleStyle
  dashWs['A2'].s = subtitleStyle
  for (let c = 0; c < 8; c += 2) {
    styleRange(dashWs, 3, c, 3, c + 1, kpiValueStyle)
    styleRange(dashWs, 4, c, 4, c + 1, kpiLabelStyle)
    styleRange(dashWs, 6, c, 6, c + 1, kpiValueStyle)
    styleRange(dashWs, 7, c, 7, c + 1, kpiLabelStyle)
  }

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 2: VEHICULOS
  // ═══════════════════════════════════════════════════════════════════
  const vehTotalIngresos = breakdown.reduce((a, b) => a + b.ingresos, 0)
  const vehTotalCount = breakdown.reduce((a, b) => a + b.cantidad, 0)
  const vehData = [
    ['DESGLOSE POR TIPO DE VEHÍCULO', '', '', '', ''],
    ['Tipo Vehículo', 'Cantidad', 'Ingresos', '% del Total', 'Ticket Promedio'],
    ...breakdown.map((b) => [
      b.tipo,
      b.cantidad,
      b.ingresos,
      `${vehTotalIngresos > 0 ? ((b.ingresos / vehTotalIngresos) * 100).toFixed(1) : 0}%`,
      b.cantidad > 0 ? Math.round(b.ingresos / b.cantidad) : 0,
    ]),
    ['TOTAL', vehTotalCount, vehTotalIngresos, '100%', vehTotalCount > 0 ? Math.round(vehTotalIngresos / vehTotalCount) : 0],
  ]
  const vehWs = XLSX.utils.aoa_to_sheet(vehData)
  vehWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
  vehWs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }]
  styleRange(vehWs, 0, 0, 0, 4, { font: { bold: true, sz: 12, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'left', vertical: 'center' } })
  styleRange(vehWs, 1, 0, 1, 4, headerStyle)
  breakdown.forEach((_, i) => {
    const bg = i % 2 === 0 ? WHITE : GRAY
    styleRange(vehWs, 2 + i, 0, 2 + i, 4, { font: { sz: 10, name: 'Arial' }, fill: { fgColor: { rgb: bg } }, alignment: { vertical: 'center' }, border: thinBorder })
  })
  styleRange(vehWs, 2 + breakdown.length, 0, 2 + breakdown.length, 4, { font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder })

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 3: TRANSACCIONES
  // ═══════════════════════════════════════════════════════════════════
  const transData = [
    ['DETALLE DE TRANSACCIONES', '', '', '', '', '', '', ''],
    ['Placa', 'Tipo', 'Entrada', 'Salida', 'Duración (min)', 'Tarifa', 'Método Pago', 'Conductor'],
    ...rows.map((r) => [
      r.placa, r.tipo, r.ingreso, r.salida, durationToMinutes(r.duracion), parseTarifa(r.tarifa), r.pago, r.conductor,
    ]),
    ['TOTAL', '', '', '', rows.reduce((sum, r) => sum + durationToMinutes(r.duracion), 0), rows.reduce((sum, r) => sum + parseTarifa(r.tarifa), 0), '', ''],
  ]
  const transWs = XLSX.utils.aoa_to_sheet(transData)
  transWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]
  transWs['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 18 }]
  styleRange(transWs, 0, 0, 0, 7, { font: { bold: true, sz: 12, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'left', vertical: 'center' } })
  styleRange(transWs, 1, 0, 1, 7, headerStyle)
  rows.forEach((_, i) => {
    const bg = i % 2 === 0 ? WHITE : GRAY
    styleRange(transWs, 2 + i, 0, 2 + i, 7, { font: { sz: 10, name: 'Arial' }, fill: { fgColor: { rgb: bg } }, alignment: { vertical: 'center' }, border: thinBorder })
  })
  styleRange(transWs, 2 + rows.length, 0, 2 + rows.length, 7, { font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder })

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 4: METODO DE PAGO
  // ═══════════════════════════════════════════════════════════════════
  const pmtData = [
    ['ANÁLISIS POR MÉTODO DE PAGO', '', '', ''],
    ['Método de Pago', 'Transacciones', 'Ingresos', '% del Total'],
    ...Object.entries(paymentStats).map(([method, stats]) => [
      method,
      stats.count,
      stats.total,
      `${paymentTotalSum > 0 ? ((stats.total / paymentTotalSum) * 100).toFixed(1) : 0}%`,
    ]),
    ['TOTAL', rows.length, paymentTotalSum, '100%'],
  ]
  const pmtWs = XLSX.utils.aoa_to_sheet(pmtData)
  pmtWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
  pmtWs['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 15 }, { wch: 12 }]
  styleRange(pmtWs, 0, 0, 0, 3, { font: { bold: true, sz: 12, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'left', vertical: 'center' } })
  styleRange(pmtWs, 1, 0, 1, 3, headerStyle)
  Object.keys(paymentStats).forEach((_, i) => {
    const bg = i % 2 === 0 ? WHITE : GRAY
    styleRange(pmtWs, 2 + i, 0, 2 + i, 3, { font: { sz: 10, name: 'Arial' }, fill: { fgColor: { rgb: bg } }, alignment: { vertical: 'center' }, border: thinBorder })
  })
  styleRange(pmtWs, 2 + Object.keys(paymentStats).length, 0, 2 + Object.keys(paymentStats).length, 3, { font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder })

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 5: ANALISIS HORARIO
  // ═══════════════════════════════════════════════════════════════════
  const horData = [
    ['ANÁLISIS POR FRANJA HORARIA', '', '', ''],
    ['Franja Horaria', 'Vehículos', 'Ingresos', 'Ticket Promedio'],
    ...bandStats.map((b) => [b.label, b.count, b.total, b.avg]),
  ]
  const horWs = XLSX.utils.aoa_to_sheet(horData)
  horWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
  horWs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }]
  styleRange(horWs, 0, 0, 0, 3, { font: { bold: true, sz: 12, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'left', vertical: 'center' } })
  styleRange(horWs, 1, 0, 1, 3, headerStyle)
  bandStats.forEach((_, i) => {
    const bg = i % 2 === 0 ? WHITE : GRAY
    styleRange(horWs, 2 + i, 0, 2 + i, 3, { font: { sz: 10, name: 'Arial' }, fill: { fgColor: { rgb: bg } }, alignment: { vertical: 'center' }, border: thinBorder })
  })

  // ═══════════════════════════════════════════════════════════════════
  // CREATE WORKBOOK
  // ═══════════════════════════════════════════════════════════════════
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, dashWs, 'Dashboard')
  XLSX.utils.book_append_sheet(wb, vehWs, 'Vehiculos')
  XLSX.utils.book_append_sheet(wb, transWs, 'Transacciones')
  XLSX.utils.book_append_sheet(wb, pmtWs, 'Metodo de Pago')
  XLSX.utils.book_append_sheet(wb, horWs, 'Analisis Horario')
  XLSX.writeFile(wb, `PuntoParkU_reporte_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function ExcelExporter({ content, disabled = false }: ExcelExporterProps) {
  const handleExport = async () => {
    try {
      await generateExcel(content)
      showSuccessToast('Excel descargado correctamente')
    } catch (err) {
      console.error('Excel export error:', err)
      showErrorToast('Error al descargar el Excel')
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport} disabled={disabled}>
      <span className="material-symbols-outlined text-base">table_chart</span>
      Exportar Excel
    </Button>
  )
}

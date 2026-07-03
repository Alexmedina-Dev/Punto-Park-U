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
const GREEN = '0A6620'
const LIGHT_GREEN = 'E8F5E9'
const GOLD = 'F5A623'
const LIGHT_GOLD = 'FFF8E1'
const RED_LIGHT = 'FFEBEE'

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
  const now = new Date()

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

  // Top payment method
  const topPayment = Object.entries(paymentStats).sort((a, b) => b[1].total - a[1].total)[0]
  const topPaymentName = topPayment ? topPayment[0] : 'N/A'
  // Top vehicle type
  const topVehicle = breakdown.sort((a, b) => b.ingresos - a.ingresos)[0]
  const topVehicleName = topVehicle ? topVehicle.tipo : 'N/A'
  // Peak hour
  const peakBand = bandStats.sort((a, b) => b.total - a.total)[0]
  const peakHourLabel = peakBand ? peakBand.label : 'N/A'

  // ── Styles ──────────────────────────────────────────────────────────
  const thinBorder = {
    top: { style: 'thin', color: { rgb: LIGHT_BLUE } },
    bottom: { style: 'thin', color: { rgb: LIGHT_BLUE } },
    left: { style: 'thin', color: { rgb: LIGHT_BLUE } },
    right: { style: 'thin', color: { rgb: LIGHT_BLUE } },
  }

  const thinBorderDark = {
    top: { style: 'thin', color: { rgb: NAVY } },
    bottom: { style: 'thin', color: { rgb: NAVY } },
    left: { style: 'thin', color: { rgb: NAVY } },
    right: { style: 'thin', color: { rgb: NAVY } },
  }

  const headerStyle = {
    font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Arial' },
    fill: { fgColor: { rgb: NAVY } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder,
  }

  const kpiValueStyle = {
    font: { bold: true, sz: 16, color: { rgb: NAVY }, name: 'Arial' },
    fill: { fgColor: { rgb: LIGHT_BLUE } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorderDark,
  }

  const kpiLabelStyle = {
    font: { sz: 9, color: { rgb: DARK_GRAY }, name: 'Arial' },
    fill: { fgColor: { rgb: LIGHT_BLUE } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorderDark,
  }

  const titleStyle = {
    font: { bold: true, sz: 18, color: { rgb: WHITE }, name: 'Arial' },
    fill: { fgColor: { rgb: NAVY } },
    alignment: { horizontal: 'left', vertical: 'center' },
  }

  const subtitleStyle = {
    font: { sz: 9, color: { rgb: LIGHT_BLUE }, name: 'Arial' },
    fill: { fgColor: { rgb: NAVY } },
    alignment: { horizontal: 'left', vertical: 'center' },
  }

  const moneyStyle = {
    font: { sz: 10, name: 'Arial' },
    numFmt: '$#,##0',
    alignment: { horizontal: 'right', vertical: 'center' },
    border: thinBorder,
  }

  const moneyStyleGreen = {
    font: { sz: 10, name: 'Arial', bold: true, color: { rgb: GREEN } },
    numFmt: '$#,##0',
    alignment: { horizontal: 'right', vertical: 'center' },
    border: thinBorder,
  }

  const pctStyle = {
    font: { sz: 10, name: 'Arial' },
    numFmt: '0.0%',
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  }

  const intStyle = {
    font: { sz: 10, name: 'Arial' },
    numFmt: '#,##0',
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  }

  const textStyle = {
    font: { sz: 10, name: 'Arial' },
    alignment: { vertical: 'center' },
    border: thinBorder,
  }

  const textStyleBold = {
    font: { sz: 10, name: 'Arial', bold: true },
    alignment: { vertical: 'center' },
    border: thinBorder,
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

  function setRowHeight(ws: any, row: number, height: number) {
    if (!ws['!rows']) ws['!rows'] = []
    ws['!rows'][row] = { hpt: height }
  }

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 1: RESUMEN EJECUTIVO
  // ═══════════════════════════════════════════════════════════════════
  const execData = [
    ['PUNTO PARK U', '', '', '', '', '', '', ''],
    ['NIT: 901.123.456-7  ·  Parqueadero autorizado  ·  Resolución 4100 de 2004', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['RESUMEN EJECUTIVO', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['Período del Reporte:', content.meta.period, '', '', `Generado: ${now.toLocaleDateString('es-CO')}`, '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['INDICADOR', 'VALOR', '', '', 'INDICADOR', 'VALOR', '', ''],
    ['Ingresos Totales', s.totalIngresos, '', '', 'Vehículos Atendidos', s.totalVehiculos, '', ''],
    ['Ticket Promedio', s.ticketPromedio, '', '', 'Tasa de Ocupación', s.tasaOcupacion / 100, '', ''],
    ['Ingresos por Hora', s.ingresosPorHora, '', '', 'Tiempo Promedio', s.tiempoPromedio, '', ''],
    ['Método de Pago Top', topPaymentName, '', '', 'Vehículo Más Rentable', topVehicleName, '', ''],
    ['Franja Pico', peakHourLabel, '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['OBSERVACIONES', '', '', '', '', '', '', ''],
    ['1. El vehículo más rentable es ' + topVehicleName + ' con ' + formatMoney(topVehicle ? topVehicle.ingresos : 0) + ' en ingresos.', '', '', '', '', '', '', ''],
    ['2. El método de pago predominante es ' + topPaymentName + ' con ' + (topPayment ? topPayment[1].count : 0) + ' transacciones.', '', '', '', '', '', '', ''],
    ['3. La franja horaria con mayor movimiento es ' + peakHourLabel + '.', '', '', '', '', '', '', ''],
    ['4. El ticket promedio es ' + formatMoney(s.ticketPromedio) + ' por vehículo.', '', '', '', '', '', '', ''],
    ['5. Tiempo promedio de permanencia: ' + s.tiempoPromedio + '.', '', '', '', '', '', '', ''],
  ]
  const execMerges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
    { s: { r: 5, c: 4 }, e: { r: 5, c: 5 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } },
    { s: { r: 7, c: 4 }, e: { r: 7, c: 5 } },
    { s: { r: 14, c: 0 }, e: { r: 14, c: 7 } },
    { s: { r: 15, c: 0 }, e: { r: 15, c: 7 } },
    { s: { r: 16, c: 0 }, e: { r: 16, c: 7 } },
    { s: { r: 17, c: 0 }, e: { r: 17, c: 7 } },
    { s: { r: 18, c: 0 }, e: { r: 18, c: 7 } },
    { s: { r: 19, c: 0 }, e: { r: 19, c: 7 } },
  ]
  const execWs = XLSX.utils.aoa_to_sheet(execData)
  execWs['!merges'] = execMerges
  execWs['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 4 }, { wch: 4 }, { wch: 22 }, { wch: 18 }, { wch: 4 }, { wch: 4 }]
  setRowHeight(execWs, 0, 32)
  setRowHeight(execWs, 1, 18)
  setRowHeight(execWs, 3, 24)
  styleRange(execWs, 0, 0, 1, 7, { font: { sz: 9, color: { rgb: LIGHT_BLUE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } } })
  execWs['A1'].s = titleStyle
  execWs['A2'].s = subtitleStyle
  execWs['A4'].s = { font: { bold: true, sz: 14, color: { rgb: NAVY }, name: 'Arial' }, fill: { fgColor: { rgb: LIGHT_BLUE } }, alignment: { horizontal: 'left', vertical: 'center' }, border: thinBorderDark }
  styleRange(execWs, 4, 0, 4, 7, execWs['A4'].s)
  styleRange(execWs, 5, 0, 5, 1, { font: { sz: 9, color: { rgb: DARK_GRAY }, name: 'Arial', italic: true }, alignment: { vertical: 'center' } })
  styleRange(execWs, 5, 4, 5, 5, { font: { sz: 9, color: { rgb: DARK_GRAY }, name: 'Arial', italic: true }, alignment: { vertical: 'center' } })
  // KPI headers
  styleRange(execWs, 7, 0, 7, 1, headerStyle)
  styleRange(execWs, 7, 4, 7, 5, headerStyle)
  // KPI rows - Ingresos Totales (money)
  execWs['B9'].s = moneyStyleGreen; execWs['B9'].t = 'n'; execWs['B9'].v = s.totalIngresos
  execWs['A9'].s = textStyleBold
  // KPI rows - Ticket Promedio (money)
  execWs['B10'].s = moneyStyle; execWs['B10'].t = 'n'; execWs['B10'].v = s.ticketPromedio
  execWs['A10'].s = textStyleBold
  // KPI rows - Ingresos por Hora (money)
  execWs['B11'].s = moneyStyle; execWs['B11'].t = 'n'; execWs['B11'].v = s.ingresosPorHora
  execWs['A11'].s = textStyleBold
  // KPI rows - Top payment
  execWs['B12'].s = textStyleBold
  execWs['A12'].s = textStyleBold
  // KPI rows - Peak hour
  execWs['B13'].s = textStyleBold
  execWs['A13'].s = textStyleBold
  // Right side KPIs
  execWs['F9'].s = intStyle; execWs['F9'].t = 'n'; execWs['F9'].v = s.totalVehiculos
  execWs['E9'].s = textStyleBold
  execWs['F10'].s = pctStyle; execWs['F10'].t = 'n'; execWs['F10'].v = s.tasaOcupacion / 100
  execWs['E10'].s = textStyleBold
  execWs['F11'].s = textStyle
  execWs['E11'].s = textStyleBold
  execWs['F12'].s = textStyleBold
  execWs['E12'].s = textStyleBold
  // Observations
  execWs['A15'].s = { font: { bold: true, sz: 11, color: { rgb: NAVY }, name: 'Arial' }, fill: { fgColor: { rgb: LIGHT_GOLD } }, alignment: { horizontal: 'left', vertical: 'center' }, border: thinBorderDark }
  styleRange(execWs, 15, 0, 15, 7, execWs['A15'].s)
  for (let i = 15; i <= 19; i++) {
    styleRange(execWs, i, 0, i, 7, {
      font: { sz: 9, name: 'Arial', color: { rgb: DARK_GRAY } },
      fill: { fgColor: { rgb: i % 2 === 0 ? WHITE : GRAY } },
      alignment: { vertical: 'center', wrapText: true },
      border: thinBorder,
    })
  }

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 2: DASHBOARD (KPIs)
  // ═══════════════════════════════════════════════════════════════════
  const dashData = [
    ['PUNTO PARK U — DASHBOARD DE KPIs', '', '', '', '', '', '', ''],
    ['NIT: 901.123.456-7  ·  Parqueadero autorizado  ·  Resolución 4100 de 2004', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['MÉTRICAS PRINCIPALES', '', '', '', '', '', '', ''],
    [s.totalIngresos, s.totalVehiculos, s.ticketPromedio, s.tasaOcupacion / 100, '', '', '', ''],
    ['Ingresos Totales', 'Vehículos Atendidos', 'Ticket Promedio', 'Tasa Ocupación', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['MÉTRICAS SECUNDARIAS', '', '', '', '', '', '', ''],
    [s.ingresosPorHora, s.tiempoPromedio, topPaymentName, topVehicleName, '', '', '', ''],
    ['Ingreso/Hora', 'Tiempo Promedio', 'Método Principal', 'Vehículo Top', '', '', '', ''],
  ]
  const dashMerges = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } },
    { s: { r: 4, c: 4 }, e: { r: 4, c: 5 } },
    { s: { r: 4, c: 6 }, e: { r: 4, c: 7 } },
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } },
    { s: { r: 5, c: 2 }, e: { r: 5, c: 3 } },
    { s: { r: 5, c: 4 }, e: { r: 5, c: 5 } },
    { s: { r: 5, c: 6 }, e: { r: 5, c: 7 } },
    { s: { r: 7, c: 0 }, e: { r: 7, c: 7 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
    { s: { r: 8, c: 2 }, e: { r: 8, c: 3 } },
    { s: { r: 8, c: 4 }, e: { r: 8, c: 5 } },
    { s: { r: 8, c: 6 }, e: { r: 8, c: 7 } },
    { s: { r: 9, c: 0 }, e: { r: 9, c: 1 } },
    { s: { r: 9, c: 2 }, e: { r: 9, c: 3 } },
    { s: { r: 9, c: 4 }, e: { r: 9, c: 5 } },
    { s: { r: 9, c: 6 }, e: { r: 9, c: 7 } },
  ]
  const dashWs = XLSX.utils.aoa_to_sheet(dashData)
  dashWs['!merges'] = dashMerges
  dashWs['!cols'] = Array(8).fill({ wch: 15 })
  setRowHeight(dashWs, 0, 28)
  setRowHeight(dashWs, 1, 16)
  setRowHeight(dashWs, 3, 20)
  setRowHeight(dashWs, 7, 20)
  styleRange(dashWs, 0, 0, 1, 7, { font: { sz: 9, color: { rgb: LIGHT_BLUE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } } })
  dashWs['A1'].s = titleStyle
  dashWs['A2'].s = subtitleStyle
  styleRange(dashWs, 3, 0, 3, 7, { font: { bold: true, sz: 12, color: { rgb: NAVY }, name: 'Arial' }, fill: { fgColor: { rgb: LIGHT_BLUE } }, alignment: { horizontal: 'left', vertical: 'center' }, border: thinBorderDark })
  styleRange(dashWs, 7, 0, 7, 7, { font: { bold: true, sz: 12, color: { rgb: NAVY }, name: 'Arial' }, fill: { fgColor: { rgb: LIGHT_BLUE } }, alignment: { horizontal: 'left', vertical: 'center' }, border: thinBorderDark })
  // Main KPI values with proper number formatting
  for (let c = 0; c < 8; c += 2) {
    const cell = XLSX.utils.encode_cell({ r: 4, c })
    if (dashWs[cell]) {
      dashWs[cell].s = kpiValueStyle
      if (c === 0 || c === 2) { dashWs[cell].t = 'n'; dashWs[cell].numFmt = '$#,##0' }
      if (c === 4) { dashWs[cell].t = 'n'; dashWs[cell].numFmt = '$#,##0' }
      if (c === 6) { dashWs[cell].t = 'n'; dashWs[cell].numFmt = '0%' }
    }
    const labelCell = XLSX.utils.encode_cell({ r: 5, c })
    if (dashWs[labelCell]) dashWs[labelCell].s = kpiLabelStyle
  }
  // Secondary KPIs
  for (let c = 0; c < 8; c += 2) {
    const cell = XLSX.utils.encode_cell({ r: 8, c })
    if (dashWs[cell]) {
      dashWs[cell].s = kpiValueStyle
      if (c === 0) { dashWs[cell].t = 'n'; dashWs[cell].numFmt = '$#,##0' }
    }
    const labelCell = XLSX.utils.encode_cell({ r: 9, c })
    if (dashWs[labelCell]) dashWs[labelCell].s = kpiLabelStyle
  }

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 3: VEHICULOS
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
      vehTotalIngresos > 0 ? (b.ingresos / vehTotalIngresos) : 0,
      b.cantidad > 0 ? Math.round(b.ingresos / b.cantidad) : 0,
    ]),
    ['TOTAL', vehTotalCount, vehTotalIngresos, 1, vehTotalCount > 0 ? Math.round(vehTotalIngresos / vehTotalCount) : 0],
  ]
  const vehWs = XLSX.utils.aoa_to_sheet(vehData)
  vehWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
  vehWs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }]
  vehWs['!freeze'] = { xSplit: 0, ySplit: 2 }
  setRowHeight(vehWs, 0, 24)
  setRowHeight(vehWs, 1, 20)
  styleRange(vehWs, 0, 0, 0, 4, { font: { bold: true, sz: 12, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'left', vertical: 'center' } })
  styleRange(vehWs, 1, 0, 1, 4, headerStyle)
  breakdown.forEach((_, i) => {
    const row = 2 + i
    const bg = i % 2 === 0 ? WHITE : GRAY
    // Tipo
    const tipoRef = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (vehWs[tipoRef]) vehWs[tipoRef].s = { ...textStyleBold, fill: { fgColor: { rgb: bg } } }
    // Cantidad
    const cantRef = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (vehWs[cantRef]) { vehWs[cantRef].s = { ...intStyle, fill: { fgColor: { rgb: bg } } }; vehWs[cantRef].t = 'n' }
    // Ingresos
    const ingRef = XLSX.utils.encode_cell({ r: row, c: 2 })
    if (vehWs[ingRef]) { vehWs[ingRef].s = { ...moneyStyleGreen, fill: { fgColor: { rgb: bg } } }; vehWs[ingRef].t = 'n' }
    // %
    const pctRef = XLSX.utils.encode_cell({ r: row, c: 3 })
    if (vehWs[pctRef]) { vehWs[pctRef].s = { ...pctStyle, fill: { fgColor: { rgb: bg } } }; vehWs[pctRef].t = 'n' }
    // Ticket
    const tkRef = XLSX.utils.encode_cell({ r: row, c: 4 })
    if (vehWs[tkRef]) { vehWs[tkRef].s = { ...moneyStyle, fill: { fgColor: { rgb: bg } } }; vehWs[tkRef].t = 'n' }
  })
  // Total row
  const vehTotalRow = 2 + breakdown.length
  styleRange(vehWs, vehTotalRow, 0, vehTotalRow, 4, { font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorderDark })
  const vehTotalIngresosRef = XLSX.utils.encode_cell({ r: vehTotalRow, c: 2 })
  if (vehWs[vehTotalIngresosRef]) { vehWs[vehTotalIngresosRef].t = 'n'; vehWs[vehTotalIngresosRef].numFmt = '$#,##0' }
  const vehTotalPctRef = XLSX.utils.encode_cell({ r: vehTotalRow, c: 3 })
  if (vehWs[vehTotalPctRef]) { vehWs[vehTotalPctRef].t = 'n'; vehWs[vehTotalPctRef].numFmt = '0%' }
  const vehTotalTkRef = XLSX.utils.encode_cell({ r: vehTotalRow, c: 4 })
  if (vehWs[vehTotalTkRef]) { vehWs[vehTotalTkRef].t = 'n'; vehWs[vehTotalTkRef].numFmt = '$#,##0' }

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 4: TRANSACCIONES
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
  transWs['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }]
  transWs['!freeze'] = { xSplit: 0, ySplit: 2 }
  setRowHeight(transWs, 0, 24)
  setRowHeight(transWs, 1, 20)
  styleRange(transWs, 0, 0, 0, 7, { font: { bold: true, sz: 12, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'left', vertical: 'center' } })
  styleRange(transWs, 1, 0, 1, 7, headerStyle)
  rows.forEach((_, i) => {
    const row = 2 + i
    const bg = i % 2 === 0 ? WHITE : GRAY
    // Placa - bold
    const placaRef = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (transWs[placaRef]) transWs[placaRef].s = { ...textStyleBold, fill: { fgColor: { rgb: bg } } }
    // Tipo
    const tipoRef = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (transWs[tipoRef]) transWs[tipoRef].s = { ...textStyle, fill: { fgColor: { rgb: bg } } }
    // Entrada / Salida
    const entRef = XLSX.utils.encode_cell({ r: row, c: 2 })
    if (transWs[entRef]) transWs[entRef].s = { ...textStyle, fill: { fgColor: { rgb: bg } }, alignment: { horizontal: 'center', vertical: 'center' } }
    const salRef = XLSX.utils.encode_cell({ r: row, c: 3 })
    if (transWs[salRef]) transWs[salRef].s = { ...textStyle, fill: { fgColor: { rgb: bg } }, alignment: { horizontal: 'center', vertical: 'center' } }
    // Duracion (number)
    const durRef = XLSX.utils.encode_cell({ r: row, c: 4 })
    if (transWs[durRef]) { transWs[durRef].s = { ...intStyle, fill: { fgColor: { rgb: bg } } }; transWs[durRef].t = 'n' }
    // Tarifa (money)
    const tarRef = XLSX.utils.encode_cell({ r: row, c: 5 })
    if (transWs[tarRef]) { transWs[tarRef].s = { ...moneyStyleGreen, fill: { fgColor: { rgb: bg } } }; transWs[tarRef].t = 'n' }
    // Metodo
    const metRef = XLSX.utils.encode_cell({ r: row, c: 6 })
    if (transWs[metRef]) transWs[metRef].s = { ...textStyle, fill: { fgColor: { rgb: bg } } }
    // Conductor
    const conRef = XLSX.utils.encode_cell({ r: row, c: 7 })
    if (transWs[conRef]) transWs[conRef].s = { ...textStyle, fill: { fgColor: { rgb: bg } } }
  })
  // Total row
  const transTotalRow = 2 + rows.length
  styleRange(transWs, transTotalRow, 0, transTotalRow, 7, { font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorderDark })
  const transDurRef = XLSX.utils.encode_cell({ r: transTotalRow, c: 4 })
  if (transWs[transDurRef]) { transWs[transDurRef].t = 'n'; transWs[transDurRef].numFmt = '#,##0' }
  const transTarRef = XLSX.utils.encode_cell({ r: transTotalRow, c: 5 })
  if (transWs[transTarRef]) { transWs[transTarRef].t = 'n'; transWs[transTarRef].numFmt = '$#,##0' }

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 5: METODO DE PAGO
  // ═══════════════════════════════════════════════════════════════════
  const pmtData = [
    ['ANÁLISIS POR MÉTODO DE PAGO', '', '', ''],
    ['Método de Pago', 'Transacciones', 'Ingresos', '% del Total'],
    ...Object.entries(paymentStats).map(([method, stats]) => [
      method,
      stats.count,
      stats.total,
      paymentTotalSum > 0 ? (stats.total / paymentTotalSum) : 0,
    ]),
    ['TOTAL', rows.length, paymentTotalSum, 1],
  ]
  const pmtWs = XLSX.utils.aoa_to_sheet(pmtData)
  pmtWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
  pmtWs['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 15 }, { wch: 12 }]
  pmtWs['!freeze'] = { xSplit: 0, ySplit: 2 }
  setRowHeight(pmtWs, 0, 24)
  setRowHeight(pmtWs, 1, 20)
  styleRange(pmtWs, 0, 0, 0, 3, { font: { bold: true, sz: 12, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'left', vertical: 'center' } })
  styleRange(pmtWs, 1, 0, 1, 3, headerStyle)
  Object.keys(paymentStats).forEach((_, i) => {
    const row = 2 + i
    const bg = i % 2 === 0 ? WHITE : GRAY
    const methodRef = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (pmtWs[methodRef]) pmtWs[methodRef].s = { ...textStyleBold, fill: { fgColor: { rgb: bg } } }
    const countRef = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (pmtWs[countRef]) { pmtWs[countRef].s = { ...intStyle, fill: { fgColor: { rgb: bg } } }; pmtWs[countRef].t = 'n' }
    const totalRef = XLSX.utils.encode_cell({ r: row, c: 2 })
    if (pmtWs[totalRef]) { pmtWs[totalRef].s = { ...moneyStyleGreen, fill: { fgColor: { rgb: bg } } }; pmtWs[totalRef].t = 'n' }
    const pctRef = XLSX.utils.encode_cell({ r: row, c: 3 })
    if (pmtWs[pctRef]) { pmtWs[pctRef].s = { ...pctStyle, fill: { fgColor: { rgb: bg } } }; pmtWs[pctRef].t = 'n' }
  })
  const pmtTotalRow = 2 + Object.keys(paymentStats).length
  styleRange(pmtWs, pmtTotalRow, 0, pmtTotalRow, 3, { font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorderDark })
  const pmtTotalIngresos = XLSX.utils.encode_cell({ r: pmtTotalRow, c: 2 })
  if (pmtWs[pmtTotalIngresos]) { pmtWs[pmtTotalIngresos].t = 'n'; pmtWs[pmtTotalIngresos].numFmt = '$#,##0' }
  const pmtTotalPct = XLSX.utils.encode_cell({ r: pmtTotalRow, c: 3 })
  if (pmtWs[pmtTotalPct]) { pmtWs[pmtTotalPct].t = 'n'; pmtWs[pmtTotalPct].numFmt = '0%' }

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 6: ANALISIS HORARIO
  // ═══════════════════════════════════════════════════════════════════
  const horData = [
    ['ANÁLISIS POR FRANJA HORARIA', '', '', ''],
    ['Franja Horaria', 'Vehículos', 'Ingresos', 'Ticket Promedio'],
    ...bandStats.map((b) => [b.label, b.count, b.total, b.avg]),
  ]
  const horWs = XLSX.utils.aoa_to_sheet(horData)
  horWs['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
  horWs['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }]
  horWs['!freeze'] = { xSplit: 0, ySplit: 2 }
  setRowHeight(horWs, 0, 24)
  setRowHeight(horWs, 1, 20)
  styleRange(horWs, 0, 0, 0, 3, { font: { bold: true, sz: 12, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'left', vertical: 'center' } })
  styleRange(horWs, 1, 0, 1, 3, headerStyle)
  bandStats.forEach((b, i) => {
    const row = 2 + i
    const bg = i % 2 === 0 ? WHITE : GRAY
    const labelRef = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (horWs[labelRef]) horWs[labelRef].s = { ...textStyleBold, fill: { fgColor: { rgb: bg } } }
    const countRef = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (horWs[countRef]) { horWs[countRef].s = { ...intStyle, fill: { fgColor: { rgb: bg } } }; horWs[countRef].t = 'n' }
    const totalRef = XLSX.utils.encode_cell({ r: row, c: 2 })
    if (horWs[totalRef]) { horWs[totalRef].s = { ...moneyStyleGreen, fill: { fgColor: { rgb: bg } } }; horWs[totalRef].t = 'n' }
    const avgRef = XLSX.utils.encode_cell({ r: row, c: 3 })
    if (horWs[avgRef]) { horWs[avgRef].s = { ...moneyStyle, fill: { fgColor: { rgb: bg } } }; horWs[avgRef].t = 'n' }
  })
  // Total row for hourly analysis
  const horTotalVehicles = bandStats.reduce((a, b) => a + b.count, 0)
  const horTotalIngresos = bandStats.reduce((a, b) => a + b.total, 0)
  const horTotalRow = 2 + bandStats.length
  horData.push(['TOTAL', horTotalVehicles, horTotalIngresos, horTotalVehicles > 0 ? Math.round(horTotalIngresos / horTotalVehicles) : 0])
  // Re-create sheet with total row
  const horWs2 = XLSX.utils.aoa_to_sheet(horData)
  horWs2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]
  horWs2['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 15 }, { wch: 15 }]
  horWs2['!freeze'] = { xSplit: 0, ySplit: 2 }
  setRowHeight(horWs2, 0, 24)
  setRowHeight(horWs2, 1, 20)
  styleRange(horWs2, 0, 0, 0, 3, { font: { bold: true, sz: 12, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'left', vertical: 'center' } })
  styleRange(horWs2, 1, 0, 1, 3, headerStyle)
  bandStats.forEach((b, i) => {
    const row = 2 + i
    const bg = i % 2 === 0 ? WHITE : GRAY
    const labelRef = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (horWs2[labelRef]) horWs2[labelRef].s = { ...textStyleBold, fill: { fgColor: { rgb: bg } } }
    const countRef = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (horWs2[countRef]) { horWs2[countRef].s = { ...intStyle, fill: { fgColor: { rgb: bg } } }; horWs2[countRef].t = 'n' }
    const totalRef = XLSX.utils.encode_cell({ r: row, c: 2 })
    if (horWs2[totalRef]) { horWs2[totalRef].s = { ...moneyStyleGreen, fill: { fgColor: { rgb: bg } } }; horWs2[totalRef].t = 'n' }
    const avgRef = XLSX.utils.encode_cell({ r: row, c: 3 })
    if (horWs2[avgRef]) { horWs2[avgRef].s = { ...moneyStyle, fill: { fgColor: { rgb: bg } } }; horWs2[avgRef].t = 'n' }
  })
  styleRange(horWs2, horTotalRow, 0, horTotalRow, 3, { font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Arial' }, fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorderDark })
  const horTotalIngresosRef = XLSX.utils.encode_cell({ r: horTotalRow, c: 2 })
  if (horWs2[horTotalIngresosRef]) { horWs2[horTotalIngresosRef].t = 'n'; horWs2[horTotalIngresosRef].numFmt = '$#,##0' }
  const horTotalAvgRef = XLSX.utils.encode_cell({ r: horTotalRow, c: 3 })
  if (horWs2[horTotalAvgRef]) { horWs2[horTotalAvgRef].t = 'n'; horWs2[horTotalAvgRef].numFmt = '$#,##0' }

  // ═══════════════════════════════════════════════════════════════════
  // CREATE WORKBOOK
  // ═══════════════════════════════════════════════════════════════════
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, execWs, 'Resumen Ejecutivo')
  XLSX.utils.book_append_sheet(wb, dashWs, 'Dashboard')
  XLSX.utils.book_append_sheet(wb, vehWs, 'Vehiculos')
  XLSX.utils.book_append_sheet(wb, transWs, 'Transacciones')
  XLSX.utils.book_append_sheet(wb, pmtWs, 'Metodo de Pago')
  XLSX.utils.book_append_sheet(wb, horWs2, 'Analisis Horario')
  XLSX.writeFile(wb, `PuntoParkU_reporte_${now.toISOString().slice(0, 10)}.xlsx`)
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

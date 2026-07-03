import React from 'react'
import { Button } from '@/components/ui'
import { showSuccessToast, showErrorToast } from '@/utils/errorHandler'
import type { ReportContent } from '@/types'

interface ExcelExporterProps {
  content: ReportContent
  disabled?: boolean
}

// ── Color palette (matching reference Excel) ──────────────────────────
const NAVY = '1B3A5C'
const BLUE = '2E75B6'
const GRAY = 'F2F2F2'
const DARK_GRAY = '808080'
const ORANGE = 'ED7D31'
const GREEN = '70AD47'
const GOLD = 'FFC000'
const LIGHT_BLUE = 'D6E4F0'

// ── Tab colors ────────────────────────────────────────────────────────
const TAB_DASHBOARD = NAVY
const TAB_VEHICULOS = BLUE
const TAB_TRANSACCIONES = ORANGE
const TAB_METODO_PAGO = GREEN
const TAB_HORARIO = GOLD

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
  // ── Dynamic imports from xlsx-kit subpaths ──────────────────────────
  const { createWorkbook, addWorksheet } = await import('xlsx-kit/workbook')
  const { setCell, mergeCells, setRowHeight, setColumnWidth, setSheetTabColor } = await import('xlsx-kit/worksheet')
  const { setFormula } = await import('xlsx-kit/cell')
  const { makeFont, makeFill, makeColor, setCellStyle } = await import('xlsx-kit/styles')
  const { makeBarChart, makeBarSeries, makePieChart, makeChartSpace } = await import('xlsx-kit/chart')
  const { addChartAt } = await import('xlsx-kit/drawing')
  const { workbookToBytes } = await import('xlsx-kit/io')

  const s = content.summary
  const rows = content.rows
  const breakdown = content.breakdown || []
  const now = new Date()
  const periodLabel = content.meta.period || 'Reporte'

  // ── Pre-calculations ────────────────────────────────────────────────
  const paymentStats: Record<string, { count: number; total: number }> = {}
  rows.forEach((r) => {
    if (!paymentStats[r.pago]) paymentStats[r.pago] = { count: 0, total: 0 }
    paymentStats[r.pago].count++
    paymentStats[r.pago].total += parseTarifa(r.tarifa)
  })

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

  const topPayment = Object.entries(paymentStats).sort((a, b) => b[1].total - a[1].total)[0]
  const topPaymentName = topPayment ? topPayment[0] : 'N/A'
  const sortedBreakdown = [...breakdown].sort((a, b) => b.ingresos - a.ingresos)
  const topVehicleName = sortedBreakdown.length > 0 ? sortedBreakdown[0].tipo : 'N/A'

  // ── Style helpers ──────────────────────────────────────────────────
  const titleFont = makeFont({ bold: true, size: 16, color: { rgb: 'FFFFFF' }, name: 'Arial' })
  const titleFill = makeFill({ patternType: 'solid', fgColor: { rgb: NAVY } })

  const subtitleFont = makeFont({ size: 10, color: { rgb: DARK_GRAY }, name: 'Arial' })

  const sheetTitleFont = makeFont({ bold: true, size: 14, color: { rgb: 'FFFFFF' }, name: 'Arial' })

  const headerFont = makeFont({ bold: true, size: 10, color: { rgb: 'FFFFFF' }, name: 'Arial' })
  const headerFill = makeFill({ patternType: 'solid', fgColor: { rgb: BLUE } })

  const kpiValueFont = makeFont({ bold: true, size: 18, color: { rgb: NAVY }, name: 'Arial' })
  const kpiFill = makeFill({ patternType: 'solid', fgColor: { rgb: GRAY } })

  const kpiLabelFont = makeFont({ size: 9, color: { rgb: DARK_GRAY }, name: 'Arial' })

  const kpiValueBlueFont = makeFont({ bold: true, size: 14, color: { rgb: BLUE }, name: 'Arial' })
  const kpiLabelBlueFill = makeFill({ patternType: 'solid', fgColor: { rgb: LIGHT_BLUE } })

  const totalFont = makeFont({ bold: true, size: 11, color: { rgb: 'FFFFFF' }, name: 'Arial' })
  const totalFill = makeFill({ patternType: 'solid', fgColor: { rgb: NAVY } })

  const cellFont = makeFont({ size: 11, name: 'Calibri' })
  const altFill = makeFill({ patternType: 'solid', fgColor: { rgb: GRAY } })

  const cellBoldFont = makeFont({ bold: true, size: 11, name: 'Arial' })

  const transCellFont = makeFont({ size: 10, color: { rgb: '404040' }, name: 'Arial' })

  // Helper: set cell value + style in one call
  function styledCell(ws: any, row: number, col: number, value: any, style: any) {
    const cell = setCell(ws, row, col, value)
    if (cell) setCellStyle(wb, cell, style)
    return cell
  }

  // Helper: set formula + style
  function formulaCell(ws: any, row: number, col: number, formula: string, style: any) {
    const cell = setCell(ws, row, col)
    if (cell) {
      setFormula(cell, formula)
      setCellStyle(wb, cell, style)
    }
    return cell
  }

  // ═══════════════════════════════════════════════════════════════════
  // CREATE WORKBOOK
  // ═══════════════════════════════════════════════════════════════════
  const wb = createWorkbook()

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 1: DASHBOARD (KPIs)
  // ═══════════════════════════════════════════════════════════════════
  const dashWs = addWorksheet(wb, 'Dashboard')
  setSheetTabColor(dashWs, makeColor({ rgb: TAB_DASHBOARD }))

  for (let c = 1; c <= 8; c++) setColumnWidth(dashWs, c, 16)

  // Row 1: Title
  setRowHeight(dashWs, 1, 45)
  styledCell(dashWs, 1, 1, 'PUNTO PARK U  |  DASHBOARD EJECUTIVO', { font: titleFont, fill: titleFill, alignment: { horizontal: 'center', vertical: 'center' } })
  mergeCells(dashWs, 'A1:H1')

  // Row 2: Subtitle
  setRowHeight(dashWs, 2, 22)
  styledCell(dashWs, 2, 1, `Periodo: ${periodLabel}  |  Generado: ${now.toLocaleDateString('es-CO')}`, { font: subtitleFont, fill: titleFill, alignment: { horizontal: 'center', vertical: 'center' } })
  mergeCells(dashWs, 'A2:H2')

  // Row 4: KPI values row 1
  setRowHeight(dashWs, 4, 40)
  const kpiValues1 = [s.totalIngresos, s.totalVehiculos, s.ticketPromedio, `${s.tasaOcupacion}%`]
  const kpiCols1 = [1, 3, 5, 7]
  const kpiValStyle1 = { font: kpiValueFont, fill: kpiFill, alignment: { horizontal: 'center', vertical: 'center' } }
  kpiValues1.forEach((val, i) => {
    const col = kpiCols1[i]
    styledCell(dashWs, 4, col, val, kpiValStyle1)
    styledCell(dashWs, 4, col + 1, null, kpiValStyle1)
  })
  mergeCells(dashWs, 'A4:B4')
  mergeCells(dashWs, 'C4:D4')
  mergeCells(dashWs, 'E4:F4')
  mergeCells(dashWs, 'G4:H4')

  // Row 5: KPI labels row 1
  setRowHeight(dashWs, 5, 20)
  const kpiLabels1 = ['Ingresos Totales', 'Vehiculos Atendidos', 'Ticket Promedio', 'Tasa Ocupacion']
  const kpiLblStyle1 = { font: kpiLabelFont, fill: kpiFill, alignment: { horizontal: 'center', vertical: 'center' } }
  kpiLabels1.forEach((label, i) => {
    const col = kpiCols1[i]
    styledCell(dashWs, 5, col, label, kpiLblStyle1)
    styledCell(dashWs, 5, col + 1, null, kpiLblStyle1)
  })
  mergeCells(dashWs, 'A5:B5')
  mergeCells(dashWs, 'C5:D5')
  mergeCells(dashWs, 'E5:F5')
  mergeCells(dashWs, 'G5:H5')

  // Row 7: KPI values row 2
  setRowHeight(dashWs, 7, 35)
  const kpiValues2 = [s.ingresosPorHora, s.tiempoPromedio, topPaymentName, topVehicleName]
  const kpiValStyle2 = { font: kpiValueBlueFont, fill: kpiLabelBlueFill, alignment: { horizontal: 'center', vertical: 'center' } }
  kpiValues2.forEach((val, i) => {
    const col = kpiCols1[i]
    styledCell(dashWs, 7, col, val, kpiValStyle2)
    styledCell(dashWs, 7, col + 1, null, kpiValStyle2)
  })
  mergeCells(dashWs, 'A7:B7')
  mergeCells(dashWs, 'C7:D7')
  mergeCells(dashWs, 'E7:F7')
  mergeCells(dashWs, 'G7:H7')

  // Row 8: KPI labels row 2
  setRowHeight(dashWs, 8, 20)
  const kpiLabels2 = ['Ingreso/Hora', 'Tiempo Promedio', 'Metodo Principal', 'Vehiculo Top']
  const kpiLblStyle2 = { font: kpiLabelFont, fill: kpiLabelBlueFill, alignment: { horizontal: 'center', vertical: 'center' } }
  kpiLabels2.forEach((label, i) => {
    const col = kpiCols1[i]
    styledCell(dashWs, 8, col, label, kpiLblStyle2)
    styledCell(dashWs, 8, col + 1, null, kpiLblStyle2)
  })
  mergeCells(dashWs, 'A8:B8')
  mergeCells(dashWs, 'C8:D8')
  mergeCells(dashWs, 'E8:F8')
  mergeCells(dashWs, 'G8:H8')

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 2: VEHICULOS
  // ═══════════════════════════════════════════════════════════════════
  const vehWs = addWorksheet(wb, 'Vehiculos')
  setSheetTabColor(vehWs, makeColor({ rgb: TAB_VEHICULOS }))

  const totalVehicleRows = breakdown.length
  for (let c = 1; c <= 5; c++) setColumnWidth(vehWs, c, 20)

  // Row 1: Title
  setRowHeight(vehWs, 1, 40)
  styledCell(vehWs, 1, 1, 'DESGLOSE POR TIPO DE VEHICULO', { font: sheetTitleFont, fill: titleFill, alignment: { horizontal: 'center', vertical: 'center' } })
  mergeCells(vehWs, 'A1:E1')

  // Row 3: Headers
  const vehHeaders = ['Tipo Vehiculo', 'Cantidad', 'Ingresos', '% del Total', 'Ticket Promedio']
  vehHeaders.forEach((h, i) => {
    styledCell(vehWs, 3, i + 1, h, { font: headerFont, fill: headerFill, alignment: { horizontal: 'center', vertical: 'center' } })
  })

  // Data rows (row 4+)
  const altRowStyle = { font: cellFont, fill: altFill, alignment: { vertical: 'center' } as const }
  const normalRowStyle = { font: cellFont, alignment: { vertical: 'center' } as const }
  const altBoldStyle = { font: cellBoldFont, fill: altFill, alignment: { vertical: 'center' } as const }
  const normalBoldStyle = { font: cellBoldFont, alignment: { vertical: 'center' } as const }

  breakdown.forEach((b, i) => {
    const row = 4 + i
    const isAlt = i % 2 === 1
    const rs = isAlt ? altRowStyle : normalRowStyle
    const rbs = isAlt ? altBoldStyle : normalBoldStyle

    styledCell(vehWs, row, 1, b.tipo, rbs)
    styledCell(vehWs, row, 2, b.cantidad, { ...rs, numberFormat: '#,##0' })
    styledCell(vehWs, row, 3, b.ingresos, { ...rs, numberFormat: '#,##0' })

    // % formula
    const totalRowIdx = 3 + totalVehicleRows
    formulaCell(vehWs, row, 4, `C${row}/C${totalRowIdx}`, { ...rs, numberFormat: '0.0%' })

    // Ticket formula
    formulaCell(vehWs, row, 5, `C${row}/B${row}`, { ...rs, numberFormat: '#,##0' })
  })

  // Total row
  const vehTotalRow = 4 + totalVehicleRows
  const totalStyle = { font: totalFont, fill: totalFill, alignment: { horizontal: 'center', vertical: 'center' } }
  for (let c = 1; c <= 5; c++) styledCell(vehWs, vehTotalRow, c, null, totalStyle)
  formulaCell(vehWs, vehTotalRow, 2, `SUM(B4:B${vehTotalRow - 1})`, { ...totalStyle, numberFormat: '#,##0' })
  formulaCell(vehWs, vehTotalRow, 3, `SUM(C4:C${vehTotalRow - 1})`, { ...totalStyle, numberFormat: '#,##0' })
  formulaCell(vehWs, vehTotalRow, 4, `SUM(D4:D${vehTotalRow - 1})`, { ...totalStyle, numberFormat: '0%' })

  // ── Chart: BarChart for Vehiculos ────────────────────────────────────
  const vehBarSeries = makeBarSeries({
    idx: 0,
    tx: { kind: 'literal', value: 'Ingresos' },
    cat: { ref: `Vehiculos!$A$4:$A$${vehTotalRow - 1}` },
    val: { ref: `Vehiculos!$C$4:$C$${vehTotalRow - 1}` },
  })
  vehBarSeries.spPr = { fill: { kind: 'solidFill' as const, color: { base: { kind: 'srgb' as const, value: BLUE }, mods: [] } } }
  const vehBarChart = makeBarChart({ barDir: 'col', grouping: 'clustered', series: [vehBarSeries] })
  const vehBarChartSpace = makeChartSpace({
    plotArea: { chart: vehBarChart },
    title: { text: 'Ingresos por Tipo de Vehiculo' },
    legend: { position: 'b' },
  })
  addChartAt(vehWs, `A${vehTotalRow + 2}`, { space: vehBarChartSpace }, { widthPx: 500, heightPx: 300 })

  // ── Chart: PieChart for Vehiculos ────────────────────────────────────
  const vehPieSeries = makeBarSeries({
    idx: 1,
    tx: { kind: 'literal', value: 'Distribucion' },
    cat: { ref: `Vehiculos!$A$4:$A$${vehTotalRow - 1}`, cacheKind: 'str' },
    val: { ref: `Vehiculos!$B$4:$B$${vehTotalRow - 1}` },
  })
  const vehPieChart = makePieChart({ varyColors: true, series: [vehPieSeries] })
  const vehPieChartSpace = makeChartSpace({
    plotArea: { chart: vehPieChart },
    title: { text: 'Distribucion de Vehiculos' },
    legend: { position: 'r' },
  })
  addChartAt(vehWs, `A${vehTotalRow + 20}`, { space: vehPieChartSpace }, { widthPx: 400, heightPx: 300 })

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 3: TRANSACCIONES
  // ═══════════════════════════════════════════════════════════════════
  const transWs = addWorksheet(wb, 'Transacciones')
  setSheetTabColor(transWs, makeColor({ rgb: TAB_TRANSACCIONES }))

  const transDataRows = rows.length
  const transColWidths = [12, 16, 12, 12, 16, 14, 18, 20]
  transColWidths.forEach((w, i) => setColumnWidth(transWs, i + 1, w))

  // Row 1: Title
  setRowHeight(transWs, 1, 40)
  styledCell(transWs, 1, 1, 'DETALLE DE TRANSACCIONES', { font: sheetTitleFont, fill: titleFill, alignment: { horizontal: 'center', vertical: 'center' } })
  mergeCells(transWs, 'A1:H1')

  // Row 3: Headers
  const transHeaders = ['Placa', 'Tipo', 'Entrada', 'Salida', 'Duracion (min)', 'Tarifa', 'Metodo Pago', 'Conductor']
  transHeaders.forEach((h, i) => {
    styledCell(transWs, 3, i + 1, h, { font: headerFont, fill: headerFill, alignment: { horizontal: 'center', vertical: 'center' } })
  })

  // Data rows (row 4+)
  rows.forEach((r, i) => {
    const row = 4 + i
    const isAlt = i % 2 === 1
    const rs = isAlt ? altRowStyle : normalRowStyle

    styledCell(transWs, row, 1, r.placa, { ...rs, font: transCellFont })
    styledCell(transWs, row, 2, r.tipo, { ...rs, font: transCellFont })
    styledCell(transWs, row, 3, r.ingreso, { ...rs, font: transCellFont })
    styledCell(transWs, row, 4, r.salida, { ...rs, font: transCellFont })
    styledCell(transWs, row, 5, durationToMinutes(r.duracion), { ...rs, font: transCellFont, numberFormat: '#,##0' })
    styledCell(transWs, row, 6, parseTarifa(r.tarifa), { ...rs, font: transCellFont, numberFormat: '$#,##0' })
    styledCell(transWs, row, 7, r.pago, { ...rs, font: transCellFont })
    styledCell(transWs, row, 8, r.conductor, { ...rs, font: transCellFont })
  })

  // Total row
  const transTotalRow = 4 + transDataRows
  for (let c = 1; c <= 8; c++) styledCell(transWs, transTotalRow, c, null, totalStyle)
  formulaCell(transWs, transTotalRow, 5, `AVERAGE(E4:E${transTotalRow - 1})`, { ...totalStyle, numberFormat: '#,##0' })
  formulaCell(transWs, transTotalRow, 6, `SUM(F4:F${transTotalRow - 1})`, { ...totalStyle, numberFormat: '$#,##0' })

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 4: METODO DE PAGO
  // ═══════════════════════════════════════════════════════════════════
  const pmtEntries = Object.entries(paymentStats)
  const pmtDataRows = pmtEntries.length

  const pmtWs = addWorksheet(wb, 'Metodo de Pago')
  setSheetTabColor(pmtWs, makeColor({ rgb: TAB_METODO_PAGO }))

  for (let c = 1; c <= 4; c++) setColumnWidth(pmtWs, c, 22)

  // Row 1: Title
  setRowHeight(pmtWs, 1, 40)
  styledCell(pmtWs, 1, 1, 'ANALISIS POR METODO DE PAGO', { font: sheetTitleFont, fill: titleFill, alignment: { horizontal: 'center', vertical: 'center' } })
  mergeCells(pmtWs, 'A1:D1')

  // Row 3: Headers
  const pmtHeaders = ['Metodo de Pago', 'Transacciones', 'Ingresos', '% del Total']
  pmtHeaders.forEach((h, i) => {
    styledCell(pmtWs, 3, i + 1, h, { font: headerFont, fill: headerFill, alignment: { horizontal: 'center', vertical: 'center' } })
  })

  // Data rows (row 4+)
  pmtEntries.forEach(([method, stats], i) => {
    const row = 4 + i
    const isAlt = i % 2 === 1
    const rs = isAlt ? altRowStyle : normalRowStyle
    const rbs = isAlt ? altBoldStyle : normalBoldStyle

    styledCell(pmtWs, row, 1, method, rbs)
    styledCell(pmtWs, row, 2, stats.count, { ...rs, numberFormat: '#,##0' })
    styledCell(pmtWs, row, 3, stats.total, { ...rs, numberFormat: '$#,##0' })

    // % formula
    const totalRowIdx = 3 + pmtDataRows
    formulaCell(pmtWs, row, 4, `C${row}/C${totalRowIdx}`, { ...rs, numberFormat: '0.0%' })
  })

  // Total row
  const pmtTotalRow = 4 + pmtDataRows
  for (let c = 1; c <= 4; c++) styledCell(pmtWs, pmtTotalRow, c, null, totalStyle)
  formulaCell(pmtWs, pmtTotalRow, 2, `SUM(B4:B${pmtTotalRow - 1})`, { ...totalStyle, numberFormat: '#,##0' })
  formulaCell(pmtWs, pmtTotalRow, 3, `SUM(C4:C${pmtTotalRow - 1})`, { ...totalStyle, numberFormat: '$#,##0' })
  formulaCell(pmtWs, pmtTotalRow, 4, `SUM(D4:D${pmtTotalRow - 1})`, { ...totalStyle, numberFormat: '0%' })

  // ── Chart: BarChart for Metodo de Pago ───────────────────────────────
  const pmtBarSeries = makeBarSeries({
    idx: 0,
    tx: { kind: 'literal', value: 'Ingresos' },
    cat: { ref: `'Metodo de Pago'!$A$4:$A$${pmtTotalRow - 1}` },
    val: { ref: `'Metodo de Pago'!$C$4:$C$${pmtTotalRow - 1}` },
  })
  pmtBarSeries.spPr = { fill: { kind: 'solidFill' as const, color: { base: { kind: 'srgb' as const, value: GREEN }, mods: [] } } }
  const pmtBarChart = makeBarChart({ barDir: 'col', grouping: 'clustered', series: [pmtBarSeries] })
  const pmtBarChartSpace = makeChartSpace({
    plotArea: { chart: pmtBarChart },
    title: { text: 'Ingresos por Metodo de Pago' },
    legend: { position: 'b' },
  })
  addChartAt(pmtWs, `A${pmtTotalRow + 2}`, { space: pmtBarChartSpace }, { widthPx: 500, heightPx: 300 })

  // ═══════════════════════════════════════════════════════════════════
  // HOJA 5: ANALISIS HORARIO
  // ═══════════════════════════════════════════════════════════════════
  const horWs = addWorksheet(wb, 'Analisis Horario')
  setSheetTabColor(horWs, makeColor({ rgb: TAB_HORARIO }))

  for (let c = 1; c <= 4; c++) setColumnWidth(horWs, c, 22)

  // Row 1: Title
  setRowHeight(horWs, 1, 40)
  styledCell(horWs, 1, 1, 'ANALISIS POR FRANJA HORARIA', { font: sheetTitleFont, fill: titleFill, alignment: { horizontal: 'center', vertical: 'center' } })
  mergeCells(horWs, 'A1:D1')

  // Row 3: Headers
  const horHeaders = ['Franja Horaria', 'Vehiculos', 'Ingresos', 'Ticket Promedio']
  horHeaders.forEach((h, i) => {
    styledCell(horWs, 3, i + 1, h, { font: headerFont, fill: headerFill, alignment: { horizontal: 'center', vertical: 'center' } })
  })

  // Data rows (row 4+)
  bandStats.forEach((b, i) => {
    const row = 4 + i
    const isAlt = i % 2 === 1
    const rs = isAlt ? altRowStyle : normalRowStyle
    const rbs = isAlt ? altBoldStyle : normalBoldStyle

    styledCell(horWs, row, 1, b.label, rbs)
    styledCell(horWs, row, 2, b.count, { ...rs, numberFormat: '#,##0' })
    styledCell(horWs, row, 3, b.total, { ...rs, numberFormat: '$#,##0' })

    // Ticket formula
    formulaCell(horWs, row, 4, `C${row}/B${row}`, { ...rs, numberFormat: '$#,##0' })
  })

  // ── Chart: BarChart for Analisis Horario ─────────────────────────────
  const horLastDataRow = 3 + bandStats.length
  const horBarSeries = makeBarSeries({
    idx: 0,
    tx: { kind: 'literal', value: 'Vehiculos' },
    cat: { ref: `'Analisis Horario'!$A$4:$A$${horLastDataRow}` },
    val: { ref: `'Analisis Horario'!$B$4:$B$${horLastDataRow}` },
  })
  horBarSeries.spPr = { fill: { kind: 'solidFill' as const, color: { base: { kind: 'srgb' as const, value: GOLD }, mods: [] } } }
  const horBarChart = makeBarChart({ barDir: 'col', grouping: 'clustered', series: [horBarSeries] })
  const horBarChartSpace = makeChartSpace({
    plotArea: { chart: horBarChart },
    title: { text: 'Vehiculos por Franja Horaria' },
    legend: { position: 'b' },
  })
  addChartAt(horWs, `A${horLastDataRow + 2}`, { space: horBarChartSpace }, { widthPx: 500, heightPx: 300 })

  // ═══════════════════════════════════════════════════════════════════
  // WRITE FILE
  // ═══════════════════════════════════════════════════════════════════
  const bytes = await workbookToBytes(wb)
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `PuntoParkU_reporte_${now.toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
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

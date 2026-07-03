import React from 'react'
import { Button } from '@/components/ui'
import { showSuccessToast, showErrorToast } from '@/utils/errorHandler'
import type { ReportContent } from '@/types'

interface ExcelExporterProps {
  content: ReportContent
  disabled?: boolean
}

/**
 * Export the current report as a formatted Excel spreadsheet using the xlsx library.
 * Matches the vanilla Punto Park U Excel format with:
 *   - Title + period header rows (merged)
 *   - Summary KPIs (label + value pairs)
 *   - Breakdown by vehicle type
 *   - Vehicle records table
 *   - Column widths, colors, merged cells, borders
 */
async function generateExcel(content: ReportContent): Promise<void> {
  const XLSX = await import('xlsx-js-style')

  const s = content.summary
  const rows = content.rows
  const breakdown = content.breakdown || []
  const title = content.meta.title

  const values: any[][] = []

  // Row 0: Title (merged across all columns)
  values.push([`Punto Park U — ${title}`, '', '', '', '', '', '', ''])
  // Row 1: Subtitle
  values.push([content.meta.subtitle, '', '', '', '', '', '', ''])
  // Row 2: Period info
  values.push([`Período: ${content.meta.period}  ·  Generado: ${content.meta.generatedAt}`, '', '', '', '', '', '', ''])
  // Row 3: Empty
  values.push([])
  // Row 4: Summary header
  values.push(['RESUMEN DEL PERÍODO', '', '', '', '', '', '', ''])
  // Rows 5-6: KPI pairs
  values.push([
    'Ingresos totales', `$${s.totalIngresos.toLocaleString('es-CO')}`,
    'Vehículos atendidos', String(s.totalVehiculos),
    'Tasa de ocupación', `${s.tasaOcupacion}%`,
    'Ticket promedio', `$${s.ticketPromedio.toLocaleString('es-CO')}`,
  ])
  values.push([
    'Tiempo promedio', s.tiempoPromedio,
    'Ingreso promedio/hora', `$${s.ingresosPorHora.toLocaleString('es-CO')}`,
    '', '', '', '',
  ])
  // Row 7: Empty
  values.push([])
  // Row 8: Breakdown header
  values.push(['DESGLOSE POR TIPO DE VEHÍCULO', '', '', '', '', '', '', ''])
  // Row 9: Breakdown column headers
  values.push(['Tipo', 'Vehículos', 'Ingresos', '% del total', '', '', '', ''])
  // Rows 10+: Breakdown data
  const brkTotal = breakdown.reduce((a, b) => a + b.ingresos, 0)
  const brkCount = breakdown.reduce((a, b) => a + b.cantidad, 0)
  breakdown.forEach((b) => {
    const pct = brkTotal > 0 ? ((b.ingresos / brkTotal) * 100).toFixed(0) + '%' : '0%'
    values.push([b.tipo, b.cantidad, b.ingresos, pct, '', '', '', ''])
  })
  // Total row
  values.push(['TOTAL', brkCount, brkTotal, '100%', '', '', '', ''])
  // Empty row
  values.push([])

  // Breakdown rows count
  const BREAKDOWN_ROWS = breakdown.length
  // Header row for vehicle records (10 + BREAKDOWN_ROWS + 1 total + 1 empty = index)
  const HEADER_ROW = 10 + BREAKDOWN_ROWS + 2 // +1 total, +1 empty

  // Vehicle records headers
  const headers = ['Placa', 'Tipo', 'Ingreso', 'Salida', 'Duración', 'Tarifa', 'Método de Pago', 'Conductor']
  values.push(headers)
  // Data rows
  rows.forEach((r) => {
    const tarifaNum = parseInt(String(r.tarifa).replace(/[$.]/g, '')) || 0
    values.push([r.placa, r.tipo, r.ingreso, r.salida, r.duracion, tarifaNum, r.pago, r.conductor])
  })
  // Total row
  const totalTarifa = rows.reduce(
    (sum, r) => sum + (parseInt(String(r.tarifa).replace(/[$.]/g, '')) || 0),
    0
  )
  values.push(['TOTAL', '', '', '', '', totalTarifa, '', ''])

  // Create workbook + sheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(values)

  // Merged cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 7 } },
    { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } },
  ]

  // Column widths
  const colWidths: number[] = []
  values.forEach((row) =>
    row.forEach((cell: any, ci: number) => {
      const len = String(cell || '').length
      if (!colWidths[ci] || len > colWidths[ci]) colWidths[ci] = len
    })
  )
  ws['!cols'] = colWidths.map((w) => ({ wch: Math.min(Math.max(w + 3, 10), 40) }))

  // ── Cell styling ─────────────────────────────
  // We apply styles directly using the xlsx cell format approach.
  // Since xlsx 0.18 uses a different style model (no direct .s on cells),
  // we use the cell objects directly.

  const styleCell = (r: number, c: number, style: Record<string, any>) => {
    const ref = XLSX.utils.encode_cell({ r, c })
    if (!ws[ref]) ws[ref] = { t: 's', v: '' }
    ws[ref].s = style
  }

  // Title row
  styleCell(0, 0, {
    font: { bold: true, sz: 16, color: { rgb: '1E3A5F' }, name: 'Calibri' },
    alignment: { horizontal: 'left', vertical: 'center' },
  })
  styleCell(1, 0, {
    font: { sz: 11, color: { rgb: '555555' }, name: 'Calibri' },
    alignment: { vertical: 'center' },
  })
  styleCell(2, 0, {
    font: { sz: 10, color: { rgb: '888888' }, name: 'Calibri' },
    alignment: { vertical: 'center' },
  })

  // Summary header (row 4)
  styleCell(4, 0, {
    font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
    fill: { fgColor: { rgb: '1E3A5F' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  })

  // KPI rows (5-6)
  const thin = {
    top: { style: 'thin' as any, color: { rgb: 'CCE0F0' } },
    bottom: { style: 'thin' as any, color: { rgb: 'CCE0F0' } },
    left: { style: 'thin' as any, color: { rgb: 'CCE0F0' } },
    right: { style: 'thin' as any, color: { rgb: 'CCE0F0' } },
  }

  for (let row = 5; row <= 6; row++) {
    for (let c = 0; c < 8; c += 2) {
      styleCell(row, c, {
        font: { bold: true, sz: 11, color: { rgb: '1E3C72' }, name: 'Calibri' },
        fill: { fgColor: { rgb: 'DEEFFF' } },
        alignment: { vertical: 'center' },
        border: thin,
      })
      const valRef = XLSX.utils.encode_cell({ r: row, c: c + 1 })
      if (ws[valRef] && ws[valRef].v !== '') {
        styleCell(row, c + 1, {
          font: { bold: true, sz: 11, color: { rgb: '0A6620' }, name: 'Calibri' },
          alignment: { horizontal: 'right', vertical: 'center' },
          border: thin,
        })
      }
    }
  }

  // Breakdown header (row 8)
  styleCell(8, 0, {
    font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
    fill: { fgColor: { rgb: '2A5298' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  })

  // Breakdown column headers (row 9)
  ;['Tipo', 'Vehículos', 'Ingresos', '% del total'].forEach((_, ci) => {
    styleCell(9, ci, {
      font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
      fill: { fgColor: { rgb: '1E3A5F' } },
      alignment: { horizontal: ci > 0 ? 'center' : 'left', vertical: 'center' },
      border: thin,
    })
  })

  // Breakdown data rows (10..10+N-1)
  breakdown.forEach((_, bi) => {
    const ri = 10 + bi
    const bg = bi % 2 === 0 ? 'FFFFFF' : 'E8F4FD'
    styleCell(ri, 0, {
      font: { bold: true, sz: 10, name: 'Calibri' },
      fill: { fgColor: { rgb: bg } },
      border: thin,
    })
    for (let ci = 1; ci <= 3; ci++) {
      styleCell(ri, ci, {
        font: { sz: 10, name: 'Calibri' },
        fill: { fgColor: { rgb: bg } },
        alignment: { horizontal: 'center' },
        border: thin,
      })
    }
  })

  // Breakdown total row
  const totalBrkRow = 10 + BREAKDOWN_ROWS
  for (let ci = 0; ci <= 3; ci++) {
    styleCell(totalBrkRow, ci, {
      font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
      fill: { fgColor: { rgb: '1E3A5F' } },
      alignment: { horizontal: ci > 0 ? 'center' : 'left', vertical: 'center' },
      border: thin,
    })
  }

  // Vehicle records header row
  headers.forEach((_, ci) => {
    styleCell(HEADER_ROW, ci, {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
      fill: { fgColor: { rgb: '1E3A5F' } },
      alignment: {
        horizontal: ci === 5 ? 'right' : ci >= 2 && ci <= 4 ? 'center' : 'left',
        vertical: 'center',
      },
      border: thin,
    })
  })

  // Vehicle records data rows
  const DATA_START = HEADER_ROW + 1
  rows.forEach((_, i) => {
    const bg = i % 2 === 0 ? 'FFFFFF' : 'E8F4FD'
    for (let c = 0; c < 8; c++) {
      styleCell(DATA_START + i, c, {
        font: {
          name: 'Calibri',
          sz: 11,
          bold: c === 0,
          color: { rgb: c === 0 ? '1E3C72' : c === 5 ? '0A6620' : '333333' },
        },
        fill: { fgColor: { rgb: bg } },
        alignment: {
          horizontal: c === 5 ? 'right' : c >= 2 && c <= 4 ? 'center' : 'left',
          vertical: 'center',
        },
        border: thin,
      })
    }
  })

  // Total row
  const TOTAL_ROW = DATA_START + rows.length
  for (let c = 0; c < 8; c++) {
    styleCell(TOTAL_ROW, c, {
      font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
      fill: { fgColor: { rgb: '1E3A5F' } },
      alignment: {
        horizontal: c === 5 ? 'right' : c === 0 ? 'left' : 'center',
        vertical: 'center',
      },
      border: thin,
    })
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
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

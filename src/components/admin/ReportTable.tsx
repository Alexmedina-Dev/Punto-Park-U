import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui'
import type { ReportRow, ReportFilters } from '@/types'
import { getVehicleLabel, formatCurrency } from '@/utils/formatters'

interface ReportTableProps {
  rows: ReportRow[]
  filters: ReportFilters
  className?: string
}

/**
 * Data table for admin reports showing vehicle records.
 * Includes search/filter, pagination, and count.
 * Follows the same pattern as VehiclesTable.
 */
export function ReportTable({ rows, filters, className = '' }: ReportTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      r.placa.toLowerCase().includes(q) ||
      r.conductor.toLowerCase().includes(q) ||
      r.tipo.toLowerCase().includes(q)
    )
  }, [rows, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * perPage
  const paginated = filtered.slice(start, start + perPage)

  // Reset page when search changes
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  return (
    <Card variant="glass" title="Registro de Vehículos" className={className}>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por placa, conductor o tipo..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-outline bg-surface-container text-on-bg placeholder:text-on-surface-var/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="text-center py-8 text-on-surface-var text-sm">
          <span className="material-symbols-outlined text-3xl mb-2 block">table_rows</span>
          <p>No hay registros con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline/10">
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold whitespace-nowrap">Placa</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold whitespace-nowrap">Tipo</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold whitespace-nowrap hidden sm:table-cell">Ingreso</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold whitespace-nowrap hidden sm:table-cell">Salida</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold whitespace-nowrap hidden md:table-cell">Duración</th>
                <th className="text-right py-2 px-2 text-on-surface-var font-semibold whitespace-nowrap">Tarifa</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold whitespace-nowrap">Pago</th>
                <th className="text-left py-2 px-2 text-on-surface-var font-semibold whitespace-nowrap hidden lg:table-cell">Conductor</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((r, i) => (
                <tr
                  key={`${r.placa}-${i}`}
                  className="border-b border-outline/5 hover:bg-surface-container/40 transition-colors"
                >
                  <td className="py-2.5 px-2 font-mono font-bold text-primary whitespace-nowrap">
                    {r.placa}
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap">{r.tipo}</td>
                  <td className="py-2.5 px-2 text-on-surface-var hidden sm:table-cell whitespace-nowrap">
                    {r.ingreso}
                  </td>
                  <td className="py-2.5 px-2 text-on-surface-var hidden sm:table-cell whitespace-nowrap">
                    {r.salida}
                  </td>
                  <td className="py-2.5 px-2 hidden md:table-cell whitespace-nowrap">
                    {r.duracion}
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-green-400 whitespace-nowrap">
                    {r.tarifa}
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        r.pago === 'Efectivo'
                          ? 'bg-green-500/15 text-green-400'
                          : r.pago === 'POS'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-purple-500/15 text-purple-400'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">
                        {r.pago === 'Efectivo' ? 'payments' : r.pago === 'POS' ? 'credit_card' : 'account_balance'}
                      </span>
                      {r.pago}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-on-surface-var hidden lg:table-cell whitespace-nowrap">
                    {r.conductor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination + count */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
          <span className="text-xs text-on-surface-var">
            Mostrando {start + 1}–{Math.min(start + perPage, filtered.length)} de {filtered.length} registros
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2 py-1 rounded text-xs font-semibold bg-surface-container text-on-surface-var hover:text-on-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const startPage = Math.max(1, safePage - 2)
              const p = startPage + i
              if (p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                    p === safePage
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-var hover:text-on-bg'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2 py-1 rounded text-xs font-semibold bg-surface-container text-on-surface-var hover:text-on-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}

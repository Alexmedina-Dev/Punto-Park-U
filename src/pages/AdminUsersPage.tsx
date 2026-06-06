import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/layout'
import { Card, Badge, Button, Input, Modal } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import type { User, UserRole, UserStats } from '@/types'
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler'
import {
  getUsersService,
  updateUserRoleService,
  deleteUserService,
  getUserStatsService,
} from '@/services/auth.service'

const ROLE_OPTIONS: UserRole[] = ['admin', 'operator', 'user', 'guest']

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Admin',
    operator: 'Operador',
    user: 'Usuario',
    guest: 'Invitado',
  }
  return labels[role] || role
}

function getUserDisplayName(u: User): string {
  const names = [u.nombres, u.apellidos].filter(Boolean).join(' ')
  return names || u.username || u.email || 'Sin nombre'
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [deleting, setDeleting] = useState(false)

  // Edit role
  const [editRole, setEditRole] = useState<{ open: boolean; user: User | null; role: UserRole }>({ open: false, user: null, role: 'user' })
  const [updatingRole, setUpdatingRole] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getUsersService({
        role: roleFilter || undefined,
        search: search || undefined,
        page,
        limit: 15,
      })
      setUsers(result.data)
      setTotalPages(result.pagination.totalPages)
      setTotal(result.pagination.total)
    } catch (err) {
      showErrorToast(err)
    } finally {
      setLoading(false)
    }
  }, [roleFilter, search, page])

  const fetchStats = useCallback(async () => {
    try {
      const data = await getUserStatsService()
      setStats(data)
    } catch {
      // Stats are non-critical
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1)
  }, [search, roleFilter])

  // ── Delete handler ──
  const handleDeleteConfirm = async () => {
    if (!deleteModal.user) return
    setDeleting(true)
    try {
      await deleteUserService(deleteModal.user.id)
      showSuccessToast(`Usuario ${getUserDisplayName(deleteModal.user)} eliminado`)
      setDeleteModal({ open: false, user: null })
      fetchUsers()
      fetchStats()
    } catch (err) {
      showErrorToast(err)
    } finally {
      setDeleting(false)
    }
  }

  // ── Role update handler ──
  const handleRoleUpdate = async () => {
    if (!editRole.user) return
    setUpdatingRole(true)
    try {
      await updateUserRoleService(editRole.user.id, editRole.role)
      showSuccessToast(`Rol de ${getUserDisplayName(editRole.user)} actualizado a ${getRoleLabel(editRole.role)}`)
      setEditRole({ open: false, user: null, role: 'user' })
      fetchUsers()
      fetchStats()
    } catch (err) {
      showErrorToast(err)
    } finally {
      setUpdatingRole(false)
    }
  }

  const canDelete = (userId: string) => currentUser?.id !== userId

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary font-headline">
              Gestión de Usuarios
            </h1>
            <p className="text-on-surface-var mt-1">
              Administra los usuarios del sistema y sus roles
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <Card variant="glass" padding="sm" className="text-center">
              <div className="text-lg font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-on-surface-var">Total</div>
            </Card>
            <Card variant="glass" padding="sm" className="text-center">
              <div className="text-lg font-bold text-red-400">{stats.admin}</div>
              <div className="text-xs text-on-surface-var">Admin</div>
            </Card>
            <Card variant="glass" padding="sm" className="text-center">
              <div className="text-lg font-bold text-blue-400">{stats.operator}</div>
              <div className="text-xs text-on-surface-var">Operador</div>
            </Card>
            <Card variant="glass" padding="sm" className="text-center">
              <div className="text-lg font-bold text-green-400">{stats.user}</div>
              <div className="text-xs text-on-surface-var">Usuario</div>
            </Card>
            <Card variant="glass" padding="sm" className="text-center">
              <div className="text-lg font-bold text-gray-400">{stats.guest}</div>
              <div className="text-xs text-on-surface-var">Invitado</div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card variant="glass" padding="md" className="mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-on-surface-var mb-1">
                Buscar
              </label>
              <Input
                placeholder="Nombre, email, cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-40">
              <label className="block text-xs font-semibold text-on-surface-var mb-1">
                Rol
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline/20 text-on-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Todos</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                ))}
              </select>
            </div>
            <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setRoleFilter('') }}>
              Limpiar
            </Button>
          </div>
        </Card>

        {/* Users Table */}
        <Card variant="glass" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline/20 text-on-surface-var text-xs uppercase font-bold">
                  <th className="text-left px-4 py-3">Usuario</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Cédula</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-on-surface-var">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-on-surface-var">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-outline/10 hover:bg-surface-container/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.googlePicture ? (
                            <img src={u.googlePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                              {getUserDisplayName(u)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-on-bg">{getUserDisplayName(u)}</div>
                            <div className="text-xs text-on-surface-var">@{u.username || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-on-surface-var">{u.email}</td>
                      <td className="px-4 py-3 text-on-surface-var">{u.cedula || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge role={(u.rol || u.role || 'guest') as UserRole} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {currentUser?.id !== u.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditRole({ open: true, user: u, role: (u.rol || u.role || 'user') as UserRole })}
                              title="Cambiar rol"
                            >
                              <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                            </Button>
                          )}
                          {canDelete(u.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteModal({ open: true, user: u })}
                              className="text-red-400 hover:text-red-300"
                              title="Eliminar usuario"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-outline/20">
              <div className="text-xs text-on-surface-var">
                {total} usuario{total !== 1 ? 's' : ''} — Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.user && (
        <Modal
          open={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, user: null })}
          title="Confirmar Eliminación"
        >
          <div className="space-y-4">
            <p className="text-on-surface-var text-sm">
              ¿Estás seguro de eliminar a <strong className="text-on-bg">{getUserDisplayName(deleteModal.user)}</strong>?
            </p>
            <p className="text-red-400 text-xs">
              Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModal({ open: false, user: null })}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={deleting}
                onClick={handleDeleteConfirm}
                className="bg-red-500 hover:bg-red-600"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Role Modal */}
      {editRole.open && editRole.user && (
        <Modal
          open={editRole.open}
          onClose={() => setEditRole({ open: false, user: null, role: 'user' })}
          title="Cambiar Rol"
        >
          <div className="space-y-4">
            <p className="text-sm text-on-surface-var">
              Cambiar rol de <strong className="text-on-bg">{getUserDisplayName(editRole.user)}</strong>
            </p>
            <div>
              <label className="block text-xs font-semibold text-on-surface-var mb-1">
                Nuevo rol
              </label>
              <select
                value={editRole.role}
                onChange={(e) => setEditRole({ ...editRole, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 rounded-lg bg-surface-container border border-outline/20 text-on-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{getRoleLabel(r)}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditRole({ open: false, user: null, role: 'user' })}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={updatingRole}
                onClick={handleRoleUpdate}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  )
}

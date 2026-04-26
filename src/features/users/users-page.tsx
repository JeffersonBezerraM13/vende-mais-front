import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { Loader } from '@/components/ui/loader'
import { PageHeader } from '@/components/ui/page-header'
import { useAuthStore } from '@/features/auth/auth-store'
import { UserDetailsDialog } from '@/features/users/user-details-dialog'
import { UserFormDialog } from '@/features/users/user-form-dialog'
import { createUser, deleteUser, listUsers, updateUser } from '@/services/api/users-service'
import { getApiErrorInfo } from '@/services/http/errors'
import { createLocalPage, fetchAllPages } from '@/services/http/pagination'
import { ROLE_LABELS } from '@/utils/constants'
import { formatNumber } from '@/utils/format'
import { isAdmin } from '@/utils/permissions'
import { Pagination } from '@/components/ui/pagination'

import type { UserFormValues } from '@/features/users/user-schema'
import type { UserRequestDTO, UserResponseDTO } from '@/types/api'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const canManage = isAdmin(currentUser)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponseDTO | null>(null)
  const [editingUser, setEditingUser] = useState<UserResponseDTO | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserResponseDTO | null>(null)

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchAllPages(listUsers, { size: 100, sort: 'name,asc' }),
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserRequestDTO }) =>
      updateUser(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      setUserToDelete(null)
    },
  })

  if (usersQuery.isLoading) {
    return <Loader label="Carregando funcionários..." />
  }

  if (usersQuery.isError || !usersQuery.data) {
    return (
      <EmptyState
        title="Falha ao Carregar Funcionários"
        description="Verifique a autenticação."
      />
    )
  }

  const users = usersQuery.data.filter((user) => {
    const matchesSearch =
      !search ||
      [user.name, user.email, user.roles.join(' ')]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search.toLowerCase()))

    return matchesSearch
  })

  const localPage = createLocalPage(users, page)

  const handleSaveUser = async (values: UserFormValues) => {
    const payload: UserRequestDTO = {
      name: values.name,
      email: values.email,
      password: values.password,
    }

    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser.id, payload })
      setEditingUser(null)
      return
    }

    await createMutation.mutateAsync(payload)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) {
      return
    }

    try {
      await deleteMutation.mutateAsync(userToDelete.id)
      toast.success('Usuario excluído com sucesso.')
    } catch (error) {
      toast.error(getApiErrorInfo(error).message)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Funcionários"
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditingUser(null)
                setIsFormOpen(true)
              }}
            >
              <Plus size={16} />
              Novo usuario
            </Button>
          ) : null
        }
      />

      {!canManage ? (
        <Card className="notice-card">
          <strong>Somente Leitura</strong>
          <p>Seu perfil não possui as permissões de um administrador.</p>
        </Card>
      ) : null}

      <Card>
        <div className="toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              className="input"
              placeholder="Buscar por nome, email ou permissões"
              value={search}
              onChange={(event) => {
                setPage(0)
                setSearch(event.target.value)
              }}
            />
          </div>
          <div className="toolbar-filters">
            <Badge tone="info">{formatNumber(users.length)} usuario(s)</Badge>
          </div>
        </div>

        <DataTable
          data={localPage.content}
          rowKey={(user) => user.id}
          emptyState={
            <EmptyState
              icon={<UserRound size={18} />}
              title="Nenhum Funcionário Encontrado"
              description="Ajuste o Filtro ou Cadastre um Novo Funcionário."
            />
          }
          columns={[
            {
              key: 'name',
              header: 'Funcionário',
              cell: (user) => (
                <div className="cell-stack">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              ),
            },
            {
              key: 'roles',
              header: 'Permissões',
              cell: (user) => (
                <div className="badge-list">
                  {user.roles.map((role) => (
                    <Badge key={role} tone={role === 'ADMIN' ? 'info' : 'neutral'}>
                      {ROLE_LABELS[role] || role}
                    </Badge>
                  ))}
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              className: 'cell-actions',
              cell: (user) => (
                <div className="table-actions">
                  <button className="icon-button" onClick={() => setSelectedUser(user)}>
                    <Eye size={16} />
                  </button>
                  {canManage ? (
                    <>
                      <button
                        className="icon-button"
                        onClick={() => {
                          setEditingUser(user)
                          setIsFormOpen(true)
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button className="icon-button danger" onClick={() => setUserToDelete(user)}>
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : null}
                </div>
              ),
            },
          ]}
        />

        <Pagination
          page={localPage.page}
          totalPages={localPage.totalPages}
          totalItems={localPage.totalElements}
          onPageChange={setPage}
        />
      </Card>

      <UserFormDialog
        open={isFormOpen}
        user={editingUser}
        loading={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) {
            setEditingUser(null)
          }
        }}
        onSubmit={handleSaveUser}
      />

      <UserDetailsDialog
        open={Boolean(selectedUser)}
        user={selectedUser}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(userToDelete)}
        title="Excluir Funcionário"
        description={userToDelete ? `Deseja Remover o(a) ${userToDelete.name} ?` : ''}
        loading={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null)
          }
        }}
        onConfirm={handleDeleteUser}
      />
    </div>
  )
}

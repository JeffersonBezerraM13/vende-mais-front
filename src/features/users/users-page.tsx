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
import { Pagination } from '@/components/ui/pagination'
import { useAuthStore } from '@/features/auth/auth-store'
import { UserDetailsDialog } from '@/features/users/user-details-dialog'
import { UserFormDialog } from '@/features/users/user-form-dialog'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { createUser, deleteUser, listUsers, updateUser } from '@/services/api/users-service'
import { getApiErrorInfo } from '@/services/http/errors'
import { DEFAULT_PAGE_SIZE, ROLE_LABELS, ROLE_OPTIONS } from '@/utils/constants'
import { isAdmin } from '@/utils/permissions'

import type { UserFormValues } from '@/features/users/user-schema'
import type { UserRequestDTO, UserResponseDTO, UserRole, UserFilterParams } from '@/types/api'

const USERS_SORT = 'name,asc'

function buildUserListParams({
  page,
  role,
  search,
}: {
  search: string
  role: UserRole | ''
  page: number
}): UserFilterParams {
  return {
    search: search || undefined,
    role: role || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
    sort: USERS_SORT,
  }
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const canManage = isAdmin(currentUser)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserResponseDTO | null>(null)
  const [editingUser, setEditingUser] = useState<UserResponseDTO | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserResponseDTO | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const userListParams = buildUserListParams({
    search: debouncedSearch,
    role: roleFilter,
    page,
  })

  const usersQuery = useQuery({
    queryKey: ['users', 'list', userListParams],
    queryFn: () => listUsers(userListParams),
    placeholderData: (previousData) => previousData,
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
    return <Loader label="Carregando usuários..." />
  }

  if (usersQuery.isError || !usersQuery.data) {
    return (
      <EmptyState
        title="Não foi possível carregar os usuários."
        description="Verifique a autenticação e tente novamente."
      />
    )
  }

  const usersPage = usersQuery.data
  const users = usersPage.content

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
      toast.success('Usuário excluído com sucesso.')
    } catch (error) {
      toast.error(getApiErrorInfo(error).message)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Gestão de Usuários"
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditingUser(null)
                setIsFormOpen(true)
              }}
              title="Criar novo usuário"
            >
              <Plus size={16} />
              Novo usuário
            </Button>
          ) : null
        }
      />

      {!canManage ? (
        <Card className="notice-card">
          <strong>Somente leitura</strong>
          <p>Seu perfil não possui permissão para gerenciar usuários.</p>
        </Card>
      ) : null}

      <Card>
        <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
              className="input"
              placeholder="Busque por nome ou e-mail..."
              value={search}
              onChange={(event) => {
                setPage(0)
                setSearch(event.target.value)
              }}
          />
        </div>
          <div className="toolbar-filters">
            <select
              className="input"
              value={roleFilter}
              onChange={(event) => {
                setPage(0)
                setRoleFilter(event.target.value as UserRole | '')
              }}
            >
              <option value="">Todas as permissões</option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          data={users}
          rowKey={(user) => user.id}
          emptyState={
            <EmptyState
              icon={<UserRound size={18} />}
              title="Nenhum usuário encontrado."
              description="Ajuste os filtros ou cadastre um novo registro para continuar."
            />
          }
          columns={[
            {
              key: 'name',
              header: 'Usuário',
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
                  <button
                    className="icon-button"
                    onClick={() => setSelectedUser(user)}
                    title="Ver detalhes do usuário"
                  >
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
                        title="Editar usuário"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => setUserToDelete(user)}
                        title="Excluir usuário"
                      >
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
          page={usersPage.number}
          totalPages={usersPage.totalPages}
          totalItems={usersPage.totalElements}
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
        title="Excluir usuário"
        description={userToDelete ? `Deseja remover o usuário ${userToDelete.name}?` : ''}
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

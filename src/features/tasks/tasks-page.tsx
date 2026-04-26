import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import {
  Briefcase,
  Check,
  CircleAlert,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
} from 'lucide-react'
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
import { TaskDetailsDialog } from '@/features/tasks/task-details-dialog'
import { TaskFormDialog } from '@/features/tasks/task-form-dialog'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { listLeads } from '@/services/api/leads-service'
import { listOpportunities } from '@/services/api/opportunities-service'
import { createTask, deleteTask, listTasks, updateTask } from '@/services/api/tasks-service'
import { listUsers } from '@/services/api/users-service'
import { getApiErrorInfo } from '@/services/http/errors'
import { fetchAllPages } from '@/services/http/pagination'
import {
  DEFAULT_PAGE_SIZE,
  REFERENCE_PAGE_SIZE,
  TASK_DEADLINE_FILTER_OPTIONS,
  TASK_LINK_TYPE_FILTER_OPTIONS,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
} from '@/utils/constants'
import { formatDate, formatNumber } from '@/utils/format'

import type { TaskFormValues } from '@/features/tasks/task-schema'
import type {
  LeadResponseDTO,
  OpportunityResponseDTO,
  TaskDeadlineFilter,
  TaskFilterParams,
  TaskLinkTypeFilter,
  TaskRequestDTO,
  TaskResponseDTO,
  TaskStatus,
  UserResponseDTO,
} from '@/types/api'
import type { LucideIcon } from 'lucide-react'

type TaskRelationKind = 'lead' | 'opportunity' | 'missing'

interface TaskRelationMeta {
  kind: TaskRelationKind
  label: string
  name: string
  tone: 'info' | 'primary' | 'danger'
  icon: LucideIcon
}

const TASKS_SORT = 'dueDate,asc'

function toTaskPayload(values: TaskFormValues): TaskRequestDTO {
  const isLeadRelation = values.relationType === 'LEAD'

  return {
    title: values.title,
    description: values.description || null,
    taskStatus: values.taskStatus,
    dueDate: values.dueDate,
    leadId: isLeadRelation ? Number(values.leadId) : null,
    opportunityId: isLeadRelation ? null : Number(values.opportunityId),
  }
}

function toCompletedTaskPayload(task: TaskResponseDTO): TaskRequestDTO {
  const isOpportunityTask = Boolean(task.opportunityId)

  return {
    title: task.title,
    description: task.description || null,
    taskStatus: 'COMPLETED',
    dueDate: task.dueDate,
    leadId: isOpportunityTask ? null : task.leadId ?? null,
    opportunityId: isOpportunityTask ? task.opportunityId : null,
  }
}

function buildTaskListParams({
  deadline,
  linkType,
  page,
  search,
  status,
}: {
  search: string
  status: TaskStatus | ''
  deadline: TaskDeadlineFilter | ''
  linkType: TaskLinkTypeFilter | ''
  page: number
}): TaskFilterParams {
  return {
    search: search || undefined,
    status: status || undefined,
    deadline: deadline || undefined,
    linkType: linkType || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
    sort: TASKS_SORT,
  }
}

function buildTaskCountParams({
  deadline,
  linkType,
  search,
  status,
}: {
  search: string
  status?: TaskStatus
  deadline?: TaskDeadlineFilter
  linkType: TaskLinkTypeFilter | ''
}): TaskFilterParams {
  return {
    search: search || undefined,
    status,
    deadline,
    linkType: linkType || undefined,
    page: 0,
    size: 1,
    sort: TASKS_SORT,
  }
}

function getTaskRelationMeta(
  task: TaskResponseDTO,
  leads: LeadResponseDTO[],
  opportunities: OpportunityResponseDTO[],
): TaskRelationMeta {
  if (task.opportunityId) {
    const opportunity = opportunities.find((item) => item.id === task.opportunityId)

    return {
      kind: 'opportunity',
      label: 'Oportunidade',
      name: opportunity?.title || `Oportunidade #${task.opportunityId}`,
      tone: 'primary',
      icon: Briefcase,
    }
  }

  if (task.leadId) {
    const lead = leads.find((item) => item.id === task.leadId)

    return {
      kind: 'lead',
      label: 'Lead',
      name: lead?.name || `Lead #${task.leadId}`,
      tone: 'info',
      icon: User,
    }
  }

  return {
    kind: 'missing',
    label: 'Sem vínculo',
    name: 'Vínculo obrigatório pendente',
    tone: 'danger',
    icon: CircleAlert,
  }
}

function TaskRelationCell({ relation }: { relation: TaskRelationMeta }) {
  const Icon = relation.icon

  return (
    <div className={`task-relation-cell task-relation-cell-${relation.kind}`}>
      <span className="task-relation-icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <div className="task-relation-copy">
        <Badge tone={relation.tone}>{relation.label}</Badge>
        <strong>{relation.name}</strong>
      </div>
    </div>
  )
}

function getDueTone(task: TaskResponseDTO) {
  if (task.taskStatus === 'COMPLETED') {
    return 'success' as const
  }

  const difference = differenceInCalendarDays(parseISO(task.dueDate), startOfDay(new Date()))

  if (difference < 0) {
    return 'danger' as const
  }

  if (difference <= 3) {
    return 'warning' as const
  }

  return 'info' as const
}

function getTaskOwnerName(
  task: TaskResponseDTO,
  users: UserResponseDTO[],
  currentUser: UserResponseDTO,
) {
  if (task.userName) {
    return task.userName
  }

  if (task.user?.name) {
    return task.user.name
  }

  if (task.userId === currentUser.id) {
    return currentUser.name
  }

  return users.find((user) => user.id === task.userId)?.name || 'Responsável não informado'
}

export default function TasksPage() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((state) => state.user)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [deadlineFilter, setDeadlineFilter] = useState<TaskDeadlineFilter | ''>('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskResponseDTO | null>(null)
  const [editingTask, setEditingTask] = useState<TaskResponseDTO | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<TaskResponseDTO | null>(null)
  const [taskToComplete, setTaskToComplete] = useState<TaskResponseDTO | null>(null)
  const [relationFilter, setRelationFilter] = useState<TaskLinkTypeFilter | ''>('')

  const debouncedSearch = useDebouncedValue(search)
  const taskListParams = buildTaskListParams({
    search: debouncedSearch,
    status: statusFilter,
    deadline: deadlineFilter,
    linkType: relationFilter,
    page,
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks', 'list', taskListParams],
    queryFn: () => listTasks(taskListParams),
    placeholderData: (previousData) => previousData,
  })

  const leadsQuery = useQuery({
    queryKey: ['leads', 'reference', { sort: 'name,asc' }],
    queryFn: () => fetchAllPages(listLeads, { size: REFERENCE_PAGE_SIZE, sort: 'name,asc' }),
  })

  const opportunitiesQuery = useQuery({
    queryKey: ['opportunities', 'reference', { sort: 'title,asc' }],
    queryFn: () =>
      fetchAllPages(listOpportunities, {
        size: REFERENCE_PAGE_SIZE,
        sort: 'title,asc',
      }),
  })

  const usersQuery = useQuery({
    queryKey: ['users', 'reference', { sort: 'name,asc' }],
    queryFn: () =>
      fetchAllPages(listUsers, { size: REFERENCE_PAGE_SIZE, sort: 'name,asc' }).catch(
        () => [],
      ),
  })

  const pendingCountQuery = useQuery({
    queryKey: [
      'tasks',
      'count',
      buildTaskCountParams({
        search: debouncedSearch,
        status: 'PENDING',
        linkType: relationFilter,
      }),
    ],
    queryFn: async () =>
      (
        await listTasks(
          buildTaskCountParams({
            search: debouncedSearch,
            status: 'PENDING',
            linkType: relationFilter,
          }),
        )
      ).totalElements,
  })

  const completedCountQuery = useQuery({
    queryKey: [
      'tasks',
      'count',
      buildTaskCountParams({
        search: debouncedSearch,
        status: 'COMPLETED',
        linkType: relationFilter,
      }),
    ],
    queryFn: async () =>
      (
        await listTasks(
          buildTaskCountParams({
            search: debouncedSearch,
            status: 'COMPLETED',
            linkType: relationFilter,
          }),
        )
      ).totalElements,
  })

  const overdueCountQuery = useQuery({
    queryKey: [
      'tasks',
      'count',
      buildTaskCountParams({
        search: debouncedSearch,
        deadline: 'OVERDUE',
        linkType: relationFilter,
      }),
    ],
    queryFn: async () =>
      (
        await listTasks(
          buildTaskCountParams({
            search: debouncedSearch,
            deadline: 'OVERDUE',
            linkType: relationFilter,
          }),
        )
      ).totalElements,
  })

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TaskRequestDTO }) =>
      updateTask(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setTaskToDelete(null)
    },
  })

  if (
    tasksQuery.isLoading ||
    leadsQuery.isLoading ||
    opportunitiesQuery.isLoading ||
    usersQuery.isLoading
  ) {
    return <Loader label="Carregando tarefas..." />
  }

  if (
    tasksQuery.isError ||
    leadsQuery.isError ||
    opportunitiesQuery.isError ||
    !tasksQuery.data ||
    !leadsQuery.data ||
    !opportunitiesQuery.data ||
    !usersQuery.data
  ) {
    return (
      <EmptyState
        title="Não foi possível carregar as tarefas."
        description="Verifique a disponibilidade dos dados necessários e tente novamente."
      />
    )
  }

  if (!currentUser) {
    return (
      <EmptyState
        title="Usuário não identificado"
        description="Não foi possível identificar o usuário logado para carregar as tarefas."
      />
    )
  }

  const tasksPage = tasksQuery.data
  const tasks = tasksPage.content
  const pendingCount =
    pendingCountQuery.data ??
    tasks.filter((task) => task.taskStatus !== 'COMPLETED').length
  const completedCount =
    completedCountQuery.data ??
    tasks.filter((task) => task.taskStatus === 'COMPLETED').length
  const overdueCount =
    overdueCountQuery.data ??
    tasks.filter((task) => {
      const difference = differenceInCalendarDays(parseISO(task.dueDate), startOfDay(new Date()))
      return task.taskStatus !== 'COMPLETED' && difference < 0
    }).length

  const handleSaveTask = async (values: TaskFormValues) => {
    const payload = toTaskPayload(values)

    if (editingTask) {
      await updateMutation.mutateAsync({ id: editingTask.id, payload })
      setEditingTask(null)
      return
    }

    await createMutation.mutateAsync(payload)
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) {
      return
    }

    try {
      await deleteMutation.mutateAsync(taskToDelete.id)
      toast.success('Tarefa excluída com sucesso.')
    } catch (error) {
      toast.error(getApiErrorInfo(error).message)
    }
  }

  const handleCompleteTask = async () => {
    if (!taskToComplete) {
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: taskToComplete.id,
        payload: toCompletedTaskPayload(taskToComplete),
      })
      setTaskToComplete(null)
      toast.success('Tarefa concluída com sucesso.')
    } catch (error) {
      toast.error(getApiErrorInfo(error).message)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Gestão de Tarefas"
        actions={
          <Button
            onClick={() => {
              setEditingTask(null)
              setIsFormOpen(true)
            }}
            title="Criar nova tarefa"
          >
            <Plus size={16} />
            Nova tarefa
          </Button>
        }
      />

      <section className="stats-grid stats-grid-compact">
        <Card className="mini-stat-card">
          <span>Pendentes</span>
          <strong>{formatNumber(pendingCount)}</strong>
        </Card>
        <Card className="mini-stat-card">
          <span>Concluídas</span>
          <strong>{formatNumber(completedCount)}</strong>
        </Card>
        <Card className="mini-stat-card">
          <span>Atrasadas</span>
          <strong>{formatNumber(overdueCount)}</strong>
        </Card>
      </section>

      <Card>
        <div className="toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              className="input"
              placeholder="Busque por título ou descrição..."
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
              value={statusFilter}
              onChange={(event) => {
                setPage(0)
                setStatusFilter(event.target.value as TaskStatus | '')
              }}
            >
              <option value="">Todos os status</option>
              {TASK_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={deadlineFilter}
              onChange={(event) => {
                setPage(0)
                setDeadlineFilter(event.target.value as TaskDeadlineFilter | '')
              }}
            >
              <option value="">Todos os prazos</option>
              {TASK_DEADLINE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={relationFilter}
              onChange={(event) => {
                setPage(0)
                setRelationFilter(event.target.value as TaskLinkTypeFilter | '')
              }}
            >
              <option value="">Todos os vínculos</option>
              {TASK_LINK_TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          data={tasks}
          rowKey={(task) => task.id}
          emptyState={
            <EmptyState
              title="Nenhuma tarefa encontrada."
              description="Ajuste os filtros ou cadastre um novo registro para continuar."
            />
          }
          columns={[
            {
              key: 'title',
              header: 'Tarefa',
              cell: (task) => (
                <div className="cell-stack">
                  <strong>{task.title}</strong>
                  <Badge tone="info">
                    {getTaskOwnerName(task, usersQuery.data, currentUser)}
                  </Badge>
                  <span
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      wordBreak: 'break-word',
                    }}
                  >
                    {task.description || 'Sem descrição adicional'}
                  </span>
                </div>
              ),
            },
            {
              key: 'dueDate',
              header: 'Vencimento',
              cell: (task) => <Badge tone={getDueTone(task)}>{formatDate(task.dueDate)}</Badge>,
            },
            {
              key: 'status',
              header: 'Status',
              cell: (task) => (
                <Badge tone={task.taskStatus === 'COMPLETED' ? 'success' : 'warning'}>
                  {TASK_STATUS_LABELS[task.taskStatus || 'PENDING']}
                </Badge>
              ),
            },
            {
              key: 'links',
              header: 'Vínculo',
              cell: (task) => (
                <TaskRelationCell
                  relation={getTaskRelationMeta(task, leadsQuery.data, opportunitiesQuery.data)}
                />
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              className: 'cell-actions task-actions-cell',
              cell: (task) => (
                <div className="table-actions">
                  <button
                    className="icon-button"
                    onClick={() => setSelectedTask(task)}
                    aria-label={`Ver tarefa ${task.title}`}
                    title="Ver detalhes da tarefa"
                  >
                    <Eye size={16} />
                  </button>
                  {task.taskStatus !== 'COMPLETED' ? (
                    <button
                      className="icon-button success"
                      onClick={() => setTaskToComplete(task)}
                      aria-label={`Concluir tarefa ${task.title}`}
                      title="Concluir a tarefa"
                    >
                      <Check size={16} />
                    </button>
                  ) : null}
                  <button
                    className="icon-button"
                    onClick={() => {
                      setEditingTask(task)
                      setIsFormOpen(true)
                    }}
                    aria-label={`Editar tarefa ${task.title}`}
                    title="Editar a tarefa"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-button danger"
                    onClick={() => setTaskToDelete(task)}
                    aria-label={`Excluir tarefa ${task.title}`}
                    title="Excluir a tarefa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
        />

        <Pagination
          page={tasksPage.number}
          totalPages={tasksPage.totalPages}
          totalItems={tasksPage.totalElements}
          onPageChange={setPage}
        />
      </Card>

      <TaskFormDialog
        open={isFormOpen}
        task={editingTask}
        leads={leadsQuery.data}
        opportunities={opportunitiesQuery.data}
        loading={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) {
            setEditingTask(null)
          }
        }}
        onSubmit={handleSaveTask}
      />

      <TaskDetailsDialog
        open={Boolean(selectedTask)}
        task={selectedTask}
        leads={leadsQuery.data}
        opportunities={opportunitiesQuery.data}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTask(null)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Excluir tarefa"
        description={taskToDelete ? `Deseja remover a tarefa ${taskToDelete.title}?` : ''}
        loading={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToDelete(null)
          }
        }}
        onConfirm={handleDeleteTask}
      />

      <ConfirmDialog
        open={Boolean(taskToComplete)}
        title="Concluir tarefa"
        description={
          taskToComplete
            ? `Deseja marcar a tarefa ${taskToComplete.title} como concluída?`
            : ''
        }
        confirmLabel="Concluir tarefa"
        tone="primary"
        loading={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToComplete(null)
          }
        }}
        onConfirm={handleCompleteTask}
      />
    </div>
  )
}

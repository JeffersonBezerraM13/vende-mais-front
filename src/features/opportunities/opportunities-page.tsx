import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BadgeDollarSign,
  Eye,
  Pencil,
  Plus,
  Search,
  Stamp,
  Trash2,
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
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useAuthStore } from '@/features/auth/auth-store'
import { OpportunityCloseDialog } from '@/features/opportunities/opportunity-close-dialog'
import { OpportunityDetailsDialog } from '@/features/opportunities/opportunity-details-dialog'
import { OpportunityFormDialog } from '@/features/opportunities/opportunity-form-dialog'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { listLeads } from '@/services/api/leads-service'
import {
  closeOpportunity,
  createOpportunity,
  deleteOpportunity,
  listOpportunities,
  updateOpportunity,
} from '@/services/api/opportunities-service'
import { listPipelines } from '@/services/api/pipelines-service'
import { getApiErrorInfo } from '@/services/http/errors'
import { fetchAllPages } from '@/services/http/pagination'
import {
  DEFAULT_PAGE_SIZE,
  OPPORTUNITY_STATUS_FILTER_OPTIONS,
  REFERENCE_PAGE_SIZE,
  SOLUTION_LABELS,
} from '@/utils/constants'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import {
  getOpportunityLifecycle,
  getOpportunityLifecycleLabel,
  isOpportunityClosed,
} from '@/utils/opportunities'
import { isAdmin } from '@/utils/permissions'

import type {
  CloseOpportunityFormValues,
  OpportunityFormValues,
} from '@/features/opportunities/opportunity-schema'
import type {
  OpportunityFilterParams,
  OpportunityRequestDTO,
  OpportunityResponseDTO,
  OpportunityStatusFilter,
  PipelineResponseDTO,
} from '@/types/api'

type OpportunityViewMode = 'table' | 'kanban'

const OPPORTUNITIES_SORT = 'createdAt,desc'

function toOpportunityPayload(values: OpportunityFormValues): OpportunityRequestDTO {
  return {
    leadId: Number(values.leadId),
    title: values.title,
    definitiveSolution: values.definitiveSolution,
    estimatedValue: values.estimatedValue ? Number(values.estimatedValue) : undefined,
    pipelineId: Number(values.pipelineId),
    currentStageId: values.currentStageId ? Number(values.currentStageId) : undefined,
    expectedCloseDate: values.expectedCloseDate || undefined,
    notes: values.notes || undefined,
  }
}

function buildKanbanColumns(
  opportunities: OpportunityResponseDTO[],
  pipeline?: PipelineResponseDTO,
) {
  const stages = pipeline
    ? [...pipeline.stages]
        .sort((left, right) => left.position - right.position)
        .map((stage) => stage.name)
    : Array.from(
        new Set(
          opportunities
            .map((opportunity) => opportunity.currentStageName || 'Sem etapa')
            .filter(Boolean),
        ),
      )

  return [...stages, 'Ganhas', 'Perdidas']
}

function buildOpportunityListParams({
  page,
  pipelineId,
  search,
  status,
}: {
  search: string
  status: OpportunityStatusFilter | ''
  pipelineId: string
  page: number
}): OpportunityFilterParams {
  return {
    search: search || undefined,
    status: status || undefined,
    pipelineId: pipelineId ? Number(pipelineId) : undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
    sort: OPPORTUNITIES_SORT,
  }
}

function buildOpportunityCountParams({
  pipelineId,
  search,
  status,
}: {
  search: string
  status: OpportunityStatusFilter
  pipelineId: string
}): OpportunityFilterParams {
  return {
    search: search || undefined,
    status,
    pipelineId: pipelineId ? Number(pipelineId) : undefined,
    page: 0,
    size: 1,
    sort: OPPORTUNITIES_SORT,
  }
}

export default function OpportunitiesPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OpportunityStatusFilter | ''>('')
  const [pipelineFilter, setPipelineFilter] = useState('')
  const [viewMode, setViewMode] = useState<OpportunityViewMode>('table')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<OpportunityResponseDTO | null>(null)
  const [editingOpportunity, setEditingOpportunity] =
    useState<OpportunityResponseDTO | null>(null)
  const [closingOpportunity, setClosingOpportunity] =
    useState<OpportunityResponseDTO | null>(null)
  const [opportunityToDelete, setOpportunityToDelete] =
    useState<OpportunityResponseDTO | null>(null)

  const debouncedSearch = useDebouncedValue(search)

  const leadsQuery = useQuery({
    queryKey: ['leads', 'reference', { sort: 'name,asc' }],
    queryFn: () => fetchAllPages(listLeads, { size: REFERENCE_PAGE_SIZE, sort: 'name,asc' }),
  })

  const pipelinesQuery = useQuery({
    queryKey: ['pipelines', 'reference', { sort: 'title,asc' }],
    queryFn: () =>
      fetchAllPages(listPipelines, { size: REFERENCE_PAGE_SIZE, sort: 'title,asc' }),
  })
  const leads = leadsQuery.data ?? []
  const pipelines = pipelinesQuery.data ?? []
  const firstPipelineId = pipelines[0] ? String(pipelines[0].id) : ''
  const effectivePipelineFilter =
    viewMode === 'kanban' && !pipelineFilter ? firstPipelineId : pipelineFilter
  const selectedPipeline = pipelines.find(
    (pipeline) => String(pipeline.id) === effectivePipelineFilter,
  )

  const opportunityListParams = buildOpportunityListParams({
    search: debouncedSearch,
    status: statusFilter,
    pipelineId: effectivePipelineFilter,
    page,
  })

  const opportunitiesQuery = useQuery({
    queryKey: ['opportunities', 'list', opportunityListParams],
    queryFn: () => listOpportunities(opportunityListParams),
    placeholderData: (previousData) => previousData,
  })

  const openCountQuery = useQuery({
    queryKey: [
      'opportunities',
      'count',
      buildOpportunityCountParams({
        search: debouncedSearch,
        status: 'OPEN',
        pipelineId: effectivePipelineFilter,
      }),
    ],
    queryFn: async () =>
      (
        await listOpportunities(
          buildOpportunityCountParams({
            search: debouncedSearch,
            status: 'OPEN',
            pipelineId: effectivePipelineFilter,
          }),
        )
      ).totalElements,
  })

  const wonCountQuery = useQuery({
    queryKey: [
      'opportunities',
      'count',
      buildOpportunityCountParams({
        search: debouncedSearch,
        status: 'WON',
        pipelineId: effectivePipelineFilter,
      }),
    ],
    queryFn: async () =>
      (
        await listOpportunities(
          buildOpportunityCountParams({
            search: debouncedSearch,
            status: 'WON',
            pipelineId: effectivePipelineFilter,
          }),
        )
      ).totalElements,
  })

  const lostCountQuery = useQuery({
    queryKey: [
      'opportunities',
      'count',
      buildOpportunityCountParams({
        search: debouncedSearch,
        status: 'LOST',
        pipelineId: effectivePipelineFilter,
      }),
    ],
    queryFn: async () =>
      (
        await listOpportunities(
          buildOpportunityCountParams({
            search: debouncedSearch,
            status: 'LOST',
            pipelineId: effectivePipelineFilter,
          }),
        )
      ).totalElements,
  })

  const openEstimatedValueQuery = useQuery({
    queryKey: [
      'opportunities',
      'open-estimated-value',
      {
        search: debouncedSearch || undefined,
        pipelineId: effectivePipelineFilter || undefined,
      },
    ],
    queryFn: async () => {
      const openOpportunities = await fetchAllPages<
        OpportunityResponseDTO,
        OpportunityFilterParams
      >(listOpportunities, {
        search: debouncedSearch || undefined,
        status: 'OPEN',
        pipelineId: effectivePipelineFilter
          ? Number(effectivePipelineFilter)
          : undefined,
        size: REFERENCE_PAGE_SIZE,
        sort: OPPORTUNITIES_SORT,
      })

      return openOpportunities.reduce(
        (total, opportunity) => total + (opportunity.estimatedValue ?? 0),
        0,
      )
    },
  })

  const createMutation = useMutation({
    mutationFn: createOpportunity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: OpportunityRequestDTO }) =>
      updateOpportunity(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: { win: boolean; lossReason?: string }
    }) => closeOpportunity(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] })
      setOpportunityToDelete(null)
    },
  })

  if (leadsQuery.isLoading || pipelinesQuery.isLoading || opportunitiesQuery.isLoading) {
    return <Loader label="Carregando oportunidades..." />
  }

  if (
    leadsQuery.isError ||
    pipelinesQuery.isError ||
    opportunitiesQuery.isError ||
    !leadsQuery.data ||
    !pipelinesQuery.data ||
    !opportunitiesQuery.data
  ) {
    return (
      <EmptyState
        title="Não foi possível carregar as oportunidades."
        description="Verifique a disponibilidade dos dados necessários e tente novamente."
      />
    )
  }

  const opportunitiesPage = opportunitiesQuery.data
  const opportunities = opportunitiesPage.content
  const kanbanColumns = buildKanbanColumns(opportunities, selectedPipeline)

  const openCount =
    openCountQuery.data ??
    opportunities.filter((opportunity) => getOpportunityLifecycle(opportunity) === 'open')
      .length
  const wonCount =
    wonCountQuery.data ??
    opportunities.filter((opportunity) => getOpportunityLifecycle(opportunity) === 'won')
      .length
  const lostCount =
    lostCountQuery.data ??
    opportunities.filter((opportunity) => getOpportunityLifecycle(opportunity) === 'lost')
      .length
  const openEstimatedValue =
    openEstimatedValueQuery.data ??
    opportunities
      .filter((opportunity) => getOpportunityLifecycle(opportunity) === 'open')
      .reduce((total, opportunity) => total + (opportunity.estimatedValue ?? 0), 0)

  const handleSaveOpportunity = async (values: OpportunityFormValues) => {
    if (editingOpportunity && isOpportunityClosed(editingOpportunity)) {
      throw new Error('Oportunidades fechadas não podem ser editadas neste fluxo.')
    }

    const payload = toOpportunityPayload(values)

    if (editingOpportunity) {
      await updateMutation.mutateAsync({ id: editingOpportunity.id, payload })
      setEditingOpportunity(null)
      return
    }

    await createMutation.mutateAsync(payload)
  }

  const handleCloseOpportunity = async (values: CloseOpportunityFormValues) => {
    if (!closingOpportunity) {
      return
    }

    await closeMutation.mutateAsync({
      id: closingOpportunity.id,
      payload: {
        win: values.outcome === 'won',
        lossReason: values.outcome === 'lost' ? values.lossReason : undefined,
      },
    })
    setClosingOpportunity(null)
  }

  const handleDeleteOpportunity = async () => {
    if (!opportunityToDelete) {
      return
    }

    try {
      await deleteMutation.mutateAsync(opportunityToDelete.id)
      toast.success('Oportunidade excluída com sucesso.')
    } catch (error) {
      toast.error(getApiErrorInfo(error).message)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Gestão de Oportunidades"
        actions={
          <Button
            onClick={() => {
              setEditingOpportunity(null)
              setIsFormOpen(true)
            }}
            title="Criar nova oportunidade"
          >
            <Plus size={16} />
            Nova oportunidade
          </Button>
        }
      />

      <section className="stats-grid stats-grid-compact">
        <Card className="mini-stat-card">
          <span>Abertas</span>
          <strong>{formatNumber(openCount)}</strong>
        </Card>
        <Card className="mini-stat-card">
          <span>Ganhas</span>
          <strong>{formatNumber(wonCount)}</strong>
        </Card>
        <Card className="mini-stat-card">
          <span>Perdidas</span>
          <strong>{formatNumber(lostCount)}</strong>
        </Card>
        <Card className="mini-stat-card">
          <span>Valor Estimado</span>
          <strong>{formatCurrency(openEstimatedValue)}</strong>
        </Card>
      </section>

      <Card>
        <div
          className="toolbar"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="search-field">
              <Search size={16} />
              <input
                className="input"
                placeholder="Busque por lead, título, pipeline, etapa ou observações..."
                value={search}
                onChange={(event) => {
                  setPage(0)
                  setSearch(event.target.value)
                }}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <SegmentedControl
                value={viewMode}
                onChange={(mode) => {
                  setPage(0)
                  setViewMode(mode as OpportunityViewMode)

                  if (mode === 'table') {
                    setPipelineFilter('')
                  }
                }}
                options={[
                  { value: 'table', label: 'Tabela' },
                  { value: 'kanban', label: 'Kanban' },
                ]}
              />
            </div>
          </div>

          <div className="toolbar-filters">
            <select
              className="input"
              value={statusFilter}
              onChange={(event) => {
                setPage(0)
                setStatusFilter(event.target.value as OpportunityStatusFilter | '')
              }}
            >
              <option value="">Todos os status</option>
              {OPPORTUNITY_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={effectivePipelineFilter}
              onChange={(event) => {
                setPage(0)
                setPipelineFilter(event.target.value)
              }}
            >
              {viewMode === 'table' ? <option value="">Todos os funis</option> : null}
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'table' ? (
          <DataTable
            data={opportunities}
            rowKey={(opportunity) => opportunity.id}
            emptyState={
              <EmptyState
                icon={<BadgeDollarSign size={18} />}
                title="Nenhuma oportunidade encontrada."
                description="Ajuste os filtros ou cadastre uma nova negociação para continuar."
              />
            }
            columns={[
              {
                key: 'title',
                header: 'Negociação',
                cell: (opportunity) => {
                  const lead = leads.find((item) => item.id === opportunity.leadId)

                  return (
                    <div className="cell-stack">
                      <strong>{opportunity.title}</strong>
                      <span>{lead?.name || `Lead #${opportunity.leadId}`}</span>
                    </div>
                  )
                },
              },
              {
                key: 'stage',
                header: 'Etapa atual',
                cell: (opportunity) => (
                  <div className="cell-stack">
                    <span>{opportunity.currentStageName || 'Sem etapa'}</span>
                    <small>{formatDate(opportunity.expectedCloseDate)}</small>
                  </div>
                ),
              },
              {
                key: 'solution',
                header: 'Solução',
                cell: (opportunity) => (
                  <span>
                    {SOLUTION_LABELS[opportunity.definitiveSolution] ||
                      opportunity.definitiveSolution}
                  </span>
                ),
              },
              {
                key: 'value',
                header: 'Valor',
                cell: (opportunity) => formatCurrency(opportunity.estimatedValue),
              },
              {
                key: 'status',
                header: 'Status',
                cell: (opportunity) => (
                  <Badge
                    tone={
                      getOpportunityLifecycle(opportunity) === 'won'
                        ? 'success'
                        : getOpportunityLifecycle(opportunity) === 'lost'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {getOpportunityLifecycleLabel(opportunity)}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Ações',
                className: 'cell-actions',
                cell: (opportunity) => (
                  <div className="table-actions">
                    <button
                      className="icon-button"
                      onClick={() => setSelectedOpportunity(opportunity)}
                      title="Ver detalhes da oportunidade"
                    >
                      <Eye size={16} />
                    </button>
                    {!isOpportunityClosed(opportunity) ? (
                      <button
                        className="icon-button"
                        onClick={() => {
                          setEditingOpportunity(opportunity)
                          setIsFormOpen(true)
                        }}
                        title="Editar oportunidade"
                      >
                        <Pencil size={16} />
                      </button>
                    ) : null}
                    {getOpportunityLifecycle(opportunity) === 'open' ? (
                      <button
                        className="icon-button"
                        onClick={() => setClosingOpportunity(opportunity)}
                        title="Fechar oportunidade"
                      >
                        <Stamp size={16} />
                      </button>
                    ) : null}
                    {isAdmin(user) ? (
                      <button
                        className="icon-button danger"
                        onClick={() => setOpportunityToDelete(opportunity)}
                        title="Excluir oportunidade"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <div className="kanban-board">
            {kanbanColumns.map((column) => {
              const columnItems = opportunities.filter((opportunity) => {
                const lifecycle = getOpportunityLifecycle(opportunity)

                if (column === 'Ganhas') {
                  return lifecycle === 'won'
                }

                if (column === 'Perdidas') {
                  return lifecycle === 'lost'
                }

                return (
                  lifecycle === 'open' &&
                  (opportunity.currentStageName || 'Sem etapa') === column
                )
              })

              return (
                <section key={column} className="kanban-column">
                  <header>
                    <strong>{column}</strong>
                    <Badge tone="neutral">{columnItems.length}</Badge>
                  </header>
                  <div className="kanban-cards">
                    {columnItems.length ? (
                      columnItems.map((opportunity) => {
                        const lead = leads.find((item) => item.id === opportunity.leadId)

                        return (
                          <article key={opportunity.id} className="kanban-card">
                            <div className="entity-card-header">
                              <strong>{opportunity.title}</strong>
                              <Badge
                                tone={
                                  getOpportunityLifecycle(opportunity) === 'won'
                                    ? 'success'
                                    : getOpportunityLifecycle(opportunity) === 'lost'
                                      ? 'danger'
                                      : 'warning'
                                }
                              >
                                {getOpportunityLifecycleLabel(opportunity)}
                              </Badge>
                            </div>
                            <span>{lead?.name || `Lead #${opportunity.leadId}`}</span>
                            <p>{formatCurrency(opportunity.estimatedValue)}</p>
                            <div className="table-actions">
                              <button
                                className="icon-button"
                                onClick={() => setSelectedOpportunity(opportunity)}
                                title="Ver detalhes da oportunidade"
                              >
                                <Eye size={16} />
                              </button>
                              {!isOpportunityClosed(opportunity) ? (
                                <button
                                  className="icon-button"
                                  onClick={() => {
                                    setEditingOpportunity(opportunity)
                                    setIsFormOpen(true)
                                  }}
                                  title="Editar oportunidade"
                                >
                                  <Pencil size={16} />
                                </button>
                              ) : null}
                            </div>
                          </article>
                        )
                      })
                    ) : (
                      <div className="kanban-empty">Nenhuma oportunidade.</div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        <Pagination
          page={opportunitiesPage.number}
          totalPages={opportunitiesPage.totalPages}
          totalItems={opportunitiesPage.totalElements}
          onPageChange={setPage}
        />
      </Card>

      <OpportunityFormDialog
        open={isFormOpen}
        opportunity={editingOpportunity}
        leads={leads}
        pipelines={pipelines}
        loading={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) {
            setEditingOpportunity(null)
          }
        }}
        onSubmit={handleSaveOpportunity}
      />

      <OpportunityDetailsDialog
        open={Boolean(selectedOpportunity)}
        opportunity={selectedOpportunity}
        leads={leads}
        pipelines={pipelines}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOpportunity(null)
          }
        }}
      />

      <OpportunityCloseDialog
        open={Boolean(closingOpportunity)}
        opportunity={closingOpportunity}
        loading={closeMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setClosingOpportunity(null)
          }
        }}
        onSubmit={handleCloseOpportunity}
      />

      <ConfirmDialog
        open={Boolean(opportunityToDelete)}
        title="Excluir oportunidade"
        description={
          opportunityToDelete
            ? `Deseja remover a oportunidade ${opportunityToDelete.title}?`
            : 'Deseja remover esta oportunidade?'
        }
        loading={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setOpportunityToDelete(null)
          }
        }}
        onConfirm={handleDeleteOpportunity}
      />
    </div>
  )
}

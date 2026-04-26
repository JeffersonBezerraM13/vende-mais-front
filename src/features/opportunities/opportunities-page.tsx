import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BadgeDollarSign,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Stamp,
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
import { createLocalPage, fetchAllPages } from '@/services/http/pagination'
import { SOLUTION_LABELS } from '@/utils/constants'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
import {
  getOpportunityLifecycle,
  getOpportunityLifecycleLabel,
} from '@/utils/opportunities'
import { isAdmin } from '@/utils/permissions'

import type {
  CloseOpportunityFormValues,
  OpportunityFormValues,
} from '@/features/opportunities/opportunity-schema'
import type {
  OpportunityRequestDTO,
  OpportunityResponseDTO,
  PipelineResponseDTO,
} from '@/types/api'

type OpportunityViewMode = 'table' | 'cards' | 'kanban'
type OpportunityStatusFilter = 'all' | 'open' | 'won' | 'lost'

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
            .map((opportunity) => opportunity.currentStageName || 'Sem stage')
            .filter(Boolean),
        ),
      )

  return [...stages, 'Ganhas', 'Perdidas']
}

export default function OpportunitiesPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OpportunityStatusFilter>('all')
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

  const opportunitiesQuery = useQuery({
    queryKey: ['opportunities'],
    queryFn: () =>
      fetchAllPages(listOpportunities, { size: 100, sort: 'createdAt,desc' }),
  })

  const leadsQuery = useQuery({
    queryKey: ['leads', 'reference'],
    queryFn: () => fetchAllPages(listLeads, { size: 100, sort: 'name,asc' }),
  })

  const pipelinesQuery = useQuery({
    queryKey: ['pipelines', 'reference'],
    queryFn: () => fetchAllPages(listPipelines, { size: 100, sort: 'title,asc' }),
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

  if (
    opportunitiesQuery.isLoading ||
    leadsQuery.isLoading ||
    pipelinesQuery.isLoading
  ) {
    return <Loader label="Carregando oportunidades..." />
  }

  if (
    opportunitiesQuery.isError ||
    leadsQuery.isError ||
    pipelinesQuery.isError ||
    !opportunitiesQuery.data ||
    !leadsQuery.data ||
    !pipelinesQuery.data
  ) {
    return (
      <EmptyState
        title="Falha ao carregar oportunidades"
        description="O modulo depende das coleções de oportunidades, leads e pipelines."
      />
    )
  }

  const opportunities = opportunitiesQuery.data
  const leads = leadsQuery.data
  const pipelines = pipelinesQuery.data
  const firstPipelineId = pipelines[0] ? String(pipelines[0].id) : ''
  const effectivePipelineFilter =
    viewMode === 'kanban' && pipelineFilter === '' ? firstPipelineId : pipelineFilter
  const selectedPipeline = pipelines.find(
    (pipeline) => String(pipeline.id) === effectivePipelineFilter,
  )

  const filteredOpportunities = opportunities.filter((opportunity) => {
    const lead = leads.find((item) => item.id === opportunity.leadId)
    const matchesSearch =
      !search ||
      [
        opportunity.title,
        opportunity.currentStageName,
        opportunity.notes,
        lead?.name,
        lead?.companyName,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search.toLowerCase()))
    const lifecycle = getOpportunityLifecycle(opportunity)
    const matchesStatus = statusFilter === 'all' || lifecycle === statusFilter
    const matchesPipeline =
      !effectivePipelineFilter || String(opportunity.pipelineId) === effectivePipelineFilter

    return matchesSearch && matchesStatus && matchesPipeline
  })

  const localPage = createLocalPage(filteredOpportunities, page)
  const kanbanColumns = buildKanbanColumns(filteredOpportunities, selectedPipeline)

  const openCount = opportunities.filter(
    (opportunity) => getOpportunityLifecycle(opportunity) === 'open',
  ).length
  const wonCount = opportunities.filter(
    (opportunity) => getOpportunityLifecycle(opportunity) === 'won',
  ).length
  const lostCount = opportunities.filter(
    (opportunity) => getOpportunityLifecycle(opportunity) === 'lost',
  ).length

  const openEstimatedValue = opportunities
      .filter((opportunity) => getOpportunityLifecycle(opportunity) === 'open')
      .reduce((total, opportunity) => total + (opportunity.estimatedValue ?? 0), 0)

  const handleSaveOpportunity = async (values: OpportunityFormValues) => {
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
        title="Oportunidades"
        actions={
          <Button
            onClick={() => {
              setEditingOpportunity(null)
              setIsFormOpen(true)
            }}
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
          <strong>
            {formatCurrency(openEstimatedValue)}
          </strong>
        </Card>
      </section>

      <Card>
        <div
            className="toolbar"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '16px',
              alignItems: 'start'
            }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="search-field">
              <Search size={16} />
              <input
                  className="input"
                  placeholder="Buscar por lead, título de pipeline, etapa ou observações"
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
                    setViewMode(mode)

                    if (mode === 'table') {
                      setPipelineFilter('')
                      setPage(0)
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
                  setStatusFilter(event.target.value as OpportunityStatusFilter)
                }}
            >
              <option value="all">Todos os status</option>
              <option value="open">Abertas</option>
              <option value="won">Ganhos</option>
              <option value="lost">Perdidos</option>
            </select>
            <select
                className="input"
                value={effectivePipelineFilter}
                onChange={(event) => {
                  setPage(0)
                  setPipelineFilter(event.target.value)
                }}
            >
              {viewMode === 'table' && (
                  <option value="">Todos os funis</option>
              )}
              {pipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.title}
                  </option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'table' ? (
          <>
            <DataTable
              data={localPage.content}
              rowKey={(opportunity) => opportunity.id}
              emptyState={
                <EmptyState
                  icon={<BadgeDollarSign size={18} />}
                  title="Nenhuma oportunidade encontrada"
                  description="Ajuste os filtros ou crie uma nova negociação."
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
                  header: 'Etapa Atual',
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
                        title="Detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => {
                          setEditingOpportunity(opportunity)
                          setIsFormOpen(true)
                        }}
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
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
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
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
          </>
        ) : null}

        {viewMode === 'kanban' ? (
          <div className="kanban-board">
            {kanbanColumns.map((column) => {
              const columnItems = filteredOpportunities.filter((opportunity) => {
                const lifecycle = getOpportunityLifecycle(opportunity)

                if (column === 'Ganhas') {
                  return lifecycle === 'won'
                }

                if (column === 'Perdidas') {
                  return lifecycle === 'lost'
                }

                return lifecycle === 'open' && (opportunity.currentStageName || 'Sem stage') === column
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
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="icon-button"
                                onClick={() => {
                                  setEditingOpportunity(opportunity)
                                  setIsFormOpen(true)
                                }}
                              >
                                <Pencil size={16} />
                              </button>
                            </div>
                          </article>
                        )
                      })
                    ) : (
                      <div className="kanban-empty">Sem oportunidades</div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        ) : null}
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

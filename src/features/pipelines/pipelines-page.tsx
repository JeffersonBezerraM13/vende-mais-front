import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2, Workflow } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { Loader } from '@/components/ui/loader'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { useAuthStore } from '@/features/auth/auth-store'
import { PipelineFormDialog } from '@/features/pipelines/pipeline-form-dialog'
import { StageFormDialog } from '@/features/pipelines/stage-form-dialog'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import {
  createPipeline,
  createStage,
  deletePipeline,
  deleteStage,
  listPipelines,
  updatePipeline,
  updateStage,
} from '@/services/api/pipelines-service'
import { getApiErrorInfo } from '@/services/http/errors'
import { fetchAllPages } from '@/services/http/pagination'
import { REFERENCE_PAGE_SIZE } from '@/utils/constants'
import { formatNumber } from '@/utils/format'
import { isAdmin } from '@/utils/permissions'

import type {
  PipelineFormValues,
  StageFormValues,
} from '@/features/pipelines/pipeline-schema'
import type {
  PipelineFilterParams,
  PipelineRequestDTO,
  PipelineResponseDTO,
  StageRequestDTO,
  StageResponseDTO,
} from '@/types/api'

const PIPELINES_SORT = 'title,asc'
const PIPELINES_PAGE_SIZE = 6

function toStagePayload(values: StageFormValues): StageRequestDTO {
  return {
    name: values.name,
    code: values.code,
    position: Number(values.position),
    pipelineId: Number(values.pipelineId),
  }
}

function buildPipelineListParams({
  page,
  search,
}: {
  search: string
  page: number
}): PipelineFilterParams {
  return {
    search: search || undefined,
    page,
    size: PIPELINES_PAGE_SIZE,
    sort: PIPELINES_SORT,
  }
}

export default function PipelinesPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const canManage = isAdmin(user)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [isPipelineFormOpen, setIsPipelineFormOpen] = useState(false)
  const [isStageFormOpen, setIsStageFormOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<PipelineResponseDTO | null>(null)
  const [editingStage, setEditingStage] = useState<StageResponseDTO | null>(null)
  const [stagePipelineId, setStagePipelineId] = useState<number | null>(null)
  const [pipelineToDelete, setPipelineToDelete] = useState<PipelineResponseDTO | null>(null)
  const [stageToDelete, setStageToDelete] = useState<StageResponseDTO | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const pipelineListParams = buildPipelineListParams({
    search: debouncedSearch,
    page,
  })

  const pipelineOptionsQuery = useQuery({
    queryKey: ['pipelines', 'reference', { sort: PIPELINES_SORT }],
    queryFn: () =>
      fetchAllPages(listPipelines, {
        size: REFERENCE_PAGE_SIZE,
        sort: PIPELINES_SORT,
      }),
  })

  const pipelinesQuery = useQuery({
    queryKey: ['pipelines', 'list', pipelineListParams],
    queryFn: () => listPipelines(pipelineListParams),
    placeholderData: (previousData) => previousData,
  })

  const createPipelineMutation = useMutation({
    mutationFn: (payload: PipelineRequestDTO) => createPipeline(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
    },
  })

  const updatePipelineMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: PipelineRequestDTO }) =>
      updatePipeline(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
    },
  })

  const deletePipelineMutation = useMutation({
    mutationFn: deletePipeline,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
      setPipelineToDelete(null)
    },
  })

  const createStageMutation = useMutation({
    mutationFn: (payload: StageRequestDTO) => createStage(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
      await queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })

  const updateStageMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: StageRequestDTO }) =>
      updateStage(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
      await queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })

  const deleteStageMutation = useMutation({
    mutationFn: ({ pipelineId, stageId }: { pipelineId: number; stageId: number }) =>
      deleteStage(pipelineId, stageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pipelines'] })
      setStageToDelete(null)
    },
  })

  if (pipelinesQuery.isLoading || pipelineOptionsQuery.isLoading) {
    return <Loader label="Carregando funis..." />
  }

  if (
    pipelinesQuery.isError ||
    pipelineOptionsQuery.isError ||
    !pipelinesQuery.data ||
    !pipelineOptionsQuery.data
  ) {
    return (
      <EmptyState
        title="Não foi possível carregar os funis."
        description="Verifique a disponibilidade do backend e tente novamente."
      />
    )
  }

  const pipelinesPage = pipelinesQuery.data
  const pipelines = pipelinesPage.content
  const pipelineOptions = pipelineOptionsQuery.data

  const handleSavePipeline = async (values: PipelineFormValues) => {
    const payload: PipelineRequestDTO = { title: values.title }

    if (editingPipeline) {
      await updatePipelineMutation.mutateAsync({ id: editingPipeline.id, payload })
      setEditingPipeline(null)
      return
    }

    await createPipelineMutation.mutateAsync(payload)
  }

  const handleSaveStage = async (values: StageFormValues) => {
    const payload = toStagePayload(values)

    if (editingStage) {
      await updateStageMutation.mutateAsync({ id: editingStage.id, payload })
      setEditingStage(null)
      return
    }

    await createStageMutation.mutateAsync(payload)
  }

  const handleDeletePipeline = async () => {
    if (!pipelineToDelete) {
      return
    }

    try {
      await deletePipelineMutation.mutateAsync(pipelineToDelete.id)
      toast.success('Funil excluído com sucesso.')
    } catch (error) {
      toast.error(getApiErrorInfo(error).message)
    }
  }

  const handleDeleteStage = async () => {
    if (!stageToDelete) {
      return
    }

    try {
      await deleteStageMutation.mutateAsync({
        pipelineId: stageToDelete.pipelineId,
        stageId: stageToDelete.id,
      })
      toast.success('Etapa excluída com sucesso.')
    } catch (error) {
      toast.error(getApiErrorInfo(error).message)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Configuração de Funis"
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditingPipeline(null)
                setIsPipelineFormOpen(true)
              }}
              title="Criar novo funil"
            >
              <Plus size={16} />
              Novo funil
            </Button>
          ) : null
        }
      />

      {!canManage ? (
        <Card className="notice-card">
          <strong>Permissão limitada</strong>
          <p>Somente administradores podem criar, editar ou excluir funis e etapas.</p>
        </Card>
      ) : null}

      <Card>
        <div className="toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              className="input"
              placeholder="Busque por nome do funil..."
              value={search}
              onChange={(event) => {
                setPage(0)
                setSearch(event.target.value)
              }}
            />
          </div>
          <div className="toolbar-filters">
            <Badge tone="info">
              {formatNumber(pipelinesPage.totalElements)}{' '}
              {pipelinesPage.totalElements === 1 ? 'funil' : 'funis'}
            </Badge>
          </div>
        </div>

        <div className="pipeline-grid">
          {pipelines.length ? (
            pipelines.map((pipeline) => (
              <article key={pipeline.id} className="pipeline-card">
                <div className="pipeline-card-header">
                  <div>
                    <strong>{pipeline.title}</strong>
                  </div>
                  {canManage ? (
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        onClick={() => {
                          setEditingPipeline(pipeline)
                          setIsPipelineFormOpen(true)
                        }}
                        title="Editar funil"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => setPipelineToDelete(pipeline)}
                        title="Excluir funil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="pipeline-stages">
                  {pipeline.stages.length ? (
                    [...pipeline.stages]
                      .sort((left, right) => left.position - right.position)
                      .map((stage) => (
                        <article key={stage.id} className="stage-row">
                          <div>
                            <div>
                              <strong>
                                {stage.position}. {stage.name}
                              </strong>
                            </div>
                            <div>
                              <span>{stage.code}</span>
                            </div>
                          </div>
                          {canManage ? (
                            <div className="table-actions">
                              <button
                                className="icon-button"
                                onClick={() => {
                                  setEditingStage(stage)
                                  setStagePipelineId(stage.pipelineId)
                                  setIsStageFormOpen(true)
                                }}
                                title="Editar etapa"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="icon-button danger"
                                onClick={() => setStageToDelete(stage)}
                                title="Excluir etapa"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : null}
                        </article>
                      ))
                  ) : (
                    <div className="kanban-empty">Nenhuma etapa cadastrada.</div>
                  )}
                </div>

                {canManage ? (
                  <Button
                    variant="secondary"
                    className="btn-block"
                    onClick={() => {
                      setEditingStage(null)
                      setStagePipelineId(pipeline.id)
                      setIsStageFormOpen(true)
                    }}
                    title={`Adicionar etapa ao funil ${pipeline.title}`}
                  >
                    <Workflow size={16} />
                    Adicionar etapa
                  </Button>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState
              icon={<Workflow size={18} />}
              title="Nenhum funil cadastrado."
              description="Cadastre um novo funil para continuar."
            />
          )}
        </div>

        <Pagination
          page={pipelinesPage.number}
          totalPages={pipelinesPage.totalPages}
          totalItems={pipelinesPage.totalElements}
          onPageChange={setPage}
        />
      </Card>

      <PipelineFormDialog
        open={isPipelineFormOpen}
        pipeline={editingPipeline}
        loading={createPipelineMutation.isPending || updatePipelineMutation.isPending}
        onOpenChange={(open) => {
          setIsPipelineFormOpen(open)
          if (!open) {
            setEditingPipeline(null)
          }
        }}
        onSubmit={handleSavePipeline}
      />

      <StageFormDialog
        open={isStageFormOpen}
        stage={editingStage}
        initialPipelineId={stagePipelineId}
        pipelines={pipelineOptions}
        loading={createStageMutation.isPending || updateStageMutation.isPending}
        onOpenChange={(open) => {
          setIsStageFormOpen(open)
          if (!open) {
            setEditingStage(null)
            setStagePipelineId(null)
          }
        }}
        onSubmit={handleSaveStage}
      />

      <ConfirmDialog
        open={Boolean(pipelineToDelete)}
        title="Excluir funil"
        description={
          pipelineToDelete
            ? `Deseja remover o funil ${pipelineToDelete.title}?`
            : 'Deseja remover este funil?'
        }
        loading={deletePipelineMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setPipelineToDelete(null)
          }
        }}
        onConfirm={handleDeletePipeline}
      />

      <ConfirmDialog
        open={Boolean(stageToDelete)}
        title="Excluir etapa"
        description={
          stageToDelete
            ? `Deseja remover a etapa "${stageToDelete.name}"?`
            : 'Deseja remover esta etapa?'
        }
        loading={deleteStageMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setStageToDelete(null)
          }
        }}
        onConfirm={handleDeleteStage}
      />
    </div>
  )
}

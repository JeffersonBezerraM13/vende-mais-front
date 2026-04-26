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
import { useAuthStore } from '@/features/auth/auth-store'
import { PipelineFormDialog } from '@/features/pipelines/pipeline-form-dialog'
import { StageFormDialog } from '@/features/pipelines/stage-form-dialog'
import {
  createPipeline,
  createStage,
  deletePipeline,
  listPipelines,
  updatePipeline,
  updateStage,
  deleteStage,
} from '@/services/api/pipelines-service'
import { getApiErrorInfo } from '@/services/http/errors'
import { fetchAllPages } from '@/services/http/pagination'
import { formatNumber } from '@/utils/format'
import { isAdmin } from '@/utils/permissions'

import type {
  PipelineFormValues,
  StageFormValues,
} from '@/features/pipelines/pipeline-schema'
import type {
  PipelineRequestDTO,
  PipelineResponseDTO,
  StageRequestDTO,
  StageResponseDTO,
} from '@/types/api'

function toStagePayload(values: StageFormValues): StageRequestDTO {
  return {
    name: values.name,
    code: values.code,
    position: Number(values.position),
    pipelineId: Number(values.pipelineId),
  }
}

export default function PipelinesPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const canManage = isAdmin(user)
  const [search, setSearch] = useState('')
  const [isPipelineFormOpen, setIsPipelineFormOpen] = useState(false)
  const [isStageFormOpen, setIsStageFormOpen] = useState(false)
  const [editingPipeline, setEditingPipeline] = useState<PipelineResponseDTO | null>(null)
  const [editingStage, setEditingStage] = useState<StageResponseDTO | null>(null)
  const [stagePipelineId, setStagePipelineId] = useState<number | null>(null)
  const [pipelineToDelete, setPipelineToDelete] = useState<PipelineResponseDTO | null>(null)
  const [stageToDelete, setStageToDelete] = useState<StageResponseDTO | null>(null)

  const pipelinesQuery = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => fetchAllPages(listPipelines, { size: 100, sort: 'title,asc' }),
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

  if (pipelinesQuery.isLoading) {
    return <Loader label="Carregando funis..." />
  }

  if (pipelinesQuery.isError || !pipelinesQuery.data) {
    return (
      <EmptyState
        title="Falha ao carregar funis"
        description="O backend deve responder aos endpoints de pipelines."
      />
    )
  }

  const pipelines = pipelinesQuery.data.filter((pipeline) =>
    pipeline.title.toLowerCase().includes(search.toLowerCase()),
  )

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
      toast.success('Funil excluido com sucesso.')
    } catch (error) {
      toast.error(getApiErrorInfo(error).message)
    }
  }

  const handleDeleteStage = async () => {
    if (!stageToDelete) return

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
        title="Funis Comerciais"
        actions={
          canManage ? (
            <Button
              onClick={() => {
                setEditingPipeline(null)
                setIsPipelineFormOpen(true)
              }}
            >
              <Plus size={16} />
              Novo Funil
            </Button>
          ) : null
        }
      />

      {!canManage ? (
        <Card className="notice-card">
          <strong>Permissao limitada</strong>
          <p>Somente usuarios ADMIN podem criar, editar ou excluir pipelines e stages.</p>
        </Card>
      ) : null}

      <Card>
        <div className="toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              className="input"
              placeholder="Buscar funil por nome"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="toolbar-filters">
            <Badge tone="info">
              {formatNumber(pipelines.length)} {pipelines.length === 1 ? 'funil' : 'funis'}
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
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button danger"
                        onClick={() => setPipelineToDelete(pipeline)}
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
                                <strong>{stage.position}. {stage.name}</strong>
                              </div>
                              <div><span>{stage.code}</span> </div>
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
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                      className="icon-button danger"
                                      onClick={() => setStageToDelete(stage)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                            ) : null}
                          </article>
                      ))
                  ) : (
                    <div className="kanban-empty">Nenhuma stage cadastrada.</div>
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
                  >
                    <Workflow size={16} />
                    Adicionar stage
                  </Button>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState
              icon={<Workflow size={18} />}
              title="Nenhum pipeline encontrado"
              description="Cadastre o primeiro pipeline para estruturar o funil."
            />
          )}
        </div>
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
        pipelines={pipelinesQuery.data}
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
        title="Excluir pipeline"
        description={
          pipelineToDelete
            ? `Deseja remover o pipeline ${pipelineToDelete.title}?`
            : 'Deseja remover este pipeline?'
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

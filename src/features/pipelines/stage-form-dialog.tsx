import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { AppDialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { stageSchema } from '@/features/pipelines/pipeline-schema'
import { getApiErrorInfo } from '@/services/http/errors'
import { applyFieldErrors } from '@/utils/forms'

import type { StageFormValues } from '@/features/pipelines/pipeline-schema'
import type { PipelineResponseDTO, StageResponseDTO } from '@/types/api'

interface StageFormDialogProps {
  open: boolean
  stage?: StageResponseDTO | null
  initialPipelineId?: number | null
  pipelines: PipelineResponseDTO[]
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: StageFormValues) => Promise<void>
}

const defaultValues: StageFormValues = {
  name: '',
  code: '',
  position: '',
  pipelineId: '',
  description: '',
}

export function StageFormDialog({
  initialPipelineId,
  loading = false,
  onOpenChange,
  onSubmit,
  open,
  pipelines,
  stage,
}: StageFormDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<StageFormValues>({
    resolver: zodResolver(stageSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset({
        name: stage?.name || '',
        code: stage?.code || '',
        position: stage?.position ? String(stage.position) : '',
        pipelineId: stage?.pipelineId
          ? String(stage.pipelineId)
          : initialPipelineId
            ? String(initialPipelineId)
            : '',
        description: '',
      })
    }
  }, [initialPipelineId, open, reset, stage])

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      toast.success(stage ? 'Etapa atualizada com sucesso.' : 'Etapa criada com sucesso.')
      onOpenChange(false)
    } catch (error) {
      const apiError = getApiErrorInfo(error)
      applyFieldErrors(setError, apiError.fieldErrors)
      toast.error(apiError.message)
    }
  })

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={stage ? 'Editar Etapa' : 'Nova Etapa'}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={() => void submit()}>
            {stage ? 'Salvar Etapa' : 'Criar Etapa'}
          </Button>
        </>
      }
    >
      <form className="form-grid form-grid-2" onSubmit={submit}>
        <Field label="Nome" error={errors.name?.message}>
          <input className="input" {...register('name')} />
        </Field>
        <Field label="Código" error={errors.code?.message}>
          <input className="input" {...register('code')} />
        </Field>
        <Field label="Posição" error={errors.position?.message}>
          <input type="number" min="1" className="input" {...register('position')} />
        </Field>
        <Field label="Funil" error={errors.pipelineId?.message}>
          <select className="input" {...register('pipelineId')}>
            <option value="">Selecione</option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.title}
              </option>
            ))}
          </select>
        </Field>
      </form>
    </AppDialog>
  )
}

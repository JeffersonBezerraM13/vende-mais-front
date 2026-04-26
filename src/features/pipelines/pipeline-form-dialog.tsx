import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { AppDialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { pipelineSchema } from '@/features/pipelines/pipeline-schema'
import { getApiErrorInfo } from '@/services/http/errors'
import { applyFieldErrors } from '@/utils/forms'

import type { PipelineFormValues } from '@/features/pipelines/pipeline-schema'
import type { PipelineResponseDTO } from '@/types/api'

interface PipelineFormDialogProps {
  open: boolean
  pipeline?: PipelineResponseDTO | null
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PipelineFormValues) => Promise<void>
}

const defaultValues: PipelineFormValues = {
  title: '',
}

export function PipelineFormDialog({
  loading = false,
  onOpenChange,
  onSubmit,
  open,
  pipeline,
}: PipelineFormDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset({
        title: pipeline?.title || '',
      })
    }
  }, [open, pipeline, reset])

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      toast.success(pipeline ? 'Funil atualizado com sucesso.' : 'Funil criado com sucesso.')
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
      title={pipeline ? 'Editar Funil' : 'Novo Funil'}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={() => void submit()}>
            {pipeline ? 'Salvar Funil' : 'Criar Funil'}
          </Button>
        </>
      }
    >
      <Field label="Título do Funil" error={errors.title?.message}>
        <input className="input" {...register('title')} />
      </Field>
    </AppDialog>
  )
}

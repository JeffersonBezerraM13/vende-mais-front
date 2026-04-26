import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { AppDialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import {
  closeOpportunitySchema,
  type CloseOpportunityFormValues,
} from '@/features/opportunities/opportunity-schema'
import { getApiErrorInfo } from '@/services/http/errors'
import { applyFieldErrors } from '@/utils/forms'

import type { OpportunityResponseDTO } from '@/types/api'

interface OpportunityCloseDialogProps {
  open: boolean
  opportunity?: OpportunityResponseDTO | null
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CloseOpportunityFormValues) => Promise<void>
}

const defaultValues: CloseOpportunityFormValues = {
  outcome: 'won',
  lossReason: '',
}

export function OpportunityCloseDialog({
  loading = false,
  onOpenChange,
  onSubmit,
  open,
  opportunity,
}: OpportunityCloseDialogProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CloseOpportunityFormValues>({
    resolver: zodResolver(closeOpportunitySchema),
    defaultValues,
  })

  const outcome = useWatch({ control, name: 'outcome' })

  useEffect(() => {
    if (open) {
      reset(defaultValues)
    }
  }, [open, reset])

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      toast.success('Oportunidade fechada com sucesso.')
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
      title="Fechar oportunidade"
      description={opportunity ? opportunity.title : undefined}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            title="Cancelar fechamento da oportunidade"
          >
            Cancelar
          </Button>
          <Button
            loading={loading}
            onClick={() => void submit()}
            title="Confirmar fechamento da oportunidade"
          >
            Confirmar fechamento
          </Button>
        </>
      }
    >
      <form className="stack-form" onSubmit={submit}>
        <div className="segmented-control">
          <label className={`segmented-control-item ${outcome === 'won' ? 'is-active' : ''}`}>
            <input type="radio" value="won" className="sr-only" {...register('outcome')} />
            Ganha
          </label>
          <label className={`segmented-control-item ${outcome === 'lost' ? 'is-active' : ''}`}>
            <input type="radio" value="lost" className="sr-only" {...register('outcome')} />
            Perdida
          </label>
        </div>

        {outcome === 'lost' ? (
          <Field label="Motivo da perda" error={errors.lossReason?.message}>
            <textarea rows={4} className="input textarea" {...register('lossReason')} />
          </Field>
        ) : null}
      </form>
    </AppDialog>
  )
}

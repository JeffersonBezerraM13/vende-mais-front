import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AppDialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { opportunitySchema } from '@/features/opportunities/opportunity-schema'
import { checkOpenOpportunity } from '@/services/api/opportunities-service'
import { getApiErrorInfo } from '@/services/http/errors'
import { SOLUTION_OPTIONS } from '@/utils/constants'
import { applyFieldErrors } from '@/utils/forms'

import type { OpportunityFormValues } from '@/features/opportunities/opportunity-schema'
import type {
  LeadResponseDTO,
  OpportunityResponseDTO,
  PipelineResponseDTO,
} from '@/types/api'

interface OpportunityFormDialogProps {
  leads: LeadResponseDTO[]
  pipelines: PipelineResponseDTO[]
  open: boolean
  opportunity?: OpportunityResponseDTO | null
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: OpportunityFormValues) => Promise<void>
}

const emptyValues: OpportunityFormValues = {
  leadId: '',
  title: '',
  definitiveSolution: 'COWORKING',
  estimatedValue: '',
  pipelineId: '',
  currentStageId: '',
  expectedCloseDate: '',
  notes: '',
}

export function OpportunityFormDialog({
  leads,
  loading = false,
  onOpenChange,
  onSubmit,
  open,
  opportunity,
  pipelines,
}: OpportunityFormDialogProps) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: emptyValues,
  })

  const selectedLeadId = useWatch({ control, name: 'leadId' })
  const selectedPipelineId = useWatch({ control, name: 'pipelineId' })
  const selectedStageId = useWatch({ control, name: 'currentStageId' })
  const selectedPipeline = pipelines.find(
    (pipeline) => String(pipeline.id) === selectedPipelineId,
  )
  const stageOptions = [...(selectedPipeline?.stages ?? [])].sort(
    (left, right) => left.position - right.position,
  )

  const openCheckQuery = useQuery({
    queryKey: ['opportunity-open-check', selectedLeadId],
    queryFn: () => checkOpenOpportunity(Number(selectedLeadId)),
    enabled: open && !opportunity && Boolean(selectedLeadId),
  })

  useEffect(() => {
    if (!open) {
      return
    }

    reset(
      opportunity
        ? {
            leadId: String(opportunity.leadId),
            title: opportunity.title,
            definitiveSolution: opportunity.definitiveSolution,
            estimatedValue:
              opportunity.estimatedValue != null ? String(opportunity.estimatedValue) : '',
            pipelineId: String(opportunity.pipelineId),
            currentStageId: opportunity.currentStageId
              ? String(opportunity.currentStageId)
              : '',
            expectedCloseDate: opportunity.expectedCloseDate ?? '',
            notes: opportunity.notes ?? '',
          }
        : emptyValues,
    )
  }, [open, opportunity, reset])

  useEffect(() => {
    if (!selectedPipelineId) {
      return
    }

    if (!stageOptions.length) {
      setValue('currentStageId', '')
      return
    }

    const stageStillExists = stageOptions.some(
      (stage) => String(stage.id) === selectedStageId,
    )

    if (!stageStillExists) {
      setValue('currentStageId', String(stageOptions[0].id))
    }
  }, [selectedPipelineId, selectedStageId, setValue, stageOptions])

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      toast.success(
        opportunity
          ? 'Oportunidade atualizada com sucesso.'
          : 'Oportunidade criada com sucesso.',
      )
      onOpenChange(false)
      reset(emptyValues)
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
      title={opportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button loading={loading} onClick={() => void submit()}>
            {opportunity ? 'Salvar Alterações' : 'Criar Oportunidade'}
          </Button>
        </>
      }
    >
      <form className="form-grid form-grid-2" onSubmit={submit}>
        <Field label="Lead" htmlFor="opportunity-lead" error={errors.leadId?.message}>
          <select id="opportunity-lead" className="input" {...register('leadId')}>
            <option value="">Selecione</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name} {lead.companyName ? `• ${lead.companyName}` : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Título" htmlFor="opportunity-title" error={errors.title?.message}>
          <input id="opportunity-title" className="input" {...register('title')} />
        </Field>

        <Field
          label="Solução"
          htmlFor="opportunity-solution"
          error={errors.definitiveSolution?.message}
        >
          <select
            id="opportunity-solution"
            className="input"
            {...register('definitiveSolution')}
          >
            {SOLUTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Valor Estimado"
          htmlFor="opportunity-value"
          error={errors.estimatedValue?.message}
        >
          <input
            id="opportunity-value"
            type="number"
            step="0.01"
            className="input"
            {...register('estimatedValue')}
          />
        </Field>

        <Field
          label="Funil"
          htmlFor="opportunity-pipeline"
          error={errors.pipelineId?.message}
        >
          <select id="opportunity-pipeline" className="input" {...register('pipelineId')}>
            <option value="">Selecione</option>
            {pipelines.map((pipeline) => (
              <option key={pipeline.id} value={pipeline.id}>
                {pipeline.title}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Etapa atual"
          htmlFor="opportunity-stage"
          error={errors.currentStageId?.message}
          hint={
            !selectedPipelineId
                ? 'Selecione um funil.'
                : ''
          }
        >
          <select id="opportunity-stage" className="input" {...register('currentStageId')}>
            <option value="">Selecione</option>
            {stageOptions.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.position}. {stage.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Previsão de Fechamento"
          htmlFor="opportunity-close-date"
          error={errors.expectedCloseDate?.message}
        >
          <input
            id="opportunity-close-date"
            type="date"
            className="input"
            {...register('expectedCloseDate')}
          />
        </Field>

        <Field label="Observações" htmlFor="opportunity-notes" error={errors.notes?.message}>
          <textarea
            id="opportunity-notes"
            rows={5}
            className="input textarea"
            {...register('notes')}
          />
        </Field>
      </form>

      {openCheckQuery.data ? (
        <div className="dialog-callout dialog-callout-warning">
          <AlertTriangle size={18} />
          <div>
            <strong>Lead com oportunidade aberta identificada</strong>
            <p>
              O backend informou que ja existe uma oportunidade aberta para esse
              lead. O aviso e preventivo e nao bloqueia a criacao.
            </p>
          </div>
          <Badge tone="warning">Atencao</Badge>
        </div>
      ) : null}
    </AppDialog>
  )
}

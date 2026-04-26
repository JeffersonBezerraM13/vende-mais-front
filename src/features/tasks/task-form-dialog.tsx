import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { Briefcase, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppDialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { taskSchema } from '@/features/tasks/task-schema'
import { getApiErrorInfo } from '@/services/http/errors'
import { applyFieldErrors } from '@/utils/forms'

import type {
  TaskFormValues,
  TaskRelationType,
} from '@/features/tasks/task-schema'
import type {
  LeadResponseDTO,
  OpportunityResponseDTO,
  TaskResponseDTO,
} from '@/types/api'
import type { LucideIcon } from 'lucide-react'

interface TaskFormDialogProps {
  leads: LeadResponseDTO[]
  opportunities: OpportunityResponseDTO[]
  open: boolean
  task?: TaskResponseDTO | null
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: TaskFormValues) => Promise<void>
}

interface RelationOption {
  type: TaskRelationType
  title: string
  badge: string
  fieldLabel: string
  placeholder: string
  emptyHint: string
  icon: LucideIcon
  tone: 'info' | 'primary'
  visualTone: 'lead' | 'opportunity'
}

const relationOptions: RelationOption[] = [
  {
    type: 'LEAD',
    title: 'Vincular a Lead',
    badge: 'Lead',
    fieldLabel: 'Lead Vinculado',
    placeholder: 'Selecione um lead',
    emptyHint: 'Cadastre um lead antes.',
    icon: User,
    tone: 'info',
    visualTone: 'lead',
  },
  {
    type: 'OPPORTUNITY',
    title: 'Vincular a Oportunidade',
    badge: 'Oportunidade',
    fieldLabel: 'Oportunidade Vinculada',
    placeholder: 'Selecione uma oportunidade',
    emptyHint: 'Cadastre uma oportunidade antes.',
    icon: Briefcase,
    tone: 'primary',
    visualTone: 'opportunity',
  },
]

const relationOptionByType = relationOptions.reduce(
  (accumulator, option) => ({
    ...accumulator,
    [option.type]: option,
  }),
  {} as Record<TaskRelationType, RelationOption>,
)

const emptyValues: TaskFormValues = {
  title: '',
  description: '',
  taskStatus: 'PENDING',
  dueDate: '',
  relationType: 'LEAD',
  leadId: '',
  opportunityId: '',
}

function getLockedRelationType(task?: TaskResponseDTO | null): TaskRelationType | null {
  if (!task) {
    return null
  }

  if (task.opportunityId) {
    return 'OPPORTUNITY'
  }

  return 'LEAD'
}

function getTaskValues(
  task: TaskResponseDTO | null | undefined,
  relationType: TaskRelationType,
): TaskFormValues {
  return {
    title: task?.title || '',
    description: task?.description ?? '',
    taskStatus: task?.taskStatus || 'PENDING',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    relationType,
    leadId: relationType === 'LEAD' && task?.leadId ? String(task.leadId) : '',
    opportunityId:
      relationType === 'OPPORTUNITY' && task?.opportunityId
        ? String(task.opportunityId)
        : '',
  }
}

interface SelectionCardProps {
  option: RelationOption
  onSelect: (type: TaskRelationType) => void
}

function SelectionCard({ onSelect, option }: SelectionCardProps) {
  const Icon = option.icon

  return (
    <Card className={clsx('task-selection-card', `task-selection-card-${option.visualTone}`)}>
      <button
        type="button"
        className="task-selection-button"
        onClick={() => onSelect(option.type)}
        aria-label={option.title}
      >
        <span className="task-selection-icon" aria-hidden="true">
          <Icon size={26} />
        </span>
        <span className="task-selection-copy">
          <strong>{option.title}</strong>
        </span>
      </button>
    </Card>
  )
}

export function TaskFormDialog({
  leads,
  loading = false,
  onOpenChange,
  onSubmit,
  open,
  opportunities,
  task,
}: TaskFormDialogProps) {
  const {
    clearErrors,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: emptyValues,
  })

  const [selectedRelation, setSelectedRelation] = useState<TaskRelationType | null>(null)
  const isEditing = Boolean(task)
  const lockedRelation = getLockedRelationType(task)
  const activeRelation = lockedRelation ?? selectedRelation

  useEffect(() => {
    if (!open) {
      return
    }

    reset(lockedRelation ? getTaskValues(task, lockedRelation) : emptyValues)
  }, [lockedRelation, open, reset, task])

  function handleSelectRelation(type: TaskRelationType) {
    setSelectedRelation(type)
    setValue('relationType', type, { shouldDirty: true, shouldValidate: true })
    setValue(type === 'LEAD' ? 'opportunityId' : 'leadId', '', {
      shouldDirty: true,
      shouldValidate: true,
    })
    clearErrors(['relationType', 'leadId', 'opportunityId'])
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedRelation(null)
    }

    onOpenChange(nextOpen)
  }

  function handleCancel() {
    setSelectedRelation(null)
    onOpenChange(false)
  }

  const submit = handleSubmit(async (values) => {
    const relationType = activeRelation ?? values.relationType
    const normalizedValues: TaskFormValues = {
      ...values,
      relationType,
      leadId: relationType === 'LEAD' ? values.leadId : '',
      opportunityId: relationType === 'OPPORTUNITY' ? values.opportunityId : '',
    }

    try {
      await onSubmit(normalizedValues)
      toast.success(task ? 'Tarefa atualizada com sucesso.' : 'Tarefa criada com sucesso.')
      onOpenChange(false)
      setSelectedRelation(null)
      reset(emptyValues)
    } catch (error) {
      const apiError = getApiErrorInfo(error)
      applyFieldErrors(setError, apiError.fieldErrors)
      toast.error(apiError.message)
    }
  })

  const relationOption = activeRelation ? relationOptionByType[activeRelation] : null
  const relationError =
    activeRelation === 'LEAD'
      ? errors.leadId?.message
      : activeRelation === 'OPPORTUNITY'
        ? errors.opportunityId?.message
        : undefined
  const RelationIcon = relationOption?.icon

  return (
    <AppDialog
      open={open}
      onOpenChange={handleDialogOpenChange}
      title={task ? 'Editar Tarefa' : 'Nova Tarefa'}
      description={
        relationOption
          ? 'Preencha a atividade mantendo um único vínculo principal.'
          : 'Escolha onde esta tarefa será ancorada.'
      }
      size="lg"
      footer={
        relationOption ? (
          <>
            <Button variant="ghost" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button loading={loading} onClick={() => void submit()}>
              {task ? 'Salvar Tarefa' : 'Criar Tarefa'}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
        )
      }
    >
      {!relationOption ? (
        <div className="task-selection-shell">
          <div>
            <h3>Vínculo Principal</h3>
          </div>
          <div className="task-selection-grid">
            {relationOptions.map((option) => (
              <SelectionCard key={option.type} option={option} onSelect={handleSelectRelation} />
            ))}
          </div>
        </div>
      ) : (
        <form className="stack-form task-form-grid" onSubmit={submit}>
          <input type="hidden" {...register('relationType')} />
          <input type="hidden" {...register('taskStatus')} />

          <Field
            label={relationOption.fieldLabel}
            htmlFor="task-relation-target"
            error={relationError}
            hint={
              isEditing
                ? 'O tipo do vínculo principal fica travado na edição.'
                : activeRelation === 'LEAD' && !leads.length
                ? relationOption.emptyHint
                : activeRelation === 'OPPORTUNITY' && !opportunities.length
                  ? relationOption.emptyHint
                  : undefined
            }
          >
            <div className="task-relation-select-wrap">
              <span
                className={`task-relation-field-icon task-relation-field-icon-${relationOption.visualTone}`}
                aria-hidden="true"
              >
                {RelationIcon ? <RelationIcon size={16} /> : null}
              </span>
              {activeRelation === 'LEAD' ? (
                <select id="task-relation-target" className="input" {...register('leadId')}>
                  <option value="">{relationOption.placeholder}</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
                      {lead.companyName ? ` - ${lead.companyName}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <select id="task-relation-target" className="input" {...register('opportunityId')}>
                  <option value="">{relationOption.placeholder}</option>
                  {opportunities.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </Field>

          <Field label="Título" htmlFor="task-title" error={errors.title?.message}>
            <input id="task-title" className="input" {...register('title')} />
          </Field>

          <Field label="Descrição" htmlFor="task-description" error={errors.description?.message}>
            <textarea
              id="task-description"
              className="input textarea"
              rows={5}
              {...register('description')}
            />
          </Field>

          <Field label="Vencimento" htmlFor="task-due-date" error={errors.dueDate?.message}>
            <input id="task-due-date" type="date" className="input" {...register('dueDate')} />
          </Field>
        </form>
      )}
    </AppDialog>
  )
}

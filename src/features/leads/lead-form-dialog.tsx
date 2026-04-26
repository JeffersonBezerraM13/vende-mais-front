import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { AppDialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { leadSchema } from '@/features/leads/lead-schema'
import { getApiErrorInfo } from '@/services/http/errors'
import {
  ENTRY_METHOD_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  PERSON_TYPE_OPTIONS,
  SOLUTION_OPTIONS,
} from '@/utils/constants'
import { applyFieldErrors } from '@/utils/forms'

import type { LeadFormValues } from '@/features/leads/lead-schema'
import type { LeadResponseDTO } from '@/types/api'


interface LeadFormDialogProps {
  open: boolean
  lead?: LeadResponseDTO | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: LeadFormValues) => Promise<void>
  loading?: boolean
}

const emptyValues: LeadFormValues = {
  name: '',
  phone: '',
  email: '',
  personType: '',
  companyName: '',
  interestSoluction: '',
  leadSource: '',
  entryMethod: '',
  notes: '',
}

export function LeadFormDialog({
  lead,
  loading = false,
  onOpenChange,
  onSubmit,
  open,
}: LeadFormDialogProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
    handleSubmit,
    reset,
    setError,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: emptyValues,
  })

  // 1. Observa o valor no nível principal do componente para o HTML enxergar
  const selectedPersonType = useWatch({ control, name: 'personType' })
  const isIndividual = selectedPersonType === 'INDIVIDUAL'

  // 2. Efeito isolado APENAS para limpar a empresa se for Física
  useEffect(() => {
    if (isIndividual) {
      setValue('companyName', '') // Usando string vazia para bater com o seu emptyValues
    }
  }, [isIndividual, setValue])

  // 3. Efeito isolado APENAS para gerenciar o abrir/fechar do modal e carregar os dados
  useEffect(() => {
    if (!open) {
      return
    }

    reset(
        lead
            ? {
              name: lead.name,
              phone: lead.phone,
              email: lead.email,
              personType: lead.personType ?? '',
              companyName: lead.companyName ?? '',
              interestSoluction: lead.interestSoluction ?? '',
              leadSource: lead.leadSource,
              entryMethod: lead.entryMethod,
              notes: lead.notes ?? '',
            }
            : emptyValues,
    )
  }, [lead, open, reset])

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      toast.success(lead ? 'Lead atualizado com sucesso.' : 'Lead criado com sucesso.')
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
      title={lead ? 'Editar lead' : 'Novo lead'}
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            title={lead ? 'Cancelar edição do lead' : 'Cancelar criação do lead'}
          >
            Cancelar
          </Button>
          <Button
            loading={loading}
            onClick={() => void submit()}
            title={lead ? 'Salvar alterações do lead' : 'Criar lead'}
          >
            {lead ? 'Salvar alterações' : 'Criar lead'}
          </Button>
        </>
      }
    >
      <form className="form-grid form-grid-2" onSubmit={submit}>
        <Field label="Nome" htmlFor="lead-name" error={errors.name?.message}>
          <input id="lead-name" className="input" {...register('name')} />
        </Field>
        <Field label="Telefone" htmlFor="lead-phone" error={errors.phone?.message}>
          <input id="lead-phone" className="input" {...register('phone')}/>
        </Field>
        <Field label="Email" htmlFor="lead-email" error={errors.email?.message}>
          <input id="lead-email" type="email" className="input" {...register('email')} />
        </Field>
        <Field
          label="Tipo de Pessoa"
          htmlFor="lead-person-type"
          error={errors.personType?.message}
        >
          <select id="lead-person-type" className="input" {...register('personType')}>
            <option value="">Não informado</option>
            {PERSON_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Empresa"
          htmlFor="lead-company-name"
          error={errors.companyName?.message}
        >
          <input
              id="lead-company-name"
              className="input"
              disabled={isIndividual}
              style={
                isIndividual ? {
                  backgroundColor: '#e6e6e6', cursor: 'not-allowed', opacity: 0.7
                } : {}
              }
              {...register('companyName')} />
        </Field>
        <Field
          label="Solução de Interesse"
          htmlFor="lead-solution"
          error={errors.interestSoluction?.message}
        >
          <select id="lead-solution" className="input" {...register('interestSoluction')}>
            <option value="">Não informado</option>
            {SOLUTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Origem do Lead"
          htmlFor="lead-source"
          error={errors.leadSource?.message}
        >
          <select id="lead-source" className="input" {...register('leadSource')}>
            <option value="">Não informado</option>
            {LEAD_SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Método de Entrada"
          htmlFor="lead-entry-method"
          error={errors.entryMethod?.message}
        >
          <select id="lead-entry-method" className="input" {...register('entryMethod')}>
            <option value="">Não informado</option>
            {ENTRY_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <div style={{ gridColumn: 'span 2' }}>
          <Field label="Observações" htmlFor="lead-notes" error={errors.notes?.message} style={{ gridColumn: 'span 2' }}>
            <textarea
              id="lead-notes"
              className="input textarea"
              rows={5}
              {...register('notes')}
            />
          </Field>
        </div>
      </form>
    </AppDialog>
  )
}

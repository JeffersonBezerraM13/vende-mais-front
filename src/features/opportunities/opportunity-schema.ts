import { z } from 'zod'

export const opportunitySchema = z.object({
  leadId: z.string().min(1, 'Selecione o lead'),
  title: z.string().min(1, 'Informe o título da oportunidade'),
  definitiveSolution: z.enum([
    'SELF_STORAGE',
    'COWORKING',
    'FISCAL_ADDRESS',
    'COMMERCIAL_ADDRESS',
    'AUDITORIUM',
  ]),
  estimatedValue: z.string().refine(
    (value) => !value || !Number.isNaN(Number(value)),
    'Informe um valor numérico válido',
  ),
  pipelineId: z.string().min(1, 'Selecione o funil'),
  currentStageId: z.string(),
  expectedCloseDate: z.string(),
  notes: z.string(),
})

export const closeOpportunitySchema = z
  .object({
    outcome: z.enum(['won', 'lost']),
    lossReason: z.string(),
  })
  .refine((values) => values.outcome === 'won' || Boolean(values.lossReason), {
    path: ['lossReason'],
    message: 'Informe o motivo da perda',
  })

export type OpportunityFormValues = z.infer<typeof opportunitySchema>
export type CloseOpportunityFormValues = z.infer<typeof closeOpportunitySchema>

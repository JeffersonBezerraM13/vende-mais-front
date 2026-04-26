import { z } from 'zod'

export const taskRelationTypes = ['LEAD', 'OPPORTUNITY'] as const

export const taskSchema = z
  .object({
    title: z.string().trim().min(1, 'Informe o título da tarefa'),
    description: z.string(),
    taskStatus: z.enum(['PENDING', 'COMPLETED']),
    dueDate: z.string().min(1, 'Informe a data limite'),
    relationType: z.enum(taskRelationTypes),
    leadId: z.string(),
    opportunityId: z.string(),
  })
  .superRefine((values, context) => {
    const hasLead = values.leadId.trim().length > 0
    const hasOpportunity = values.opportunityId.trim().length > 0

    if (hasLead && hasOpportunity) {
      context.addIssue({
        code: 'custom',
        message: 'A tarefa deve ter apenas um vínculo principal.',
        path: ['relationType'],
      })
      return
    }

    if (values.relationType === 'LEAD' && !hasLead) {
      context.addIssue({
        code: 'custom',
        message: 'Selecione o lead vinculado à tarefa.',
        path: ['leadId'],
      })
    }

    if (values.relationType === 'OPPORTUNITY' && !hasOpportunity) {
      context.addIssue({
        code: 'custom',
        message: 'Selecione a oportunidade vinculada à tarefa.',
        path: ['opportunityId'],
      })
    }
  })

export type TaskFormValues = z.infer<typeof taskSchema>
export type TaskRelationType = (typeof taskRelationTypes)[number]

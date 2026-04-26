import { z } from 'zod'

export const pipelineSchema = z.object({
  title: z.string().min(1, 'Informe o nome do funil'),
})

export const stageSchema = z.object({
  name: z.string().min(1, 'Informe o nome da etapa'),
  code: z
    .string()
    .min(1, 'Informe o código da etapa')
    .transform((value) => value.trim().toUpperCase().replaceAll(' ', '_')),
  position: z
    .string()
    .min(1, 'Informe a posição')
    .refine((value) => Number(value) > 0, 'A posição deve ser maior que zero'),
  pipelineId: z.string().min(1, 'Selecione o funil'),
  description: z.string(),
})

export type PipelineFormValues = z.infer<typeof pipelineSchema>
export type StageFormValues = z.infer<typeof stageSchema>

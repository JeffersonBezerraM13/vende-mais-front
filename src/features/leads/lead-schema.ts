import { z } from 'zod'

export const leadSchema = z.object({
  name: z.string().min(1, 'Informe o nome do lead'),
  phone: z.string().min(8, 'Informe um telefone válido'),
  email: z.email('Informe um email válido'),
  personType: z.union([z.literal(''), z.enum(['INDIVIDUAL', 'COMPANY'])]),
  companyName: z.string(),
  interestSoluction: z.union([
    z.literal(''),
    z.enum([
      'SELF_STORAGE',
      'COWORKING',
      'FISCAL_ADDRESS',
      'COMMERCIAL_ADDRESS',
      'AUDITORIUM',
    ]),
  ]),
  leadSource: z
    .union([z.literal(''), z.enum(['SITE', 'WHATSAPP', 'PHONE_CALL', 'REFERRAL', 'IN_PERSON'])])
    .refine((value) => value !== '', {
      message: 'Selecione a origem do lead',
    }),
  entryMethod: z
    .union([z.literal(''), z.enum(['MANUAL', 'IMPORTED', 'INTEGRATION'])])
    .refine((value) => value !== '', {
      message: 'Selecione a forma de entrada',
    }),
  notes: z.string(),
})

export type LeadFormValues = z.input<typeof leadSchema>

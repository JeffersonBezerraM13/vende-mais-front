import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(1, 'Informe o nome do usuário'),
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe a senha'),
})

export type UserFormValues = z.infer<typeof userSchema>

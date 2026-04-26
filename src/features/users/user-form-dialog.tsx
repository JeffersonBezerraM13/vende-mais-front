import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { AppDialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { userSchema } from '@/features/users/user-schema'
import { getApiErrorInfo } from '@/services/http/errors'
import { applyFieldErrors } from '@/utils/forms'

import type { UserFormValues } from '@/features/users/user-schema'
import type { UserResponseDTO } from '@/types/api'

interface UserFormDialogProps {
  open: boolean
  user?: UserResponseDTO | null
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: UserFormValues) => Promise<void>
}

const defaultValues: UserFormValues = {
  name: '',
  email: '',
  password: '',
}

export function UserFormDialog({
  loading = false,
  onOpenChange,
  onSubmit,
  open,
  user,
}: UserFormDialogProps) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      reset({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
      })
    }
  }, [open, reset, user])

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values)
      toast.success(user ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.')
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
      title={user ? 'Editar usuário' : 'Novo usuário'}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            title={user ? 'Cancelar edição do usuário' : 'Cancelar criação do usuário'}
          >
            Cancelar
          </Button>
          <Button
            loading={loading}
            onClick={() => void submit()}
            title={user ? 'Salvar alterações do usuário' : 'Criar usuário'}
          >
            {user ? 'Salvar usuário' : 'Criar usuário'}
          </Button>
        </>
      }
    >
      <form className="stack-form" onSubmit={submit}>
        <Field label="Nome" error={errors.name?.message}>
          <input className="input" {...register('name')} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" className="input" {...register('email')} />
        </Field>
        <Field
          label="Senha"
          error={errors.password?.message}
        >
          <input type="password" className="input" {...register('password')} />
        </Field>
      </form>
    </AppDialog>
  )
}

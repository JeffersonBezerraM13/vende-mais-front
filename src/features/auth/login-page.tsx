import { zodResolver } from '@hookform/resolvers/zod'
import { BarChart3, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { useAuthStore } from '@/features/auth/auth-store'
import { loginSchema } from '@/features/auth/auth-schema'
import { getApiErrorInfo } from '@/services/http/errors'

import type { LoginFormValues } from '@/features/auth/auth-schema'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn)
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values)
      toast.success('Sessão iniciada com sucesso.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const apiError = getApiErrorInfo(error)

      Object.entries(apiError.fieldErrors).forEach(([field, message]) => {
        setError(field as keyof LoginFormValues, { message })
      })

      toast.error(apiError.message)
    }
  })

  return (
    <div className="auth-layout">
      <section className="auth-aside">
        <Badge tone="info">CRM Comercial</Badge>
        <h1>VendeMais CRM</h1>
        <p>
          Painel Único para Leads, Funis, Oportunidades, Tarefas e Governança
          Comercial em Tempo Real.
        </p>

        <div className="auth-feature-list">
          <article className="auth-feature-card">
            <BarChart3 size={18} />
            <div>
              <strong>Visão 360º de Vendas</strong>
              <span>Acompanhe funis, atividades da equipe e o avanço das negociações em tempo real.</span>
            </div>
          </article>
          <article className="auth-feature-card">
            <ShieldCheck size={18} />
            <div>
              <strong>Segurança Institucional</strong>
              <span>Controle de acesso rigoroso e proteção contínua para os dados estratégicos da sua empresa.</span>
            </div>
          </article>
          <article className="auth-feature-card">
            <LockKeyhole size={18} />
            <div>
              <strong>Ambiente Exclusivo</strong>
              <span>Sistema isolado e otimizado para garantir máxima velocidade e privacidade total das suas informações.</span>
            </div>
          </article>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <p className="eyebrow"></p>
            <h2>Entrar no VendeMais</h2>
            <p></p>
          </div>

          <form className="stack-form" onSubmit={onSubmit}>
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register('email')}
              />
            </Field>

            <Field label="Senha" htmlFor="password" error={errors.password?.message}>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="informe sua senha"
                autoComplete="current-password"
                {...register('password')}
              />
            </Field>

            <Button type="submit" className="btn-block" loading={isLoggingIn}>
              Entrar
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}

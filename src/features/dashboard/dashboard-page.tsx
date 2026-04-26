import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ChartNoAxesColumn,
  CircleCheckBig,
  Funnel,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Loader } from '@/components/ui/loader'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { getDashboardSnapshot } from '@/services/api/dashboard-service'
import { TASK_STATUS_LABELS } from '@/utils/constants'
import { formatCurrency, formatDate, formatNumber, truncateText } from '@/utils/format'
import { getOpportunityLifecycle, getOpportunityLifecycleLabel } from '@/utils/opportunities'

export default function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSnapshot,
  })

  if (dashboardQuery.isLoading) {
    return <Loader fullscreen={false} label="Carregando painel..." />
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <EmptyState
        title="Não foi possível carregar o painel."
        description="Verifique a autenticação e a disponibilidade do backend."
      />
    )
  }

  const { pipelines, recentOpportunities, stageDistribution, totals, upcomingTasks } =
    dashboardQuery.data

  return (
    <div className="page-stack">
      <PageHeader title="Painel Comercial" />

      <section className="stats-grid">
        <StatCard
          title="Receita Prevista"
          value={formatCurrency(totals.estimatedPipelineValue)}
          detail={`${formatNumber(totals.opportunitiesOpen)} negócios em andamento`}
          icon={<Wallet className="text-blue-500" size={20} />}
        />
        <StatCard
          title="Taxa de Conversão"
          value={`${formatNumber(totals.winRate)}%`}
          detail={`${formatNumber(totals.opportunitiesWon)} negócios fechados`}
          icon={<TrendingUp className="text-emerald-500" size={20} />}
        />
        <StatCard
          title="Ticket Médio Previsto"
          value={formatCurrency(totals.averageTicket)}
          detail="Por negociação ativa"
          icon={<Target className="text-purple-500" size={20} />}
        />
        <StatCard
          title="Atenção Operacional"
          value={`${formatNumber(totals.tasksOverdue)} atrasadas`}
          detail={`${formatNumber(totals.tasksPending)} tarefas pendentes`}
          icon={<AlertTriangle className="text-red-500" size={20} />}
        />
      </section>

      <section className="dashboard-grid">
        <Card className="dashboard-panel dashboard-panel-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Progresso das Negociações</p>
              <h2>Distribuição das Oportunidades Abertas</h2>
            </div>
            <Badge tone="info">{formatNumber(totals.pipelines)} funis</Badge>
          </div>

          <div className="dashboard-panel-body">
            {stageDistribution.length ? (
              <div className="distribution-list">
                {stageDistribution.map((item) => (
                  <article key={item.stage} className="distribution-row">
                    <div>
                      <strong>{item.stage}</strong>
                      <div>
                        <span>{formatNumber(item.total)} negócio(s)</span>
                      </div>
                    </div>
                    <div className="distribution-bar-track">
                      <div
                        className="distribution-bar-fill"
                        style={{
                          width: `${Math.max(
                            12,
                            (item.total / Math.max(stageDistribution[0]?.total ?? 1, 1)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Nenhuma oportunidade aberta."
                description="Assim que existirem negócios em andamento, a distribuição por etapa aparece aqui."
              />
            )}
          </div>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Infraestrutura</p>
              <h2>Funis de Vendas</h2>
            </div>
            <Funnel size={18} />
          </div>
          <div className="dashboard-panel-body">
            <div className="stack-list">
              {pipelines.length ? (
                pipelines.map((pipeline) => (
                  <article key={pipeline.id} className="stack-row">
                    <div>
                      <strong>{pipeline.title}</strong>
                      <div>
                        <span>{pipeline.stages.length} etapas</span>
                      </div>
                    </div>
                    <Badge tone="neutral">{pipeline.stages.length}</Badge>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Nenhum funil cadastrado."
                  description="Cadastre um novo funil para continuar."
                />
              )}
            </div>
          </div>
        </Card>

        <Card className="dashboard-panel dashboard-panel-wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Atividade comercial</p>
              <h2>Oportunidades Recentes</h2>
            </div>
            <ChartNoAxesColumn size={18} />
          </div>

          <div className="dashboard-panel-body">
            <div className="stack-list">
              {recentOpportunities.length ? (
                recentOpportunities.map((opportunity) => (
                  <article key={opportunity.id} className="activity-card">
                    <div>
                      <strong>{opportunity.title}</strong>
                      <p
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                        }}
                      >
                        {truncateText(opportunity.notes, 100)}
                      </p>
                    </div>
                    <div className="activity-meta">
                      <Badge
                        tone={
                          getOpportunityLifecycle(opportunity) === 'won'
                            ? 'success'
                            : getOpportunityLifecycle(opportunity) === 'lost'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {getOpportunityLifecycleLabel(opportunity)}
                      </Badge>
                      <span>{opportunity.currentStageName || 'Sem etapa'}</span>
                      <span>{formatCurrency(opportunity.estimatedValue)}</span>
                      <small>Criada em {formatDate(opportunity.createdAt)}</small>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Sem histórico recente."
                  description="As oportunidades mais recentes aparecerão aqui."
                />
              )}
            </div>
          </div>
        </Card>

        <Card className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Agenda</p>
              <h2>Próximas Tarefas</h2>
            </div>
            <CircleCheckBig size={18} />
          </div>

          <div className="dashboard-panel-body">
            <div className="stack-list">
              {upcomingTasks.length ? (
                upcomingTasks.map((task) => (
                  <article key={task.id} className="stack-row">
                    <div>
                      <div>
                        <strong>{task.title}</strong>
                      </div>
                      <div>
                        <span
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word',
                          }}
                        >
                          {task.description || 'Sem descrição complementar'}
                        </span>
                      </div>
                    </div>
                    <div className="stack-row-meta">
                      <Badge tone="info">{task.userName || 'Responsável não informado'}</Badge>
                      <Badge tone={task.taskStatus === 'COMPLETED' ? 'success' : 'warning'}>
                        {TASK_STATUS_LABELS[task.taskStatus || 'PENDING']}
                      </Badge>
                      <small>{formatDate(task.dueDate)}</small>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Nenhuma tarefa pendente."
                  description="O calendário comercial está livre no momento."
                />
              )}
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}

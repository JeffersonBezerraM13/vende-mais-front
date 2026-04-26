import { Briefcase, CalendarRange, CircleAlert, StickyNote, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { AppDialog } from '@/components/ui/dialog'
import { TASK_STATUS_LABELS } from '@/utils/constants'
import { formatDate } from '@/utils/format'

import type {
  LeadResponseDTO,
  OpportunityResponseDTO,
  TaskResponseDTO,
} from '@/types/api'
import type { LucideIcon } from 'lucide-react'

interface TaskDetailsDialogProps {
  leads: LeadResponseDTO[]
  opportunities: OpportunityResponseDTO[]
  open: boolean
  task?: TaskResponseDTO | null
  onOpenChange: (open: boolean) => void
}

interface PrimaryRelation {
  kind: 'lead' | 'opportunity' | 'missing'
  badge: string
  name: string
  tone: 'info' | 'primary' | 'danger'
  icon: LucideIcon
}

function getPrimaryRelation(
  task: TaskResponseDTO,
  leads: LeadResponseDTO[],
  opportunities: OpportunityResponseDTO[],
): PrimaryRelation {
  if (task.opportunityId) {
    const opportunity = opportunities.find((item) => item.id === task.opportunityId)

    return {
      kind: 'opportunity',
      badge: 'Oportunidade',
      name: opportunity?.title || `Oportunidade #${task.opportunityId}`,
      tone: 'primary',
      icon: Briefcase,
    }
  }

  if (task.leadId) {
    const lead = leads.find((item) => item.id === task.leadId)

    return {
      kind: 'lead',
      badge: 'Lead',
      name: lead?.name || `Lead #${task.leadId}`,
      tone: 'info',
      icon: User,
    }
  }

  return {
    kind: 'missing',
    badge: 'Sem vínculo',
    name: 'Vínculo obrigatório pendente',
    tone: 'danger',
    icon: CircleAlert,
  }
}

function PrimaryRelationCard({ relation }: { relation: PrimaryRelation }) {
  const Icon = relation.icon

  return (
    <article className={`detail-card detail-card-full task-anchor-card task-anchor-card-${relation.kind}`}>
      <div className="task-anchor-heading">
        <span className="task-anchor-icon" aria-hidden="true">
          <Icon size={20} />
        </span>
        <strong>{relation.name}</strong>
        <Badge tone={relation.tone}>{relation.badge}</Badge>
      </div>
    </article>
  )
}

export function TaskDetailsDialog({
  leads,
  onOpenChange,
  open,
  opportunities,
  task,
}: TaskDetailsDialogProps) {
  if (!task) {
    return null
  }

  const relation = getPrimaryRelation(task, leads, opportunities)

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={task.title}
      size="lg"
    >
      <div className="details-grid">
        <PrimaryRelationCard relation={relation} />

        <article className="detail-card">
          <h3>Prazo</h3>
          <div className="detail-list">
            <div>
              <CalendarRange size={16} />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          </div>
        </article>

        <article className="detail-card">
          <h3>Status</h3>
          <div className="detail-badges">
            <Badge tone={task.taskStatus === 'COMPLETED' ? 'success' : 'warning'}>
              {TASK_STATUS_LABELS[task.taskStatus || 'PENDING']}
            </Badge>
          </div>
        </article>

        <article className="detail-card detail-card-full">
          <h3>
            <StickyNote size={16} />
            Descrição
          </h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
            <p
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0
                }}
            >
              {task.description || 'Nenhuma descrição complementar informada.'}
            </p>
          </div>
        </article>
      </div>
    </AppDialog>
  )
}

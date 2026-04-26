import { CalendarRange, Funnel, StickyNote, Target } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { AppDialog } from '@/components/ui/dialog'
import { SOLUTION_LABELS } from '@/utils/constants'
import { formatCurrency, formatDate } from '@/utils/format'
import {getOpportunityLifecycle, getOpportunityLifecycleLabel, OpportunityLifecycle} from '@/utils/opportunities'

import type {
  LeadResponseDTO,
  OpportunityResponseDTO,
  PipelineResponseDTO,
} from '@/types/api'

interface OpportunityDetailsDialogProps {
  leads: LeadResponseDTO[]
  open: boolean
  opportunity?: OpportunityResponseDTO | null
  pipelines: PipelineResponseDTO[]
  onOpenChange: (open: boolean) => void
}

export function OpportunityDetailsDialog({
  leads,
  onOpenChange,
  open,
  opportunity,
  pipelines,
}: OpportunityDetailsDialogProps) {
  if (!opportunity) {
    return null
  }

  const lead = leads.find((item) => item.id === opportunity.leadId)
  const pipeline = pipelines.find((item) => item.id === opportunity.pipelineId)
  const lifecycleLabel = getOpportunityLifecycleLabel(opportunity)

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={opportunity.title}
      size="lg"
    >
      <div className="details-grid">
        <article className="detail-card">
          <h3>Status Comercial</h3>
          <div className="detail-badges">
            <Badge
              tone={
                lifecycleLabel === 'Ganha'
                  ? 'success'
                  : lifecycleLabel === 'Perdida'
                    ? 'danger'
                    : 'warning'
              }
            >
              {lifecycleLabel}
            </Badge>
            <Badge tone="info">
              {SOLUTION_LABELS[opportunity.definitiveSolution] || opportunity.definitiveSolution}
            </Badge>
          </div>
          <p className="detail-meta">{formatCurrency(opportunity.estimatedValue)}</p>
        </article>

        <article className="detail-card">
          <h3>Informações</h3>
          <div className="detail-list">
            <div>
              <Target size={16} />
              <span>{lead?.name || `Lead #${opportunity.leadId}`}</span>
            </div>
            <div>
              <Funnel size={16} />
              <span>{pipeline?.title || `Pipeline #${opportunity.pipelineId}`}</span>
            </div>

          </div>
        </article>

        <article className="detail-card detail-card-full">
          <h3>Fechamento</h3>
          <div className="detail-list">
            <div>
              <span>Previsto para:</span>
              <strong>{formatDate(opportunity.expectedCloseDate)} </strong>
            </div>
            <div>
              <span>Etapa Atual:</span>
              <strong>{opportunity.currentStageName || 'Sem stage'}</strong>
            </div>
            <div>
              <span>Data de fechamento:</span>
              <strong>{formatDate(opportunity.closeDate)}</strong>
            </div>

            {getOpportunityLifecycle(opportunity) === 'lost' && (
                <div>
                  <span>Motivo da perda:</span>
                  <strong>{opportunity.lossReason || 'Não informado'}</strong>
                </div>
            )}
          </div>
        </article>

        <article className="detail-card detail-card-full">
          <h3>
            <StickyNote size={16} />
            Observações
          </h3>
          <p>{opportunity.notes || 'Nenhuma nota registrada nesta oportunidade.'}</p>
        </article>
      </div>
    </AppDialog>
  )
}

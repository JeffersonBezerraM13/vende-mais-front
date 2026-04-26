import { Building2, Mail, Phone, StickyNote } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { AppDialog } from '@/components/ui/dialog'
import {
  ENTRY_METHOD_LABELS,
  LEAD_SOURCE_LABELS,
  PERSON_TYPE_LABELS,
  SOLUTION_LABELS,
} from '@/utils/constants'
import { formatDate, maskPhone } from '@/utils/format'

import type { LeadResponseDTO } from '@/types/api'

interface LeadDetailsDialogProps {
  lead?: LeadResponseDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadDetailsDialog({
  lead,
  onOpenChange,
  open,
}: LeadDetailsDialogProps) {
  if (!lead) {
    return null
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={lead.name}
      size="lg"
    >
      <div className="details-grid">
        <article className="detail-card">
          <h3>Contato</h3>
          <div className="detail-list">
            <div>
              <Phone size={16} />
              <span>{maskPhone(lead.phone)}</span>
            </div>
            <div>
              <Mail size={16} />
              <span>{lead.email}</span>
            </div>
            {/* A mágica acontece aqui: Só renderiza se NÃO for individual e tiver nome de empresa */}
            {lead.personType !== 'INDIVIDUAL' && lead.companyName && (
                <div>
                  <Building2 size={16} />
                  <span>{lead.companyName}</span>
                </div>
            )}
          </div>
        </article>

        <article className="detail-card">
          <h3>Classificação</h3>
          <div className="detail-badges">
            <Badge tone="info">
              {lead.personType ? PERSON_TYPE_LABELS[lead.personType] : 'Tipo não Informado'}
            </Badge>
            <Badge tone="neutral">
              {LEAD_SOURCE_LABELS[lead.leadSource] || lead.leadSource}
            </Badge>
            <Badge tone="neutral">
              {ENTRY_METHOD_LABELS[lead.entryMethod] || lead.entryMethod}
            </Badge>
            {lead.interestSoluction ? (
              <Badge tone="warning">
                {SOLUTION_LABELS[lead.interestSoluction] || lead.interestSoluction}
              </Badge>
            ) : null}
          </div>
          <p className="detail-meta">
            Criado em {formatDate(lead.createdAt)} • Atualizado em {formatDate(lead.updatedAt)}
          </p>
        </article>

        <article className="detail-card detail-card-full">
          <h3>
            <StickyNote size={16} />
            Observações
          </h3>
          <p>{lead.notes || 'Nenhuma observação registrada para este lead.'}</p>
        </article>
      </div>
    </AppDialog>
  )
}

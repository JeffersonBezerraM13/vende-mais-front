import type { OpportunityResponseDTO } from '@/types/api'

export type OpportunityLifecycle = 'open' | 'won' | 'lost'

export function getOpportunityLifecycle(
  opportunity: OpportunityResponseDTO,
): OpportunityLifecycle {
  if (!opportunity.closeDate) {
    return 'open'
  }

  return opportunity.won ? 'won' : 'lost'
}

export function getOpportunityLifecycleLabel(
  opportunity: OpportunityResponseDTO,
) {
  const lifecycle = getOpportunityLifecycle(opportunity)

  if (lifecycle === 'won') {
    return 'Ganha'
  }

  if (lifecycle === 'lost') {
    return 'Perdida'
  }

  return 'Aberta'
}

import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({
  action,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <Card className="empty-state">
      {icon ? <div className="empty-state-icon">{icon}</div> : null}
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action}
    </Card>
  )
}

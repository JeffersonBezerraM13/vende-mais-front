import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string
  detail: string
  icon: ReactNode
}

export function StatCard({ detail, icon, title, value }: StatCardProps) {
  return (
    <Card className="stat-card">
      <div className="stat-card-icon">{icon}</div>
      <div>
        <p className="stat-card-title">{title}</p>
        <strong>{value}</strong>
          <div>
              <span>{detail}</span>
          </div>
      </div>
    </Card>
  )
}

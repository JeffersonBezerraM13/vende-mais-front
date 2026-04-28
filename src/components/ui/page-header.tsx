import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  actions?: ReactNode
}

export function PageHeader({ actions, title }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">VendeMais CRM</p>
        <h1>{title}</h1>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}

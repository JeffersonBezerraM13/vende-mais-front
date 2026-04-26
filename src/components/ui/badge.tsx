import clsx from 'clsx'
import type { PropsWithChildren } from 'react'

interface BadgeProps extends PropsWithChildren {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'company' | 'primary'
  className?: string
}

export function Badge({
  children,
  className,
  tone = 'neutral',
}: BadgeProps) {
  return <span className={clsx('badge', `badge-${tone}`, className)}>{children}</span>
}

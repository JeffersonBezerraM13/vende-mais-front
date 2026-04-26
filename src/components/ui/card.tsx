import clsx from 'clsx'
import type { HTMLAttributes, PropsWithChildren } from 'react'

interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <section className={clsx('crm-card', className)} {...props}>
      {children}
    </section>
  )
}

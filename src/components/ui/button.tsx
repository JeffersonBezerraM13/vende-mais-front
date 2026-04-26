import clsx from 'clsx'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

interface ButtonProps
  extends PropsWithChildren,
    ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
}

export function Button({
  children,
  className,
  disabled,
  loading = false,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'btn',
        `btn-${variant}`,
        size === 'sm' && 'btn-sm',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner spinner-inline" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

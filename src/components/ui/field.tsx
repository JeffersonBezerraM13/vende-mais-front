import type { CSSProperties, PropsWithChildren, ReactNode } from 'react'

interface FieldProps extends PropsWithChildren {
  label: string
  htmlFor?: string
  error?: string
  hint?: ReactNode
  style?: CSSProperties
}

export function Field({ children, error, hint, htmlFor, label, style }: FieldProps) {
  return (
    <label className="field" htmlFor={htmlFor} style={style}>
      <span className="field-label">{label}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
      {!error && hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

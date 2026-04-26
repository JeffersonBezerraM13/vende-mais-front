import clsx from 'clsx'

interface LoaderProps {
  fullscreen?: boolean
  label?: string
}

export function Loader({
  fullscreen = false,
  label = 'Carregando...',
}: LoaderProps) {
  return (
    <div className={clsx(fullscreen ? 'fullscreen-loader' : 'inline-loader')}>
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

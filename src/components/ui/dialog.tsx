import clsx from 'clsx'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { PropsWithChildren, ReactNode } from 'react'

interface AppDialogProps extends PropsWithChildren {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  footer?: ReactNode
  size?: 'md' | 'lg'
}

export function AppDialog({
  children,
  footer,
  onOpenChange,
  open,
  size = 'md',
  title,
}: AppDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className={clsx('dialog-content', size === 'lg' && 'dialog-lg')}>
          <div className="dialog-header">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
            </div>
            <Dialog.Close className="icon-button" aria-label="Fechar">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="dialog-body">{children}</div>
          {footer ? <div className="dialog-footer">{footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

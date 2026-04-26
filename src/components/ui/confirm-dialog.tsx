import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { AppDialog } from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  loading?: boolean
  icon?: ReactNode
}

export function ConfirmDialog({
  confirmLabel = 'Confirmar',
  description,
  loading = false,
  onConfirm,
  onOpenChange,
  open,
  title,
  tone = 'danger',
}: ConfirmDialogProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant={tone} loading={loading} onClick={() => void onConfirm()}>
            {confirmLabel}
          </Button>
        </>
      }
    >
    </AppDialog>
  )
}

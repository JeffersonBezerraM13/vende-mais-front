import { Mail, Shield } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { AppDialog } from '@/components/ui/dialog'
import { ROLE_LABELS } from '@/utils/constants'

import type { UserResponseDTO } from '@/types/api'

interface UserDetailsDialogProps {
  open: boolean
  user?: UserResponseDTO | null
  onOpenChange: (open: boolean) => void
}

export function UserDetailsDialog({
  onOpenChange,
  open,
  user,
}: UserDetailsDialogProps) {
  if (!user) {
    return null
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={user.name}
      description="Dados de acesso e permissões retornadas pela API."
    >
      <div className="details-grid">
        <article className="detail-card">
          <h3>Contato</h3>
          <div className="detail-list">
            <div>
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          </div>
        </article>
        <article className="detail-card">
          <h3>Permissões</h3>
          <div className="detail-badges">
            {user.roles.length ? (
              user.roles.map((role) => (
                <Badge key={role} tone={role === 'ADMIN' ? 'info' : 'neutral'}>
                  <Shield size={14} />
                  {ROLE_LABELS[role] || role}
                </Badge>
              ))
            ) : (
              <span>Nenhuma permissão retornada.</span>
            )}
          </div>
        </article>
      </div>
    </AppDialog>
  )
}

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CalendarRange, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/auth-store'
import { formatDate } from '@/utils/format'
import { isAdmin } from '@/utils/permissions'

const titles: Record<string, string> = {
  '/dashboard': 'Painel Comercial',
  '/leads': 'Gestao de Leads',
  '/opportunities': 'Funil de Oportunidades',
  '/pipelines': 'Configuracao de Funis',
  '/tasks': 'Agenda Comercial',
}

interface TopbarProps {
  collapsed: boolean
  onLogout: () => void
  onSidebarToggle: () => void
}

export function Topbar({
  collapsed,
  onLogout,
  onSidebarToggle,
}: TopbarProps) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button className="icon-button desktop-only" onClick={onSidebarToggle}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <div>
          <strong>{titles[location.pathname] ?? 'VendeMais CRM'}</strong>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-date desktop-only">
          <CalendarRange size={16} />
          <span>{formatDate(new Date().toISOString())}</span>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="profile-chip">
              <span className="profile-avatar">
                {user?.name?.slice(0, 1).toUpperCase() ?? 'V'}
              </span>
              <span className="profile-meta">
                <strong>{user?.name ?? 'Usuario'}</strong>
                <small>{isAdmin(user) ? 'Administrador' : 'Operador'}</small>
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className="dropdown-menu" sideOffset={8} align="end">
              <div className="dropdown-menu-header">
                <strong>{user?.email}</strong>
                <span>{(user?.roles ?? []).join(', ') || 'Sem roles'}</span>
              </div>
              <DropdownMenu.Separator className="dropdown-menu-separator" />
              <DropdownMenu.Item className="dropdown-menu-item" onSelect={onLogout}>
                <LogOut size={16} />
                Encerrar sessao
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}

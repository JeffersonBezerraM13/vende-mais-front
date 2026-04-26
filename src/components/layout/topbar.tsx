import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { CalendarRange, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { useAuthStore } from '@/features/auth/auth-store'
import { formatDate } from '@/utils/format'
import { isAdmin } from '@/utils/permissions'

const titles: Record<string, string> = {
  '/dashboard': 'Visão Geral',
  '/leads': 'Relacionamento Comercial',
  '/opportunities': 'Negociações',
  '/pipelines': 'Estrutura Comercial',
  '/tasks': 'Rotina Comercial',
  '/users': 'Administração',
}

interface TopbarProps {
  collapsed: boolean
  isMobileViewport: boolean
  mobileOpen: boolean
  onLogout: () => void
  onSidebarToggle: () => void
}

export function Topbar({
  collapsed,
  isMobileViewport,
  mobileOpen,
  onLogout,
  onSidebarToggle,
}: TopbarProps) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const sidebarExpanded = isMobileViewport ? mobileOpen : !collapsed
  const sidebarToggleTitle = isMobileViewport
    ? sidebarExpanded
      ? 'Fechar menu lateral'
      : 'Abrir menu lateral'
    : sidebarExpanded
      ? 'Recolher menu lateral'
      : 'Expandir menu lateral'

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button
          className="icon-button"
          onClick={onSidebarToggle}
          aria-label={sidebarToggleTitle}
          title={sidebarToggleTitle}
        >
          {sidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
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
            <button className="profile-chip" title="Abrir menu do usuário">
              <span className="profile-avatar">
                {user?.name?.slice(0, 1).toUpperCase() ?? 'V'}
              </span>
              <span className="profile-meta">
                <strong>{user?.name ?? 'Usuário'}</strong>
                <small>{isAdmin(user) ? 'Administrador' : 'Operador'}</small>
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content className="dropdown-menu" sideOffset={8} align="end">
              <div className="dropdown-menu-header">
                <strong>{user?.email}</strong>
                <span>{(user?.roles ?? []).join(', ') || 'Sem permissões'}</span>
              </div>
              <DropdownMenu.Separator className="dropdown-menu-separator" />
              <DropdownMenu.Item className="dropdown-menu-item" onSelect={onLogout}>
                <LogOut size={16} />
                Encerrar sessão
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  )
}

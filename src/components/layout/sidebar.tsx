import clsx from 'clsx'
import {
  Handshake,
  Funnel,
  LayoutDashboard,
  ListTodo,
  UserCog,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigation = [
  { to: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/opportunities', label: 'Oportunidades', icon: Handshake },
  { to: '/pipelines', label: 'Funis', icon: Funnel },
  { to: '/tasks', label: 'Tarefas', icon: ListTodo },
  { to: '/users', label: 'Usuários', icon: UserCog },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onNavigate: () => void
}

export function Sidebar({ collapsed, mobileOpen, onNavigate }: SidebarProps) {
  const isCompact = collapsed && !mobileOpen

  return (
    <aside
      className={clsx(
        'app-sidebar',
        isCompact && 'is-collapsed',
        mobileOpen && 'is-mobile-open',
      )}
    >
      <div className="sidebar-brand">
        <div className="sidebar-logo">VM</div>
        {!isCompact ? (
          <div>
            <strong>VendeMais</strong>
            <span>CRM comercial</span>
          </div>
        ) : null}
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx('sidebar-link', isActive && 'is-active')
              }
              onClick={onNavigate}
            >
              <Icon size={18} />
              {!isCompact ? <span>{item.label}</span> : null}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

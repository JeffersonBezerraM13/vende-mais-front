import clsx from 'clsx'
import {
  BriefcaseBusiness,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  UserCog,
  Users,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/opportunities', label: 'Oportunidades', icon: BriefcaseBusiness },
  { to: '/pipelines', label: 'Funis', icon: GitBranch },
  { to: '/tasks', label: 'Tarefas', icon: ListTodo },
  { to: '/users', label: 'Funcionarios', icon: UserCog },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onNavigate: () => void
}

export function Sidebar({ collapsed, mobileOpen, onNavigate }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'app-sidebar',
        collapsed && 'is-collapsed',
        mobileOpen && 'is-mobile-open',
      )}
    >
      <div className="sidebar-brand">
        <div className="sidebar-logo">VM</div>
        {!collapsed ? (
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
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

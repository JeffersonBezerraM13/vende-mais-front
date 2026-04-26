import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuthStore } from '@/features/auth/auth-store'

export function AppShell() {
  const logout = useAuthStore((state) => state.logout)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
      />
      {mobileOpen ? (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar Menu Lateral"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="app-content">
        <Topbar
          collapsed={collapsed}
          onLogout={logout}
          onSidebarToggle={() => setCollapsed((current) => !current)}
        />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuthStore } from '@/features/auth/auth-store'

const MOBILE_SIDEBAR_QUERY = '(max-width: 960px)'

function getIsMobileViewport() {
  return typeof window !== 'undefined'
    ? window.matchMedia(MOBILE_SIDEBAR_QUERY).matches
    : false
}

export function AppShell() {
  const logout = useAuthStore((state) => state.logout)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(MOBILE_SIDEBAR_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches)
    }

    setIsMobileViewport(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isMobileViewport) {
      setMobileOpen(false)
    }
  }, [isMobileViewport])

  const handleSidebarToggle = () => {
    if (isMobileViewport) {
      setMobileOpen((current) => !current)
      return
    }

    setCollapsed((current) => !current)
  }

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
          title="Fechar menu lateral"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="app-content">
        <Topbar
          collapsed={collapsed}
          isMobileViewport={isMobileViewport}
          mobileOpen={mobileOpen}
          onLogout={logout}
          onSidebarToggle={handleSidebarToggle}
        />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

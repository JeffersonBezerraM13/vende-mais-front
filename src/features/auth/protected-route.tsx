import { Navigate, Outlet } from 'react-router-dom'

import { Loader } from '@/components/ui/loader'
import { useAuthStore } from '@/features/auth/auth-store'

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status)

  if (status === 'bootstrapping') {
    return <Loader fullscreen label="Validando sessão..." />
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function GuestOnlyRoute() {
  const status = useAuthStore((state) => state.status)

  if (status === 'bootstrapping') {
    return <Loader fullscreen label="Carregando..." />
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

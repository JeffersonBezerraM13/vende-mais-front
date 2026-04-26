/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/layout/app-shell'
import { Loader } from '@/components/ui/loader'
import { GuestOnlyRoute, ProtectedRoute } from '@/features/auth/protected-route'

const LoginPage = lazy(() => import('@/features/auth/login-page'))
const DashboardPage = lazy(() => import('@/features/dashboard/dashboard-page'))
const LeadsPage = lazy(() => import('@/features/leads/leads-page'))

function withSuspense(element: ReactNode) {
  return (
    <Suspense fallback={<Loader fullscreen label="Carregando modulo..." />}>
      {element}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <GuestOnlyRoute />,
    children: [{ path: '/login', element: withSuspense(<LoginPage />) }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: withSuspense(<DashboardPage />) },
          { path: '/leads', element: withSuspense(<LeadsPage />) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

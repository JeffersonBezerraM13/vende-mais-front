/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import { Loader } from '@/components/ui/loader'
import { GuestOnlyRoute, ProtectedRoute } from '@/features/auth/protected-route'

const LoginPage = lazy(() => import('@/features/auth/login-page'))

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
        path: '/dashboard',
        element: <Loader label="Preparando dashboard..." />,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

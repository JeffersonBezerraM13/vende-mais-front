import { RouterProvider } from 'react-router-dom'

import { AppProviders } from '@/app/providers'
import { useAuthBootstrap } from '@/hooks/use-auth-bootstrap'
import { router } from '@/routes/router'

function AppContent() {
  useAuthBootstrap()

  return <RouterProvider router={router} />
}

export function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  )
}

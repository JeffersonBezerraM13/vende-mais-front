import { AppProviders } from '@/app/providers'

function AppContent() {
  return null
}

export function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  )
}

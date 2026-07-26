import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { SessionLoading } from '@/components/Shared/SessionLoading'
import { AppRoutes } from '@/routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<SessionLoading />}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  )
}

export default App

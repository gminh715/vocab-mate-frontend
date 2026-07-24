import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { setSessionExpiredHandler } from '../../api/client'
import { AuthProvider } from '../../features/auth/AuthProvider'
import { clearAuthSession } from '../../features/auth/auth-query'
import { queryClient } from '../query-client'

setSessionExpiredHandler(() => {
  clearAuthSession(queryClient)
})

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}

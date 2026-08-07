import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { I18nLanguageSync } from '@/components/Auth/I18nLanguageSync'
import { setSessionExpiredHandler } from '@/config/apiClient'
import { clearAuthSession } from '@/hooks/Auth/useAuth'
import { appTheme } from '@/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

setSessionExpiredHandler(() => {
  clearAuthSession(queryClient)
})

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <I18nLanguageSync />
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

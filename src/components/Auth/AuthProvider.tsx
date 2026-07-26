import { useMemo, type PropsWithChildren } from 'react'
import { normalizeApiError } from '@/config/apiClient'
import {
  AuthContext,
  type AuthContextValue,
} from '@/contexts/AuthContext'
import { useCurrentUserQuery } from '@/hooks/Auth/useAuth'

export function AuthProvider({ children }: PropsWithChildren) {
  const currentUserQuery = useCurrentUserQuery()
  const currentUser = currentUserQuery.data ?? null
  const error = useMemo(
    () =>
      currentUserQuery.error
        ? normalizeApiError(currentUserQuery.error)
        : null,
    [currentUserQuery.error],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      error,
      isAuthenticated: currentUser !== null,
      isInitializing: currentUserQuery.isPending,
    }),
    [currentUser, currentUserQuery.isPending, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

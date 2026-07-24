import { useMemo, type PropsWithChildren } from 'react'
import { normalizeApiError } from '../../api/client'
import { AuthContext, type AuthContextValue } from './auth-context'
import { useCurrentUserQuery } from './auth-hooks'

export function AuthProvider({ children }: PropsWithChildren) {
  const currentUserQuery = useCurrentUserQuery()
  const currentUser = currentUserQuery.data ?? null
  const error = currentUserQuery.error
    ? normalizeApiError(currentUserQuery.error)
    : null

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

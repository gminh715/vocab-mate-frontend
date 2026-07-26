import { createContext, useContext } from 'react'
import type { ApiError } from '@/config/apiClient'
import type { CurrentUser } from '@/types/Auth/auth'

export interface AuthContextValue {
  currentUser: CurrentUser | null
  error: ApiError | null
  isAuthenticated: boolean
  isInitializing: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

import { createContext } from 'react'
import type { ApiError } from '../../api/client'
import type { CurrentUser } from './auth-types'

export interface AuthContextValue {
  currentUser: CurrentUser | null
  error: ApiError | null
  isAuthenticated: boolean
  isInitializing: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

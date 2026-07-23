import {
  apiClient,
  refreshAccessToken,
  setAccessToken,
} from './client'
import type { AuthData, LoginInput, MyAccount } from './types'

export const authApi = {
  async login(input: LoginInput): Promise<MyAccount> {
    const auth = await apiClient.post<AuthData>('/auth/login', input, {
      retryOnUnauthorized: false,
    })
    setAccessToken(auth.accessToken)
    return apiClient.get<MyAccount>('/users/me')
  },

  async restoreSession(): Promise<MyAccount | null> {
    const refreshed = await refreshAccessToken()
    if (!refreshed) return null

    try {
      return await apiClient.get<MyAccount>('/users/me')
    } catch {
      setAccessToken(null)
      return null
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<{ message: string }>('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },
}

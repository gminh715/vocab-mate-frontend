import {
  apiClient,
  isApiError,
  refreshAccessToken,
  setAccessToken,
  waitForPendingRefresh,
} from '../config/apiClient'
import { loginSchema, registerSchema } from '../schemas/auth'
import type {
  LoginFormValues,
  RegisterFormValues,
} from '../schemas/auth'
import type {
  AuthData,
  CurrentUser,
  MessageData,
} from '../types/auth'

const getCurrentUser = (): Promise<CurrentUser> =>
  apiClient.get<CurrentUser>('/users/me')

const establishSession = async (auth: AuthData): Promise<CurrentUser> => {
  setAccessToken(auth.accessToken)

  try {
    return await getCurrentUser()
  } catch (error: unknown) {
    setAccessToken(null)
    throw error
  }
}

export const authApi = {
  async login(values: LoginFormValues): Promise<CurrentUser> {
    const request = loginSchema.parse(values)
    const auth = await apiClient.post<AuthData>('/auth/login', request, {
      skipAuth: true,
      skipAuthRefresh: true,
    })

    return establishSession(auth)
  },

  async register(values: RegisterFormValues): Promise<CurrentUser> {
    const request = registerSchema.parse(values)
    const auth = await apiClient.post<AuthData>('/auth/register', request, {
      skipAuth: true,
      skipAuthRefresh: true,
    })

    return establishSession(auth)
  },

  async refreshSession(): Promise<CurrentUser> {
    await refreshAccessToken()
    return getCurrentUser()
  },

  async restoreSession(): Promise<CurrentUser | null> {
    try {
      await refreshAccessToken()
      return await getCurrentUser()
    } catch (error: unknown) {
      setAccessToken(null)

      if (isApiError(error) && (error.status === 401 || error.status === 403)) {
        return null
      }

      throw error
    }
  },

  async logout(): Promise<void> {
    try {
      try {
        await waitForPendingRefresh()
      } catch {
        // Still ask the backend to clear its cookie when refresh failed.
      }

      await apiClient.post<MessageData>('/auth/logout')
    } finally {
      setAccessToken(null)
    }
  },
}

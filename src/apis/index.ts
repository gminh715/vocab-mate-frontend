import { apiClient, setAccessToken } from '~/api/client'
import type {
  AuthData,
  LoginRequest,
  MessageData,
  MyAccount,
  RegisterRequest,
} from '~/api/types'

export const loginAPI = async (input: LoginRequest): Promise<AuthData> => {
  const session = await apiClient.post<AuthData>('/auth/login', input, {
    retryOnUnauthorized: false,
  })

  setAccessToken(session.accessToken)
  return session
}

export const registerAPI = async (
  input: RegisterRequest,
): Promise<AuthData> => {
  const session = await apiClient.post<AuthData>('/auth/register', input, {
    retryOnUnauthorized: false,
  })

  setAccessToken(session.accessToken)
  return session
}

export const logoutAPI = async (): Promise<MessageData> => {
  try {
    return await apiClient.post<MessageData>('/auth/logout')
  } finally {
    setAccessToken(null)
  }
}

export const getCurrentUserAPI = async (): Promise<MyAccount> =>
  apiClient.get<MyAccount>('/users/me')

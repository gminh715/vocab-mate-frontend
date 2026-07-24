import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  isApiError: vi.fn(),
  post: vi.fn(),
  refreshAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
}))

vi.mock('../../api/client', () => ({
  apiClient: {
    get: clientMocks.get,
    post: clientMocks.post,
  },
  isApiError: clientMocks.isApiError,
  refreshAccessToken: clientMocks.refreshAccessToken,
  setAccessToken: clientMocks.setAccessToken,
}))

import { authApi } from './auth-api'
import type { AuthData, CurrentUser } from './auth-types'

const authData: AuthData = {
  user: {
    id: '1',
    email: 'learner@example.com',
    role: 'USER',
    status: 'ACTIVE',
  },
  accessToken: 'access-token',
}

const currentUser: CurrentUser = {
  ...authData.user,
  profile: {
    displayName: 'Learner',
    avatarUrl: null,
    currentCefrLevel: 'B1',
    learningGoal: null,
    preferredLanguage: 'vi',
  },
}

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores the login access token and resolves the authoritative current user', async () => {
    clientMocks.post.mockResolvedValue(authData)
    clientMocks.get.mockResolvedValue(currentUser)

    await expect(
      authApi.login({
        email: '  Learner@Example.COM ',
        password: 'StrongPass@123',
      }),
    ).resolves.toEqual(currentUser)

    expect(clientMocks.post).toHaveBeenCalledWith(
      '/auth/login',
      {
        email: 'learner@example.com',
        password: 'StrongPass@123',
      },
      {
        skipAuth: true,
        skipAuthRefresh: true,
      },
    )
    expect(clientMocks.setAccessToken).toHaveBeenCalledWith('access-token')
    expect(clientMocks.get).toHaveBeenCalledWith('/users/me')
  })

  it('restores a session by refreshing before loading the current user', async () => {
    clientMocks.refreshAccessToken.mockResolvedValue(undefined)
    clientMocks.get.mockResolvedValue(currentUser)

    await expect(authApi.restoreSession()).resolves.toEqual(currentUser)

    expect(clientMocks.refreshAccessToken).toHaveBeenCalledOnce()
    expect(clientMocks.get).toHaveBeenCalledWith('/users/me')
  })

  it.each([401, 403])(
    'treats refresh status %s as an unauthenticated session',
    async (status) => {
      const error = { status }
      clientMocks.refreshAccessToken.mockRejectedValue(error)
      clientMocks.isApiError.mockImplementation(
        (candidate: unknown) => candidate === error,
      )

      await expect(authApi.restoreSession()).resolves.toBeNull()

      expect(clientMocks.setAccessToken).toHaveBeenCalledWith(null)
      expect(clientMocks.get).not.toHaveBeenCalled()
    },
  )

  it('always clears the in-memory access token after logout', async () => {
    clientMocks.post.mockRejectedValue(new Error('network failure'))

    await expect(authApi.logout()).rejects.toThrow('network failure')

    expect(clientMocks.post).toHaveBeenCalledWith(
      '/auth/logout',
      undefined,
      { skipAuthRefresh: true },
    )
    expect(clientMocks.setAccessToken).toHaveBeenCalledWith(null)
  })
})

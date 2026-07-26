import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  isApiError: vi.fn(),
  post: vi.fn(),
  refreshAccessToken: vi.fn(),
  setAccessToken: vi.fn(),
  waitForPendingRefresh: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: {
    get: clientMocks.get,
    post: clientMocks.post,
  },
  isApiError: clientMocks.isApiError,
  refreshAccessToken: clientMocks.refreshAccessToken,
  setAccessToken: clientMocks.setAccessToken,
  waitForPendingRefresh: clientMocks.waitForPendingRefresh,
}))

import { authApi } from '@/api'
import type { AuthData, CurrentUser } from '@/types/Auth/auth'

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
    clientMocks.waitForPendingRefresh.mockResolvedValue(undefined)
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

  it('restores an expired access session with a valid refresh cookie', async () => {
    clientMocks.refreshAccessToken.mockResolvedValue(undefined)
    clientMocks.get.mockResolvedValue(currentUser)

    await expect(authApi.restoreSession()).resolves.toEqual(currentUser)

    expect(clientMocks.refreshAccessToken).toHaveBeenCalledOnce()
    expect(clientMocks.get).toHaveBeenCalledWith('/users/me')
  })

  it.each([401, 403])(
    'treats expired refresh status %s as an unauthenticated session',
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

    expect(clientMocks.post).toHaveBeenCalledWith('/auth/logout')
    expect(clientMocks.setAccessToken).toHaveBeenCalledWith(null)
  })

  it('waits for an in-flight refresh before asking the backend to log out', async () => {
    let finishRefresh: (() => void) | undefined
    clientMocks.waitForPendingRefresh.mockReturnValue(
      new Promise<void>((resolve) => {
        finishRefresh = resolve
      }),
    )
    clientMocks.post.mockResolvedValue({ message: 'Done' })

    const logout = authApi.logout()
    await Promise.resolve()

    expect(clientMocks.post).not.toHaveBeenCalled()

    finishRefresh?.()
    await logout

    expect(clientMocks.post).toHaveBeenCalledWith('/auth/logout')
  })
})

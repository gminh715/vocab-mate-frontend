import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const setAccessToken = vi.hoisted(() => vi.fn())

vi.mock('@/config/apiClient', () => ({
  setAccessToken,
}))

vi.mock('@/api/Auth/AuthApi', () => ({
  authApi: {},
}))

import {
  authQueryKeys,
  clearAuthSession,
} from '@/hooks/Auth/useAuth'

describe('authenticated session cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removes private user caches while preserving public discovery caches', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(authQueryKeys.currentUser(), { id: 'user-1' })
    queryClient.setQueryData(['analytics', 'me'], { private: true })
    queryClient.setQueryData(['reading', 'history'], { private: true })
    queryClient.setQueryData(['vocabularies', 'list'], { private: true })
    queryClient.setQueryData(['collections', 'list'], { private: true })
    queryClient.setQueryData(['/adminUsers', 'list'], { private: true })
    queryClient.setQueryData(['articles', 'list'], { public: true })
    queryClient.setQueryData(['categories', 'list'], { public: true })

    clearAuthSession(queryClient)

    expect(setAccessToken).toHaveBeenCalledWith(null)
    expect(
      queryClient.getQueryData(authQueryKeys.currentUser()),
    ).toBeNull()
    expect(queryClient.getQueryData(['analytics', 'me'])).toBeUndefined()
    expect(queryClient.getQueryData(['reading', 'history'])).toBeUndefined()
    expect(
      queryClient.getQueryData(['vocabularies', 'list']),
    ).toBeUndefined()
    expect(
      queryClient.getQueryData(['collections', 'list']),
    ).toBeUndefined()
    expect(
      queryClient.getQueryData(['/adminUsers', 'list']),
    ).toBeUndefined()
    expect(queryClient.getQueryData(['articles', 'list'])).toEqual({
      public: true,
    })
    expect(queryClient.getQueryData(['categories', 'list'])).toEqual({
      public: true,
    })
  })
})

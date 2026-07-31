import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  patch: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: {
    patch: clientMocks.patch,
  },
}))

import { profileApi } from '@/api/User/ProfileApi'

describe('profileApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PATCHes only the supplied profile DTO fields', async () => {
    clientMocks.patch.mockResolvedValue({})
    const request = {
      displayName: 'Mai',
      currentCefrLevel: 'B2' as const,
    }

    await profileApi.update(request)

    expect(clientMocks.patch).toHaveBeenCalledWith('/users/me', request)
    expect(clientMocks.patch.mock.calls[0]?.[1]).not.toHaveProperty('email')
    expect(clientMocks.patch.mock.calls[0]?.[1]).not.toHaveProperty('role')
    expect(clientMocks.patch.mock.calls[0]?.[1]).not.toHaveProperty('status')
    expect(clientMocks.patch.mock.calls[0]?.[1]).not.toHaveProperty(
      'password',
    )
  })
})

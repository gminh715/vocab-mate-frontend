import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  deleteNoContent: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: {
    deleteNoContent: clientMocks.deleteNoContent,
    get: clientMocks.get,
    patch: clientMocks.patch,
    post: clientMocks.post,
  },
}))

import { collectionsApi } from '@/api/Vocabulary/CollectionsApi'

describe('collectionsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the owner-scoped collection detail and update endpoints', async () => {
    clientMocks.get.mockResolvedValue({})
    clientMocks.patch.mockResolvedValue({})

    await collectionsApi.findOne('collection/id')
    await collectionsApi.update('collection/id', { name: 'Technology' })

    expect(clientMocks.get).toHaveBeenCalledWith(
      '/collections/collection%2Fid',
    )
    expect(clientMocks.patch).toHaveBeenCalledWith(
      '/collections/collection%2Fid',
      { name: 'Technology' },
    )
  })

  it('lists collection items with only the documented query fields', async () => {
    clientMocks.get.mockResolvedValue({ items: [] })
    const params = {
      page: 2,
      limit: 20,
      q: 'harmful',
      learningStatus: 'LEARNING' as const,
      sort: 'oldest' as const,
    }

    await collectionsApi.findItems('collection/id', params)

    expect(clientMocks.get).toHaveBeenCalledWith(
      '/collections/collection%2Fid/items',
      { params },
    )
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: {
    get: clientMocks.get,
    post: clientMocks.post,
  },
}))

import {
  adminNewsApi,
  adminNewsSearchRequestParams,
} from '@/api/Admin/AdminNewsApi'
import { adminNewsSearchSchema } from '@/schemas/Admin/adminNews'

describe('adminNewsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clientMocks.get.mockResolvedValue({ totalArticles: 0, articles: [] })
    clientMocks.post.mockResolvedValue({
      counts: {
        discovered: 0,
        imported: 0,
        skippedDuplicate: 0,
        failed: 0,
      },
      items: [],
    })
  })

  it('sends only Guardian discovery metadata filters', async () => {
    const params = {
      q: 'climate',
      section: 'technology',
      fromDate: '2026-07-01',
      toDate: '2026-07-31',
      orderBy: 'newest' as const,
      page: 2,
      pageSize: 5,
    }

    await adminNewsApi.search(params)

    expect(clientMocks.get).toHaveBeenCalledWith('/admin/news/search', {
      params,
    })
    expect(adminNewsSearchRequestParams(params)).not.toHaveProperty('body')
    expect(adminNewsSearchRequestParams(params)).not.toHaveProperty('apiKey')
  })

  it('syncs the exact discovery request with a default category', async () => {
    const request = {
      q: 'climate',
      orderBy: 'relevance' as const,
      pageSize: 5,
      defaultCategoryId: '550e8400-e29b-41d4-a716-446655440000',
    }

    await adminNewsApi.sync(request)

    expect(clientMocks.post).toHaveBeenCalledWith(
      '/admin/news/sync',
      request,
    )
  })
})

describe('Guardian search validation', () => {
  it('requires a phrase or section and validates the date range', () => {
    expect(
      adminNewsSearchSchema.safeParse({
        q: '',
        section: '',
        fromDate: '',
        toDate: '',
        orderBy: 'newest',
      }).success,
    ).toBe(false)

    expect(
      adminNewsSearchSchema.safeParse({
        q: 'technology',
        section: '',
        fromDate: '2026-07-31',
        toDate: '2026-07-01',
        orderBy: 'newest',
      }).success,
    ).toBe(false)
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: {
    get: clientMocks.get,
  },
}))

import { readingApi } from '@/api/Reading/ReadingApi'

describe('article reader API mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requests the authenticated reader payload by encoded slug', async () => {
    clientMocks.get.mockResolvedValue({
      article: { slug: 'science/news' },
      contentHtml: '<p>Prepared content</p>',
      highlightedTermIds: [],
      progress: { progressPercent: 0 },
    })

    await readingApi.article('science/news')

    expect(clientMocks.get).toHaveBeenCalledWith(
      '/reading/articles/science%2Fnews',
    )
  })
})

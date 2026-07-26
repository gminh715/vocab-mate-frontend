import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: {
    get: clientMocks.get,
  },
}))

import {
  articleListRequestParams,
  articlesApi,
} from '@/api/Article/ArticlesApi'
import { categoriesApi } from '@/api/Article/CategoriesApi'
import {
  articleListParamsFromSearchParams,
  normalizeArticleSearchParams,
} from '@/utils/Article/articleListParams'

describe('article discovery URL and API mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps frontend URL names to the documented article query names', async () => {
    const params = articleListParamsFromSearchParams(
      new URLSearchParams(
        'page=3&q=%20climate%20&category=SCIENCE&cefr=B2&sort=oldest',
      ),
    )

    expect(params).toEqual({
      page: 3,
      limit: 12,
      q: 'climate',
      categorySlug: 'science',
      cefrLevel: 'B2',
      sort: 'oldest',
    })
    expect(articleListRequestParams(params)).toEqual({
      page: 3,
      limit: 12,
      q: 'climate',
      categorySlug: 'science',
      cefrLevel: 'B2',
      sort: 'oldest',
    })

    clientMocks.get.mockResolvedValue({
      items: [],
      meta: { page: 3, limit: 12, total: 0, totalPages: 0 },
    })
    await articlesApi.list(params)

    expect(clientMocks.get).toHaveBeenCalledWith('/articles', {
      params: {
        page: 3,
        limit: 12,
        q: 'climate',
        categorySlug: 'science',
        cefrLevel: 'B2',
        sort: 'oldest',
      },
    })
  })

  it('normalizes invalid and default URL values without sending them', () => {
    const normalized = normalizeArticleSearchParams(
      new URLSearchParams(
        'page=0&q=%20%20&category=not_valid&cefr=B3&sort=popular',
      ),
    )

    expect(normalized.toString()).toBe('')
    expect(articleListParamsFromSearchParams(normalized)).toEqual({
      page: 1,
      limit: 12,
      sort: 'newest',
    })
  })

  it('uses the active category list and slug-detail contracts', async () => {
    clientMocks.get.mockResolvedValue({ items: [] })

    await categoriesApi.list()
    await categoriesApi.detail('science/news')

    expect(clientMocks.get).toHaveBeenNthCalledWith(1, '/categories', {
      params: {},
    })
    expect(clientMocks.get).toHaveBeenNthCalledWith(
      2,
      '/categories/science%2Fnews',
    )
  })

  it('requests one published article directly by its encoded slug', async () => {
    clientMocks.get.mockResolvedValue({
      article: { slug: 'science/news' },
      category: { slug: 'science' },
      quizCount: 2,
    })

    await articlesApi.detail('science/news')

    expect(clientMocks.get).toHaveBeenCalledWith(
      '/articles/science%2Fnews',
    )
  })
})

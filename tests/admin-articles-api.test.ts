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

import {
  adminArticlesApi,
  articleListRequestParams,
} from '@/api/Admin/AdminArticlesApi'
import {
  articleFormSchema,
  hasArticleContentChanged,
  toCreateArticleRequest,
  toUpdateArticleRequest,
} from '@/schemas/Admin/adminArticle'
import { adminArticleListParamsFromSearchParams } from '@/utils/Admin/adminArticleListParams'

const validValues = articleFormSchema.parse({
  categoryId: '550e8400-e29b-41d4-a716-446655440000',
  title: '  Learning through technology  ',
  slug: '  LEARNING-THROUGH-TECHNOLOGY  ',
  summary: '  A practical overview.  ',
  cefrLevel: 'B1',
  sourceName: '  Vocab Mate News  ',
  sourceUrl: 'https://example.com/source',
  authorName: '  Jane Doe  ',
  thumbnailUrl: '',
  contentHtml: '<p>Original article.</p>',
})

describe('admin article filter mapping', () => {
  it('maps all supported URL filters and sorting values', () => {
    const params = adminArticleListParamsFromSearchParams(
      new URLSearchParams(
        'page=3&limit=50&q=%20learning%20&categoryId=category-1&cefrLevel=C1&status=ARCHIVED&sort=oldest',
      ),
    )

    expect(params).toEqual({
      page: 3,
      limit: 50,
      q: 'learning',
      categoryId: 'category-1',
      cefrLevel: 'C1',
      status: 'ARCHIVED',
      sort: 'oldest',
    })
    expect(articleListRequestParams(params)).toEqual(params)
  })

  it('drops unsupported enum values and bounds pagination', () => {
    expect(
      adminArticleListParamsFromSearchParams(
        new URLSearchParams(
          'page=0&limit=101&cefrLevel=B3&status=REVIEW&sort=popular',
        ),
      ),
    ).toEqual({
      page: 1,
      limit: 20,
      sort: 'newest',
    })
  })
})

describe('article create and update DTOs', () => {
  it('normalizes create values and omits blank optional fields', () => {
    expect(toCreateArticleRequest(validValues)).toEqual({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Learning through technology',
      slug: 'learning-through-technology',
      summary: 'A practical overview.',
      cefrLevel: 'B1',
      sourceName: 'Vocab Mate News',
      sourceUrl: 'https://example.com/source',
      authorName: 'Jane Doe',
      contentHtml: '<p>Original article.</p>',
    })
  })

  it('sends only changed update fields including contentHtml', () => {
    const changed = articleFormSchema.parse({
      ...validValues,
      title: 'Updated title',
      cefrLevel: 'B2',
      contentHtml: '<p>Updated article.</p>',
    })

    expect(toUpdateArticleRequest(changed, validValues)).toEqual({
      title: 'Updated title',
      cefrLevel: 'B2',
      contentHtml: '<p>Updated article.</p>',
    })
  })

  it('detects content changes without parsing or rewriting HTML', () => {
    expect(
      hasArticleContentChanged(
        '<p>Original article.</p>',
        '<p>Original article.</p>',
      ),
    ).toBe(false)
    expect(
      hasArticleContentChanged(
        '<p>Original article.</p>',
        '<p>Changed article.</p>',
      ),
    ).toBe(true)
  })
})

describe('adminArticlesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses one paginated list request and maps mutations', async () => {
    clientMocks.get.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
    clientMocks.post.mockResolvedValue({ article: { id: 'article-1' } })
    clientMocks.patch.mockResolvedValue({
      article: { id: 'article-1' },
      contentChanged: false,
    })
    clientMocks.deleteNoContent.mockResolvedValue(undefined)

    await adminArticlesApi.list({
      page: 1,
      limit: 20,
      status: 'DRAFT',
      sort: 'newest',
    })
    await adminArticlesApi.create(toCreateArticleRequest(validValues))
    await adminArticlesApi.update('article/id', { title: 'Updated' })
    await adminArticlesApi.delete('article/id')

    expect(clientMocks.get).toHaveBeenCalledTimes(1)
    expect(clientMocks.get).toHaveBeenCalledWith('/admin/articles', {
      params: {
        page: 1,
        limit: 20,
        status: 'DRAFT',
        sort: 'newest',
      },
    })
    expect(clientMocks.patch).toHaveBeenCalledWith(
      '/admin/articles/article%2Fid',
      { title: 'Updated' },
    )
    expect(clientMocks.deleteNoContent).toHaveBeenCalledWith(
      '/admin/articles/article%2Fid',
    )
  })
})

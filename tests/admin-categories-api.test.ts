import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  deleteNoContent: vi.fn(),
  get: vi.fn(),
  getWithMeta: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  ApiError: class ApiError extends Error {
    status = 0
    code = 'INVALID_RESPONSE'
  },
  apiClient: {
    deleteNoContent: clientMocks.deleteNoContent,
    get: clientMocks.get,
    getWithMeta: clientMocks.getWithMeta,
    patch: clientMocks.patch,
    post: clientMocks.post,
  },
}))

import { adminCategoriesApi } from '@/api/Admin/AdminCategoriesApi'
import {
  categoryFormSchema,
  toCreateCategoryRequest,
  toUpdateCategoryRequest,
} from '@/schemas/Admin/adminCategory'
import { adminCategoryListParamsFromSearchParams } from '@/utils/Admin/adminCategoryListParams'

describe('adminCategoriesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps pagination and inactive filtering into the list query', async () => {
    clientMocks.getWithMeta.mockResolvedValue({
      data: { items: [] },
      meta: {
        page: 2,
        limit: 50,
        total: 0,
        totalPages: 0,
      },
    })

    await expect(
      adminCategoriesApi.list({
        page: 2,
        limit: 50,
        q: 'technology',
        isActive: false,
      }),
    ).resolves.toEqual({
      items: [],
      meta: {
        page: 2,
        limit: 50,
        total: 0,
        totalPages: 0,
      },
    })

    expect(clientMocks.getWithMeta).toHaveBeenCalledWith(
      '/admin/categories',
      {
        params: {
          page: 2,
          limit: 50,
          q: 'technology',
          isActive: false,
        },
      },
    )
  })

  it('maps status and delete operations to their documented endpoints', async () => {
    clientMocks.patch.mockResolvedValue({
      id: 'category-1',
      isActive: false,
    })
    clientMocks.deleteNoContent.mockResolvedValue(undefined)

    await adminCategoriesApi.updateStatus('category/id', false)
    await adminCategoriesApi.delete('category/id')

    expect(clientMocks.patch).toHaveBeenCalledWith(
      '/admin/categories/category%2Fid/status',
      { isActive: false },
    )
    expect(clientMocks.deleteNoContent).toHaveBeenCalledWith(
      '/admin/categories/category%2Fid',
    )
  })
})

describe('category DTO mapping', () => {
  it('normalizes create values and omits an empty description', () => {
    const values = categoryFormSchema.parse({
      name: '  Technology  ',
      slug: '  WEB-DEVELOPMENT  ',
      description: '   ',
      isActive: true,
      displayOrder: 3,
    })

    expect(toCreateCategoryRequest(values)).toEqual({
      name: 'Technology',
      slug: 'web-development',
      isActive: true,
      displayOrder: 3,
    })
  })

  it('maps an empty edit description explicitly so it can be cleared', () => {
    const values = categoryFormSchema.parse({
      name: 'Technology',
      slug: 'technology',
      description: '',
      isActive: false,
      displayOrder: 4,
    })

    expect(toUpdateCategoryRequest(values)).toEqual({
      name: 'Technology',
      slug: 'technology',
      description: '',
      displayOrder: 4,
    })
  })
})

describe('admin category URL query mapping', () => {
  it('maps pagination, search, and the false active filter', () => {
    expect(
      adminCategoryListParamsFromSearchParams(
        new URLSearchParams(
          'page=3&limit=50&q=%20news%20&isActive=false',
        ),
      ),
    ).toEqual({
      page: 3,
      limit: 50,
      q: 'news',
      isActive: false,
    })
  })

  it('falls back safely for invalid pagination and filters', () => {
    expect(
      adminCategoryListParamsFromSearchParams(
        new URLSearchParams('page=0&limit=101&isActive=maybe'),
      ),
    ).toEqual({
      page: 1,
      limit: 20,
    })
  })
})

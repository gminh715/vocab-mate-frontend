import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: {
    get: clientMocks.get,
    patch: clientMocks.patch,
  },
}))

import { adminUsersApi } from '@/api/Admin/AdminUsersApi'
import { adminUserListParamsFromSearchParams } from '@/utils/Admin/adminUserListParams'

describe('adminUsersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps supported list query values and omits absent filters', async () => {
    clientMocks.get.mockResolvedValue({
      items: [],
      meta: { page: 2, limit: 50, total: 0, totalPages: 0 },
    })

    await adminUsersApi.list({
      page: 2,
      limit: 50,
      q: 'learner',
      role: 'USER',
      sort: 'oldest',
    })

    expect(clientMocks.get).toHaveBeenCalledWith('/admin/users', {
      params: {
        page: 2,
        limit: 50,
        q: 'learner',
        role: 'USER',
        sort: 'oldest',
      },
    })
  })

  it('maps role and status mutations to their documented endpoints', async () => {
    clientMocks.patch.mockResolvedValue({})

    await adminUsersApi.updateStatus('user/id', 'DISABLED')
    await adminUsersApi.updateRole('user/id', 'ADMIN')

    expect(clientMocks.patch).toHaveBeenNthCalledWith(
      1,
      '/admin/users/user%2Fid/status',
      { status: 'DISABLED' },
    )
    expect(clientMocks.patch).toHaveBeenNthCalledWith(
      2,
      '/admin/users/user%2Fid/role',
      { role: 'ADMIN' },
    )
  })
})

describe('admin user URL query mapping', () => {
  it('maps valid filters, sorting, and pagination from URL parameters', () => {
    const params = adminUserListParamsFromSearchParams(
      new URLSearchParams(
        'page=3&limit=50&q=%20Ada%20&role=ADMIN&status=SUSPENDED&sort=oldest',
      ),
    )

    expect(params).toEqual({
      page: 3,
      limit: 50,
      q: 'Ada',
      role: 'ADMIN',
      status: 'SUSPENDED',
      sort: 'oldest',
    })
  })

  it('falls back safely for unsupported URL values', () => {
    const params = adminUserListParamsFromSearchParams(
      new URLSearchParams(
        'page=0&limit=101&role=OWNER&status=DELETED&sort=email',
      ),
    )

    expect(params).toEqual({
      page: 1,
      limit: 20,
      sort: 'newest',
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  deleteNoContent: vi.fn(),
}))

vi.mock('../src/config/apiClient', () => ({
  apiClient: clientMocks,
}))

import { readingApi } from '../src/api/ReadingApi'

describe('reading progress and history API mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps progress, completion, and reset requests', async () => {
    clientMocks.get.mockResolvedValue({ progress: {} })
    clientMocks.put.mockResolvedValue({ progress: {} })
    clientMocks.post.mockResolvedValue({ progress: {} })
    clientMocks.deleteNoContent.mockResolvedValue(undefined)

    await readingApi.progress('article/id')
    await readingApi.updateProgress('article/id', {
      progressPercent: 42.5,
    })
    await readingApi.complete('article/id')
    await readingApi.reset('article/id')

    expect(clientMocks.get).toHaveBeenCalledWith(
      '/reading/progress/article%2Fid',
    )
    expect(clientMocks.put).toHaveBeenCalledWith(
      '/reading/progress/article%2Fid',
      { progressPercent: 42.5 },
    )
    expect(clientMocks.post).toHaveBeenCalledWith(
      '/reading/progress/article%2Fid/complete',
    )
    expect(clientMocks.deleteNoContent).toHaveBeenCalledWith(
      '/reading/progress/article%2Fid',
    )
  })

  it('maps required and optional history query parameters', async () => {
    clientMocks.get.mockResolvedValue({ items: [], meta: {} })

    await readingApi.history({
      page: 2,
      limit: 10,
      status: 'READING',
      sort: 'oldest',
    })

    expect(clientMocks.get).toHaveBeenCalledWith(
      '/reading/history?page=2&limit=10&sort=oldest&status=READING',
    )
  })
})

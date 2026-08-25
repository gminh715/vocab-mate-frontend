import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiGet, apiPost } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: { get: apiGet, post: apiPost },
}))

import { reviewsApi } from '@/api/Review/ReviewsApi'

describe('reviewsApi', () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiPost.mockReset()
    apiGet.mockResolvedValue({})
    apiPost.mockResolvedValue({})
  })

  it('maps due, active, durable session, and summary reads', async () => {
    await reviewsApi.today()
    await reviewsApi.active()
    await reviewsApi.history({ page: 2, status: 'COMPLETED' })
    await reviewsApi.session('session/id')
    await reviewsApi.summary('session/id')

    expect(apiGet).toHaveBeenNthCalledWith(1, '/reviews/today')
    expect(apiGet).toHaveBeenNthCalledWith(2, '/review-sessions/active')
    expect(apiGet).toHaveBeenNthCalledWith(
      3,
      '/reviews/history',
      { params: { page: 2, status: 'COMPLETED' } },
    )
    expect(apiGet).toHaveBeenNthCalledWith(
      4,
      '/review-sessions/session%2Fid',
    )
    expect(apiGet).toHaveBeenNthCalledWith(
      5,
      '/review-sessions/session%2Fid/summary',
    )
  })

  it('submits only the backend-owned question pair and interaction metadata', async () => {
    const request = {
      reviewSessionItemId: 'item-id',
      reviewQuestionId: 'question-id',
      selectedOptionId: 'option-id',
      responseTimeMs: 1_200,
      hintsUsed: 1,
    }

    await reviewsApi.answer('session-id', request)
    await reviewsApi.skip('session-id', {
      reviewSessionItemId: 'item-id',
      reviewQuestionId: 'question-id',
    })
    await reviewsApi.abandon('session/id')

    expect(apiPost).toHaveBeenNthCalledWith(
      1,
      '/review-sessions/session-id/answers',
      request,
    )
    expect(apiPost).toHaveBeenNthCalledWith(
      2,
      '/review-sessions/session-id/skip',
      {
        reviewSessionItemId: 'item-id',
        reviewQuestionId: 'question-id',
      },
    )
    expect(request).not.toHaveProperty('attemptNumber')
    expect(apiPost).toHaveBeenNthCalledWith(
      3,
      '/review-sessions/session%2Fid/abandon',
    )
  })
})

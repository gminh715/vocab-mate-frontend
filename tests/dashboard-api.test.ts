import { beforeEach, describe, expect, it, vi } from 'vitest'

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: {
    get: apiGet,
  },
}))

import { analyticsApi } from '@/api/Analytics/AnalyticsApi'

describe('analyticsApi', () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiGet.mockResolvedValue({
      savedVocabulary: 4,
      dueToday: 1,
      mastered: 2,
      articlesCompleted: 3,
      quizAccuracy: 0.75,
      sessions: 2,
    })
  })

  it('maps the learner overview query to the user analytics endpoint', async () => {
    const params = {
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-26T00:00:00.000Z',
    }

    await analyticsApi.overview(params)

    expect(apiGet).toHaveBeenCalledWith('/analytics/me/overview', { params })
    expect(apiGet.mock.calls[0]?.[0]).not.toContain('/admin/')
  })

  it('uses the backend default date range when no params are supplied', async () => {
    await analyticsApi.overview()

    expect(apiGet).toHaveBeenCalledWith('/analytics/me/overview', {
      params: {},
    })
  })

  it('maps each detailed learner query without using admin analytics', async () => {
    const dateParams = {
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-26T00:00:00.000Z',
    }

    await analyticsApi.vocabulary({ ...dateParams, groupBy: 'WEEK' })
    await analyticsApi.reading(dateParams)
    await analyticsApi.quizzes({
      ...dateParams,
      articleId: '550e8400-e29b-41d4-a716-446655440000',
    })
    await analyticsApi.reviews(dateParams)

    expect(apiGet).toHaveBeenNthCalledWith(
      1,
      '/analytics/me/vocabulary',
      { params: { ...dateParams, groupBy: 'WEEK' } },
    )
    expect(apiGet).toHaveBeenNthCalledWith(2, '/analytics/me/reading', {
      params: dateParams,
    })
    expect(apiGet).toHaveBeenNthCalledWith(3, '/analytics/me/quizzes', {
      params: {
        ...dateParams,
        articleId: '550e8400-e29b-41d4-a716-446655440000',
      },
    })
    expect(apiGet).toHaveBeenNthCalledWith(4, '/analytics/me/reviews', {
      params: dateParams,
    })
    expect(apiGet.mock.calls.flat().join(' ')).not.toContain('/admin/')
  })
})

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('@/config/apiClient', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/config/apiClient')>()
  return {
    ...original,
    apiClient: {
      ...original.apiClient,
      get: clientMocks.get,
    },
  }
})

import { adminAnalyticsApi } from '@/api/Admin/AdminAnalyticsApi'
import { adminCategoriesApi } from '@/api/Admin/AdminCategoriesApi'
import { ApiError } from '@/config/apiClient'
import { AdminAnalyticsPage } from '@/pages/Admin/AdminAnalyticsPage'
import {
  adminAnalyticsFiltersFromSearchParams,
  analyticsDateRangeError,
  analyticsRequestParams,
  contentAnalyticsRequestParams,
  userAnalyticsRequestParams,
} from '@/utils/Admin/adminAnalyticsParams'

const zeroOverview = {
  users: 0,
  activeUsers: 0,
  articles: 0,
  publishedArticles: 0,
  savedVocabulary: 0,
  completedSessions: 0,
}

const zeroContent = {
  topArticles: [],
  completionRates: [],
  termSaveCounts: [],
  quizPerformance: [],
}

const zeroUsers = {
  registrationsTrend: [],
  activeLearners: 0,
  retentionProxy: {
    firstWindowActive: 0,
    secondWindowActive: 0,
    retainedUsers: 0,
    rate: 0,
  },
  learningDistribution: {
    inactive: 0,
    readingOnly: 0,
    vocabularyOnly: 0,
    quizOnly: 0,
    multiActivity: 0,
  },
}

const renderPage = (path = '/admin/analytics') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <AdminAnalyticsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('admin analytics URL and request mapping', () => {
  it('maps valid URL filters and sends local date boundaries as ISO instants', () => {
    const filters = adminAnalyticsFiltersFromSearchParams(
      new URLSearchParams(
        'from=2026-07-01&to=2026-08-01&categoryId=category-1&status=SUSPENDED',
      ),
    )

    expect(filters).toEqual({
      from: '2026-07-01',
      to: '2026-08-01',
      categoryId: 'category-1',
      status: 'SUSPENDED',
    })
    expect(analyticsRequestParams(filters)).toEqual({
      from: new Date(2026, 6, 1).toISOString(),
      to: new Date(2026, 7, 1).toISOString(),
    })
    expect(contentAnalyticsRequestParams(filters)).toMatchObject({
      categoryId: 'category-1',
    })
    expect(userAnalyticsRequestParams(filters)).toMatchObject({
      status: 'SUSPENDED',
    })
  })

  it('drops malformed filters and rejects invalid or oversized ranges', () => {
    expect(
      adminAnalyticsFiltersFromSearchParams(
        new URLSearchParams(
          'from=2026-02-30&to=bad&status=DELETED',
        ),
      ),
    ).toEqual({})
    expect(
      analyticsDateRangeError({
        from: '2026-07-02',
        to: '2026-07-01',
      }),
    ).toContain('must be after')
    expect(
      analyticsDateRangeError({
        from: '2025-01-01',
        to: '2026-01-03',
      }),
    ).toContain('366 days')
  })
})

describe('adminAnalyticsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clientMocks.get.mockResolvedValue({})
  })

  it('maps all aggregate endpoints without source-record requests', async () => {
    const dates = { from: '2026-07-01T00:00:00.000Z' }
    await adminAnalyticsApi.overview(dates)
    await adminAnalyticsApi.content({ ...dates, categoryId: 'category-1' })
    await adminAnalyticsApi.users({ ...dates, status: 'ACTIVE' })

    expect(clientMocks.get.mock.calls).toEqual([
      ['/admin/analytics/overview', { params: dates }],
      [
        '/admin/analytics/content',
        { params: { ...dates, categoryId: 'category-1' } },
      ],
      [
        '/admin/analytics/users',
        { params: { ...dates, status: 'ACTIVE' } },
      ],
    ])
  })
})

describe('AdminAnalyticsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(adminCategoriesApi, 'list').mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
    })
    vi.spyOn(adminAnalyticsApi, 'overview').mockResolvedValue(zeroOverview)
    vi.spyOn(adminAnalyticsApi, 'content').mockResolvedValue(zeroContent)
    vi.spyOn(adminAnalyticsApi, 'users').mockResolvedValue(zeroUsers)
  })

  it('renders explicit zero-data states without inventing ratios', async () => {
    renderPage()

    expect(
      await screen.findByText(
        'No operational activity or current records were returned for these filters.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'No content activity was returned for this range and category.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'No registration buckets were returned for this range.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Retention proxy')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('keeps successful sections visible when content analytics fails', async () => {
    vi.spyOn(adminAnalyticsApi, 'content').mockRejectedValue(
      new ApiError({
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Content analytics are temporarily unavailable.',
      }),
    )
    renderPage()

    expect((await screen.findAllByText('Active learners')).length).toBe(2)
    expect(
      await screen.findByText('Content analytics are temporarily unavailable.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
  })
})

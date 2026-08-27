import '@testing-library/jest-dom/vitest'
import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LearningAnalyticsSections } from '@/components/Dashboard/LearningAnalyticsSections'
import i18n from '@/i18n/i18n'
import { appTheme } from '@/theme'

const { analyticsMocks, sectionState } = vi.hoisted(() => ({
  analyticsMocks: {
    vocabulary: vi.fn(),
    reading: vi.fn(),
    reviews: vi.fn(),
  },
  sectionState: {
    vocabularyError: false,
  },
}))

const vocabularyData = {
  totals: { total: 10, due: 2, mastered: 3 },
  byStatus: [
    { status: 'NEW', count: 2 },
    { status: 'LEARNING', count: 3 },
    { status: 'REVIEWING', count: 1 },
    { status: 'MASTERED', count: 3 },
    { status: 'IGNORED', count: 1 },
  ],
  byCefr: [
    { cefrLevel: 'A1', count: 1 },
    { cefrLevel: 'A2', count: 2 },
    { cefrLevel: 'B1', count: 3 },
    { cefrLevel: 'B2', count: 2 },
    { cefrLevel: 'C1', count: 1 },
    { cefrLevel: 'C2', count: 1 },
  ],
  savedTrend: [
    { bucket: '2026-07-01', count: 2 },
    { bucket: '2026-07-08', count: 1 },
  ],
}

const readingData = {
  opened: 0,
  completed: 0,
  completionRate: 0,
  byCategory: [],
  trend: [{ bucket: '2026-07-01', opened: 0, completed: 0 }],
}

const reviewData = {
  sessionsStarted: 4,
  sessionsCompleted: 3,
  sessionsAbandoned: 1,
  completionRate: 0.75,
  answers: 6,
  correctAnswers: 4,
  accuracy: 0.6667,
  averageResponseTimeMs: 3200,
  hintsUsed: 2,
  sameSessionRetest: { attempts: 2, correct: 1, successRate: 0.5 },
  bySkill: [
    {
      skillDimension: 'RECALL',
      attempts: 5,
      correct: 3,
      accuracy: 0.6,
      averageResponseTimeMs: 3200,
      hintsUsed: 2,
    },
  ],
  byDuration: [
    { targetDurationMinutes: 5, started: 0, completed: 0, completionRate: 0 },
    { targetDurationMinutes: 10, started: 4, completed: 3, completionRate: 0.75 },
    { targetDurationMinutes: 15, started: 0, completed: 0, completionRate: 0 },
  ],
  byDecisionSource: [
    { source: 'AI', interventions: 2, retestAttempts: 2, successfulRetests: 1, retestSuccessRate: 0.5 },
  ],
  retention: {
    nextDay: { followUps: 2, correct: 1, accuracy: 0.5 },
    sevenDay: { followUps: 0, correct: 0, accuracy: 0 },
  },
  trend: [
    {
      bucket: '2026-07-10',
      answers: 3,
      correctAnswers: 2,
      accuracy: 0.6667,
      averageResponseTimeMs: 3500,
      hintsUsed: 1,
    },
  ],
}

vi.mock('@/hooks/Analytics/useAnalytics', () => ({
  useVocabularyAnalyticsQuery: (
    params: unknown,
    enabled: boolean,
  ) => {
    analyticsMocks.vocabulary(params, enabled)
    return {
      data: sectionState.vocabularyError ? undefined : vocabularyData,
      isPending: false,
      isFetching: false,
      isError: sectionState.vocabularyError,
      error: sectionState.vocabularyError ? new Error('failed') : null,
      refetch: vi.fn(),
    }
  },
  useReadingAnalyticsQuery: (params: unknown, enabled: boolean) => {
    analyticsMocks.reading(params, enabled)
    return {
      data: readingData,
      isPending: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }
  },
  useReviewAnalyticsQuery: (params: unknown, enabled: boolean) => {
    analyticsMocks.reviews(params, enabled)
    return {
      data: reviewData,
      isPending: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }
  },
}))

const renderAnalytics = (entry = '/') =>
  render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={[entry]}>
        <LearningAnalyticsSections />
      </MemoryRouter>
    </ThemeProvider>,
  )

describe('detailed learning analytics', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    sectionState.vocabularyError = false
    readingData.opened = 0
    readingData.completed = 0
    readingData.completionRate = 0
    readingData.trend = [
      { bucket: '2026-07-01', opened: 0, completed: 0 },
    ]
    analyticsMocks.vocabulary.mockClear()
    analyticsMocks.reading.mockClear()
    analyticsMocks.reviews.mockClear()
  })

  it('restores URL filters and scopes optional parameters to their endpoints', () => {
    renderAnalytics(
      '/?from=2026-07-01&to=2026-07-26&groupBy=WEEK',
    )

    expect(screen.getByLabelText('From')).toHaveValue('2026-07-01')
    expect(screen.getByLabelText('To (exclusive)')).toHaveValue('2026-07-26')
    expect(
      screen.getByLabelText('Interval'),
    ).toHaveTextContent('Weekly')

    const vocabularyParams = analyticsMocks.vocabulary.mock.calls.at(-1)?.[0]
    const readingParams = analyticsMocks.reading.mock.calls.at(-1)?.[0]
    const reviewParams = analyticsMocks.reviews.mock.calls.at(-1)?.[0]

    expect(vocabularyParams).toMatchObject({ groupBy: 'WEEK' })
    expect(vocabularyParams).not.toHaveProperty('articleId')
    expect(readingParams).not.toHaveProperty('groupBy')
    expect(readingParams).not.toHaveProperty('articleId')
    expect(reviewParams).toEqual(readingParams)
  })

  it('pauses every analytics request for an invalid date range', () => {
    renderAnalytics('/?from=2026-07-26&to=2026-07-01')

    expect(screen.getByText(/analytics requests are paused/i)).toHaveTextContent(
      /analytics requests are paused/i,
    )
    expect(analyticsMocks.vocabulary.mock.calls.at(-1)?.[1]).toBe(false)
    expect(analyticsMocks.reading.mock.calls.at(-1)?.[1]).toBe(false)
    expect(analyticsMocks.reviews.mock.calls.at(-1)?.[1]).toBe(false)
  })

  it('keeps reading and review analytics visible when vocabulary fails', () => {
    sectionState.vocabularyError = true

    renderAnalytics()

    expect(
      screen.getByText('This analytics section could not be loaded. Try again.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Reading Progress' }))
    expect(screen.getByLabelText('Articles opened: 0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Review Impact' }))
    expect(screen.getByLabelText('Answer accuracy: 66.7%')).toBeInTheDocument()
  })

  it('shows safe zero-denominator reading copy and Daily Review semantics', () => {
    renderAnalytics()

    fireEvent.click(screen.getByRole('tab', { name: 'Reading Progress' }))
    expect(screen.getByLabelText('Completion rate: 0%')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Review Impact' }))
    expect(screen.getByLabelText('Completed sessions: 3')).toBeInTheDocument()
  })

  it('renders accessible pie charts and a subtitle-free vocabulary trend', () => {
    renderAnalytics()

    expect(screen.queryByText(/Status totals: New 2/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Saved vocabulary by level: CEFR A1 1/i)).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Learning status' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'CEFR distribution' })).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: 'Saved vocabulary trend',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('table', { name: 'Saved vocabulary trend' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByLabelText('Saved vocabulary trend legend'),
    ).toHaveTextContent('Vocabulary saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Review Impact' }))
    expect(
      screen.getByRole('table', { name: 'Recall after coaching' }),
    ).toBeInTheDocument()
  })

  it('keeps zero-value vocabulary categories in pie chart legends', () => {
    const ignoredStatus = vocabularyData.byStatus.find(({ status }) => status === 'IGNORED')
    const c2Level = vocabularyData.byCefr.find(({ cefrLevel }) => cefrLevel === 'C2')
    if (!ignoredStatus || !c2Level) throw new Error('Missing analytics test category')

    const ignoredCount = ignoredStatus.count
    const c2Count = c2Level.count
    ignoredStatus.count = 0
    c2Level.count = 0

    try {
      renderAnalytics()

      expect(screen.getByLabelText('Learning status legend')).toHaveTextContent('Ignored0')
      expect(screen.getByLabelText('CEFR distribution legend')).toHaveTextContent('CEFR C20')
    } finally {
      ignoredStatus.count = ignoredCount
      c2Level.count = c2Count
    }
  })

  it('renders reading activity as an accessible line chart', () => {
    readingData.opened = 5
    readingData.completed = 2
    readingData.completionRate = 0.4
    readingData.trend = [
      { bucket: '2026-07-01', opened: 1, completed: 0 },
      { bucket: '2026-07-08', opened: 3, completed: 1 },
      { bucket: '2026-07-15', opened: 1, completed: 1 },
    ]

    renderAnalytics()

    fireEvent.click(screen.getByRole('tab', { name: 'Reading Progress' }))
    expect(
      screen.getByRole('img', {
        name: /Reading activity trend 5 opened and 2 completed articles/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('table', { name: 'Reading activity trend' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByLabelText('Reading activity legend'),
    ).toHaveTextContent('OpenedCompleted')
  })

  it('shows stored skill, retest, duration, and retention evaluation', () => {
    renderAnalytics()
    fireEvent.click(screen.getByRole('tab', { name: 'Review Impact' }))

    expect(screen.getByLabelText('Answer accuracy: 66.7%')).toBeInTheDocument()
    expect(screen.getByText('Performance by skill')).toBeInTheDocument()
    expect(screen.getByLabelText('Recall accuracy: 60%')).toBeInTheDocument()
    expect(screen.getByText('Completion by plan length')).toBeInTheDocument()
    expect(screen.getByText('Coaching retest outcomes')).toBeInTheDocument()
    expect(screen.getByText('3.2 sec')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Recall after coaching' })).toBeInTheDocument()
  })

  it('keeps zero coaching and retention evidence visible without implying zero accuracy', () => {
    const originalDecisionSources = reviewData.byDecisionSource
    const originalRetention = reviewData.retention
    reviewData.byDecisionSource = originalDecisionSources.map((item) => ({
      ...item,
      interventions: 0,
      retestAttempts: 0,
      successfulRetests: 0,
      retestSuccessRate: 0,
    }))
    reviewData.retention = {
      nextDay: { followUps: 0, correct: 0, accuracy: 0 },
      sevenDay: { followUps: 0, correct: 0, accuracy: 0 },
    }

    try {
      renderAnalytics()
      fireEvent.click(screen.getByRole('tab', { name: 'Review Impact' }))

      expect(
        screen.getByText('No coaching interventions were recorded in this period.'),
      ).toBeInTheDocument()
      expect(screen.getByText('Adaptive coaching')).toBeInTheDocument()
      expect(
        screen.getByRole('row', { name: 'Next day 0 0 —' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('row', { name: 'Seven days 0 0 —' }),
      ).toBeInTheDocument()
    } finally {
      reviewData.byDecisionSource = originalDecisionSources
      reviewData.retention = originalRetention
    }
  })
})

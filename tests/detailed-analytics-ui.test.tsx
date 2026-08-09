import '@testing-library/jest-dom/vitest'
import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LearningAnalyticsSections } from '@/components/Dashboard/LearningAnalyticsSections'
import { appTheme } from '@/theme'

const { analyticsMocks, sectionState } = vi.hoisted(() => ({
  analyticsMocks: {
    vocabulary: vi.fn(),
    reading: vi.fn(),
    quizzes: vi.fn(),
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

const quizData = {
  sessions: 2,
  accuracy: 0.75,
  averageScore: 0.625,
  byQuestionType: [
    {
      questionType: 'SELECT_MEANING',
      answers: 4,
      correctAnswers: 3,
      accuracy: 0.75,
    },
    {
      questionType: 'SELECT_WORD',
      answers: 0,
      correctAnswers: 0,
      accuracy: 0,
    },
    {
      questionType: 'SELECT_CORRECT_CONTEXT',
      answers: 0,
      correctAnswers: 0,
      accuracy: 0,
    },
    {
      questionType: 'FILL_BLANK',
      answers: 0,
      correctAnswers: 0,
      accuracy: 0,
    },
  ],
  trend: [
    {
      bucket: '2026-07-01',
      sessions: 2,
      accuracy: 0.75,
      averageScore: 0.625,
    },
  ],
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
    { source: 'RULE', interventions: 0, retestAttempts: 0, successfulRetests: 0, retestSuccessRate: 0 },
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
  useQuizAnalyticsQuery: (params: unknown, enabled: boolean) => {
    analyticsMocks.quizzes(params, enabled)
    return {
      data: quizData,
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
  beforeEach(() => {
    sectionState.vocabularyError = false
    readingData.opened = 0
    readingData.completed = 0
    readingData.completionRate = 0
    readingData.trend = [
      { bucket: '2026-07-01', opened: 0, completed: 0 },
    ]
    analyticsMocks.vocabulary.mockClear()
    analyticsMocks.reading.mockClear()
    analyticsMocks.quizzes.mockClear()
    analyticsMocks.reviews.mockClear()
  })

  it('restores URL filters and scopes optional parameters to their endpoints', () => {
    renderAnalytics(
      '/?from=2026-07-01&to=2026-07-26&groupBy=WEEK&articleId=550e8400-e29b-41d4-a716-446655440000',
    )

    expect(screen.getByLabelText('From')).toHaveValue('2026-07-01')
    expect(screen.getByLabelText('To (exclusive)')).toHaveValue('2026-07-26')
    expect(
      screen.getByLabelText('Interval'),
    ).toHaveTextContent('Weekly')

    const vocabularyParams = analyticsMocks.vocabulary.mock.calls.at(-1)?.[0]
    const readingParams = analyticsMocks.reading.mock.calls.at(-1)?.[0]
    const quizParams = analyticsMocks.quizzes.mock.calls.at(-1)?.[0]
    const reviewParams = analyticsMocks.reviews.mock.calls.at(-1)?.[0]

    expect(vocabularyParams).toMatchObject({ groupBy: 'WEEK' })
    expect(vocabularyParams).not.toHaveProperty('articleId')
    expect(readingParams).not.toHaveProperty('groupBy')
    expect(readingParams).not.toHaveProperty('articleId')
    expect(quizParams).toMatchObject({
      articleId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(quizParams).not.toHaveProperty('groupBy')
    expect(reviewParams).toEqual(readingParams)
  })

  it('pauses every analytics request for an invalid date range', () => {
    renderAnalytics('/?from=2026-07-26&to=2026-07-01')

    expect(screen.getByText(/analytics requests are paused/i)).toHaveTextContent(
      /analytics requests are paused/i,
    )
    expect(analyticsMocks.vocabulary.mock.calls.at(-1)?.[1]).toBe(false)
    expect(analyticsMocks.reading.mock.calls.at(-1)?.[1]).toBe(false)
    expect(analyticsMocks.quizzes.mock.calls.at(-1)?.[1]).toBe(false)
    expect(analyticsMocks.reviews.mock.calls.at(-1)?.[1]).toBe(false)
  })

  it('keeps reading and quiz analytics visible when vocabulary fails', () => {
    sectionState.vocabularyError = true

    renderAnalytics()

    expect(
      screen.getByText('This analytics section could not be loaded. Try again.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Reading Progress' }))
    expect(screen.getByLabelText('Articles opened: 0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Quiz Performance' }))
    expect(screen.getByLabelText('Accuracy: 75%')).toBeInTheDocument()
  })

  it('shows safe zero-denominator reading copy and completed-session semantics', () => {
    renderAnalytics()

    fireEvent.click(screen.getByRole('tab', { name: 'Reading Progress' }))
    expect(screen.getByLabelText('Completion rate: 0%')).toBeInTheDocument()
    expect(screen.getByText('No opened articles')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Quiz Performance' }))
    expect(
      screen.getByText('In-progress and abandoned excluded'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Average score: 62.5%')).toBeInTheDocument()
  })

  it('provides visible textual summaries and an accessible vocabulary chart', () => {
    renderAnalytics()

    expect(screen.getByText(/Status totals: New 2/i)).toBeInTheDocument()
    expect(screen.getByText(/Saved vocabulary by level: CEFR A1 1/i)).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: /Saved vocabulary trend 3 vocabulary saves/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('table', { name: 'Saved vocabulary trend' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByLabelText('Saved vocabulary trend legend'),
    ).toHaveTextContent('Vocabulary saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Quiz Performance' }))
    expect(
      screen.getByText(/Only answers from completed sessions are included/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('table', { name: 'Quiz performance trend' }),
    ).toBeInTheDocument()
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
    expect(screen.getByRole('table', { name: 'Practice signals over time' })).toBeInTheDocument()
    expect(screen.getByText('3.5 sec')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Recall after coaching' })).toBeInTheDocument()
  })
})

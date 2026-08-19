import '@testing-library/jest-dom/vitest'
import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReviewHistory } from '@/types/Review/review'
import i18n from '@/i18n/i18n'
import { appTheme } from '@/theme'

const { historyHook, queryState } = vi.hoisted(() => ({
  historyHook: vi.fn(),
  queryState: {
    data: undefined as ReviewHistory | undefined,
    isPending: false,
    isError: false,
    error: null as unknown,
    isPlaceholderData: false,
    refetch: vi.fn(),
  },
}))

vi.mock('@/hooks/Review/useReviews', () => ({
  useReviewHistoryQuery: (params: unknown) => {
    historyHook(params)
    return queryState
  },
}))

import { ReviewHistoryPage } from '@/pages/Review/ReviewHistoryPage'

const completedHistory: ReviewHistory = {
  items: [
    {
      session: {
        id: 'session-1',
        sessionType: 'DAILY_REVIEW',
        quizId: null,
        articleId: null,
        collectionId: null,
        targetDurationMinutes: 10,
        reviewGoal: 'RECALL',
        plannedItemCount: 8,
        planSummary: 'Recall first, then reinforce in context.',
        status: 'COMPLETED',
        startedAt: '2026-08-09T01:00:00.000Z',
        completedAt: '2026-08-09T01:08:00.000Z',
      },
      quiz: null,
      article: null,
      aggregates: {
        answeredCount: 8,
        correctCount: 6,
        score: 6,
        totalPoints: 8,
        accuracy: 0.75,
      },
    },
  ],
  meta: { page: 2, limit: 10, total: 11, totalPages: 2 },
}

const renderPage = (entry = '/review-history') =>
  render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/review-history" element={<ReviewHistoryPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  )

describe('ReviewHistoryPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    historyHook.mockReset()
    queryState.data = completedHistory
    queryState.isPending = false
    queryState.isError = false
    queryState.error = null
  })

  it('maps URL pagination and status to the owned history query', () => {
    renderPage('/review-history?status=COMPLETED&page=2')

    expect(historyHook).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      status: 'COMPLETED',
    })
    expect(screen.getByRole('heading', { name: 'Daily review' })).toBeInTheDocument()
    expect(screen.getByText('Recall first, then reinforce in context.')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('Recall')).toBeInTheDocument()
    expect(screen.getByText('Mode')).toBeInTheDocument()
    expect(screen.queryByText('Plan')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Summary' })).toHaveAttribute(
      'href',
      '/review/session-1/summary',
    )
  })

  it('offers a review action for an empty journal', () => {
    queryState.data = {
      items: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Your practice journal starts here' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start a Review' })).toHaveAttribute(
      'href',
      '/review?sessionType=DAILY_REVIEW',
    )
  })

  it('shows the legacy daily-review mode as Balanced', () => {
    queryState.data = {
      ...completedHistory,
      items: [
        {
          ...completedHistory.items[0],
          session: {
            ...completedHistory.items[0].session,
            reviewGoal: null,
          },
        },
      ],
    }

    renderPage()

    expect(screen.getByText('Balanced')).toBeInTheDocument()
  })
})

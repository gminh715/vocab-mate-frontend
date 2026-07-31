import '@testing-library/jest-dom/vitest'
import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/contexts/AuthContext'
import { HomePage } from '@/pages/Home/HomePage'
import { appTheme } from '@/theme'
import type { AnalyticsOverview } from '@/types/Analytics/analytics'
import type { ReadingHistoryData } from '@/types/Reading/reading'

interface DashboardQueryState {
  overview: {
    data: AnalyticsOverview | undefined
    isPending: boolean
    isError: boolean
    error: unknown
    refetch: ReturnType<typeof vi.fn>
  }
  reading: {
    data: ReadingHistoryData | undefined
    isPending: boolean
    isError: boolean
    error: unknown
    refetch: ReturnType<typeof vi.fn>
  }
}

const { queryState } = vi.hoisted<{ queryState: DashboardQueryState }>(() => ({
  queryState: {
    overview: {
      data: {
        savedVocabulary: 12,
        dueToday: 3,
        mastered: 4,
        articlesCompleted: 2,
        quizAccuracy: 0.75,
        sessions: 5,
      },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    },
    reading: {
      data: {
        items: [],
        meta: {
          page: 1,
          limit: 3,
          total: 0,
          totalPages: 0,
        },
      },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    },
  },
}))

vi.mock('@/hooks/Analytics/useAnalytics', () => ({
  useAnalyticsOverviewQuery: () => queryState.overview,
  useVocabularyAnalyticsQuery: () => ({
    data: undefined,
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useReadingAnalyticsQuery: () => ({
    data: undefined,
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
  useQuizAnalyticsQuery: () => ({
    data: undefined,
    isPending: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/Reading/useReading', () => ({
  useReadingHistoryQuery: () => queryState.reading,
}))

const currentUser = {
  id: 'user-id',
  email: 'learner@example.com',
  role: 'USER',
  status: 'ACTIVE',
  profile: {
    displayName: 'Mai',
    avatarUrl: null,
    currentCefrLevel: 'B1',
    learningGoal: null,
    preferredLanguage: 'vi',
  },
} as const

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Current path">{location.pathname}{location.search}</output>
}

const renderDashboard = () =>
  render(
    <ThemeProvider theme={appTheme}>
      <AuthContext.Provider
        value={{
          currentUser,
          error: null,
          isAuthenticated: true,
          isInitializing: false,
        }}
      >
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <HomePage />
                  <LocationProbe />
                </>
              }
            />
            <Route path="*" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>,
  )

describe('HomePage', () => {
  beforeEach(() => {
    queryState.overview.data = {
      savedVocabulary: 12,
      dueToday: 3,
      mastered: 4,
      articlesCompleted: 2,
      quizAccuracy: 0.75,
      sessions: 5,
    }
    queryState.overview.isPending = false
    queryState.overview.isError = false
    queryState.overview.error = null
    queryState.reading.data = {
      items: [],
      meta: {
        page: 1,
        limit: 3,
        total: 0,
        totalPages: 0,
      },
    }
    queryState.reading.isPending = false
    queryState.reading.isError = false
    queryState.reading.error = null
  })

  it('formats the confirmed 0..1 accuracy ratio as a percentage', () => {
    renderDashboard()

    expect(screen.getByLabelText('Quiz accuracy: 75%')).toBeInTheDocument()
  })

  it('shows guided onboarding without inventing metrics when all values are zero', () => {
    queryState.overview.data = {
      savedVocabulary: 0,
      dueToday: 0,
      mastered: 0,
      articlesCompleted: 0,
      quizAccuracy: 0,
      sessions: 0,
    }

    renderDashboard()

    expect(
      screen.getByRole('heading', { name: 'Start your learning trail' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Read your first article')).toBeInTheDocument()
    expect(screen.getByText('Save useful vocabulary')).toBeInTheDocument()
    expect(screen.getByText('Complete your first quiz')).toBeInTheDocument()
    expect(screen.queryByText('NaN')).not.toBeInTheDocument()
  })

  it('keeps the overview visible when continue reading fails', () => {
    queryState.reading.isError = true
    queryState.reading.error = new Error('offline')

    renderDashboard()

    expect(screen.getByLabelText('Saved vocabulary: 12')).toBeInTheDocument()
    expect(
      screen.getByText(/overview is still available/i),
    ).toBeInTheDocument()
  })

  it('navigates from a quick action to due vocabulary', () => {
    renderDashboard()

    fireEvent.click(
      screen.getByRole('link', { name: /review due vocabulary/i }),
    )

    expect(screen.getByLabelText('Current path')).toHaveTextContent(
      '/vocabularies?dueOnly=true',
    )
  })

  it('navigates to the backend-provided article slug', () => {
    queryState.reading.data = {
      items: [
        {
          articleId: 'article-id',
          status: 'READING',
          progressPercent: 42,
          lastBlockKey: 'paragraph-2',
          completedAt: null,
          firstOpenedAt: '2026-07-20T01:00:00.000Z',
          lastReadAt: '2026-07-25T01:00:00.000Z',
          article: {
            id: 'article-id',
            title: 'City trees and cooler streets',
            slug: 'city-trees-cooler-streets',
            summary: 'A story about urban trees.',
            thumbnailUrl: null,
            cefrLevel: 'B1',
            status: 'PUBLISHED',
            publishedAt: '2026-07-19T01:00:00.000Z',
            category: {
              id: 'category-id',
              name: 'Environment',
              slug: 'environment',
            },
          },
        },
      ],
      meta: {
        page: 1,
        limit: 3,
        total: 1,
        totalPages: 1,
      },
    }

    renderDashboard()
    const continueLinks = screen.getAllByRole('link', {
        name: 'Continue reading City trees and cooler streets',
      })
    fireEvent.click(continueLinks[continueLinks.length - 1]!)

    expect(screen.getByLabelText('Current path')).toHaveTextContent(
      '/read/city-trees-cooler-streets',
    )
  })

  it('represents archived reading history without linking to an unavailable reader', () => {
    queryState.reading.data = {
      items: [
        {
          articleId: 'archived-article-id',
          status: 'READING',
          progressPercent: 42,
          lastBlockKey: 'paragraph-2',
          completedAt: null,
          firstOpenedAt: '2026-07-20T01:00:00.000Z',
          lastReadAt: '2026-07-25T01:00:00.000Z',
          article: {
            id: 'archived-article-id',
            title: 'An archived learning story',
            slug: 'archived-learning-story',
            summary: 'Historical reading activity.',
            thumbnailUrl: null,
            cefrLevel: 'B1',
            status: 'ARCHIVED',
            publishedAt: '2026-07-19T01:00:00.000Z',
            category: {
              id: 'category-id',
              name: 'History',
              slug: 'history',
            },
          },
        },
      ],
      meta: {
        page: 1,
        limit: 3,
        total: 1,
        totalPages: 1,
      },
    }

    renderDashboard()

    expect(screen.getByText('An archived learning story')).toBeInTheDocument()
    expect(screen.getByText(/Archived · Last read/)).toBeInTheDocument()
    expect(
      screen.queryByRole('link', {
        name: 'Continue reading An archived learning story',
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /^Reading history/ }),
    ).toHaveAttribute('href', '/reading-history')
  })
})

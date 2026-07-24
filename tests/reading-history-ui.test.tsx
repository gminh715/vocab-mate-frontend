import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readingApi } from '../src/api'
import { ReadingHistoryPage } from '../src/pages/ReadingHistoryPage'
import { appTheme } from '../src/theme'
import type { ReadingHistoryData } from '../src/types/reading'

const articleId = '660e8400-e29b-41d4-a716-446655440000'
const historyData: ReadingHistoryData = {
  items: [
    {
      articleId,
      status: 'READING',
      progressPercent: 42.5,
      lastBlockKey: null,
      completedAt: null,
      firstOpenedAt: '2026-07-22T10:00:00.000Z',
      lastReadAt: '2026-07-24T10:00:00.000Z',
      article: {
        id: articleId,
        title: 'How technology changes learning',
        slug: 'technology/news',
        summary: 'A concise introduction to technology in learning.',
        thumbnailUrl: null,
        cefrLevel: 'B1',
        status: 'PUBLISHED',
        publishedAt: '2026-07-22T10:00:00.000Z',
        category: {
          id: 'category-1',
          name: 'Technology',
          slug: 'technology',
        },
      },
    },
  ],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderHistory = (initialEntry = '/reading-history') =>
  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route
              path="/reading-history"
              element={<ReadingHistoryPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )

describe('reading history page', () => {
  beforeEach(() => {
    vi.spyOn(readingApi, 'history').mockResolvedValue(historyData)
    vi.spyOn(readingApi, 'reset').mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders server history, progress, and the slug-based continue link', async () => {
    renderHistory(
      '/reading-history?status=READING&sort=oldest',
    )

    expect(
      await screen.findByRole('heading', {
        name: 'How technology changes learning',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('42.5%')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Continue reading' }),
    ).toHaveAttribute('href', '/read/technology%2Fnews')
    expect(readingApi.history).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: 'READING',
      sort: 'oldest',
    })
  })

  it('confirms reset and preserves vocabulary and quiz history', async () => {
    const user = userEvent.setup()
    renderHistory()

    await screen.findByRole('heading', {
      name: 'How technology changes learning',
    })
    await user.click(
      screen.getByRole('button', { name: 'Reset progress' }),
    )

    const dialog = screen.getByRole('dialog', {
      name: 'Reset Reading Progress?',
    })
    expect(dialog).toHaveTextContent(
      'Saved vocabulary and quiz history will not be deleted.',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Reset Progress' }),
    )

    expect(readingApi.reset).toHaveBeenCalledWith(articleId)
  })

  it('distinguishes an empty history from filtered no results', async () => {
    vi.mocked(readingApi.history).mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    })

    const { unmount } = renderHistory()
    expect(
      await screen.findByRole('heading', {
        name: 'Your reading history is empty',
      }),
    ).toBeInTheDocument()

    unmount()
    renderHistory('/reading-history?status=COMPLETED')
    expect(
      await screen.findByRole('heading', {
        name: 'No reading matches this filter',
      }),
    ).toBeInTheDocument()
  })
})

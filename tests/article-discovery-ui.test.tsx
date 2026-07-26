import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { articlesApi, categoriesApi } from '@/api'
import { ApiError } from '@/config/apiClient'
import { ArticlesPage } from '@/pages/Article/ArticlesPage'
import { appTheme } from '@/theme'
import type { ArticleListData } from '@/types/Article/articles'

const article = {
  id: '660e8400-e29b-41d4-a716-446655440000',
  title: 'How technology changes learning',
  slug: 'how-technology-changes-learning',
  summary: 'A concise introduction to technology in the classroom.',
  thumbnailUrl: null,
  cefrLevel: 'B1' as const,
  publishedAt: '2026-07-22T10:00:00.000Z',
  category: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Technology',
    slug: 'technology',
  },
}

const articleList: ArticleListData = {
  items: [article],
  meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
}

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Current location">{location.search}</output>
}

const renderPage = (initialEntry = '/articles') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <LocationProbe />
          <Routes>
            <Route path="/articles" element={<ArticlesPage />} />
            <Route
              path="/articles/:slug"
              element={<h1>Article detail destination</h1>}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

describe('Article Discovery interactions', () => {
  beforeEach(() => {
    vi.spyOn(articlesApi, 'list').mockResolvedValue(articleList)
    vi.spyOn(categoriesApi, 'list').mockResolvedValue({
      items: [article.category],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resets the page when a select filter changes', async () => {
    const user = userEvent.setup()
    vi.mocked(articlesApi.list).mockImplementation(async (params) => ({
      ...articleList,
      meta: { ...articleList.meta, page: params.page },
    }))
    renderPage('/articles?page=3')

    await screen.findByText(article.title)
    await user.click(screen.getByRole('combobox', { name: 'CEFR level' }))
    await user.click(screen.getByRole('option', { name: 'B1' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Current location')).toHaveTextContent(
        '?cefr=B1',
      )
    })
    expect(screen.getByLabelText('Current location')).not.toHaveTextContent(
      'page=',
    )
  })

  it('debounces search while keeping the input responsive', async () => {
    renderPage()
    await screen.findByText(article.title)

    const search = screen.getByRole('textbox', {
      name: 'Search articles',
    })
    fireEvent.change(search, { target: { value: 'climate' } })

    expect(search).toHaveValue('climate')
    expect(articlesApi.list).toHaveBeenCalledTimes(1)

    await waitFor(
      () => {
        expect(articlesApi.list).toHaveBeenLastCalledWith(
          expect.objectContaining({ q: 'climate', page: 1 }),
        )
      },
      { timeout: 1_200 },
    )
  })

  it('distinguishes the initial empty state from no search results', async () => {
    vi.mocked(articlesApi.list).mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
    })

    const initial = renderPage()
    expect(
      await screen.findByRole('heading', {
        name: 'No published articles yet',
      }),
    ).toBeInTheDocument()
    initial.unmount()

    renderPage('/articles?q=astronomy')
    expect(
      await screen.findByRole('heading', {
        name: 'No articles match these filters',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Clear filters' }),
    ).toBeInTheDocument()
  })

  it('navigates to article detail by the backend slug', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(
      await screen.findByRole('link', {
        name: `Read ${article.title}`,
      }),
    )

    expect(
      screen.getByRole('heading', {
        name: 'Article detail destination',
      }),
    ).toBeInTheDocument()
  })

  it('does not expose backend article-list error details', async () => {
    vi.mocked(articlesApi.list).mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'UNPROCESSABLE_ENTITY',
        message: 'Internal repository detail',
        details: ['private database detail'],
      }),
    )
    renderPage()

    expect(
      await screen.findByText('Articles could not be loaded. Try again.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('private database detail'),
    ).not.toBeInTheDocument()
  })
})

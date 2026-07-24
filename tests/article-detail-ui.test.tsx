import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
  createMemoryRouter,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../src/App'
import { articlesApi, authApi } from '../src/api'
import { AuthProvider } from '../src/components/AuthProvider'
import { ApiError } from '../src/config/apiClient'
import {
  AuthContext,
  type AuthContextValue,
} from '../src/contexts/AuthContext'
import { ArticleDetailPage } from '../src/pages/ArticleDetailPage'
import { appTheme } from '../src/theme'
import type { ArticleDetailData } from '../src/types/articles'
import type { CurrentUser } from '../src/types/auth'

const slug = 'how-technology-changes-learning'

const detail: ArticleDetailData = {
  article: {
    id: '660e8400-e29b-41d4-a716-446655440000',
    title: 'How technology changes learning',
    slug,
    summary: 'A concise introduction to technology in the classroom.',
    sourceName: 'Vocab Mate News',
    sourceUrl: 'https://example.com/original',
    authorName: 'Jane Doe',
    thumbnailUrl: 'https://example.com/technology.jpg',
    cefrLevel: 'B1',
    status: 'PUBLISHED',
    publishedAt: '2026-07-22T10:00:00.000Z',
  },
  category: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Technology',
    slug: 'technology',
  },
  quizCount: 2,
}

const userAccount: CurrentUser = {
  id: 'user-1',
  email: 'learner@example.com',
  role: 'USER',
  status: 'ACTIVE',
  profile: {
    displayName: 'Learner',
    avatarUrl: null,
    currentCefrLevel: 'B1',
    learningGoal: null,
    preferredLanguage: 'vi',
  },
}

const authenticatedContext: AuthContextValue = {
  currentUser: userAccount,
  error: null,
  isAuthenticated: true,
  isInitializing: false,
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderDetail = (
  authValue: AuthContextValue = authenticatedContext,
) =>
  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={createQueryClient()}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={[`/articles/${slug}`]}>
            <Routes>
              <Route
                path="/articles/:slug"
                element={<ArticleDetailPage />}
              />
              <Route
                path="/read/:slug"
                element={<h1>Reader destination</h1>}
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>,
  )

describe('Article Detail and reader entry', () => {
  beforeEach(() => {
    vi.spyOn(articlesApi, 'detail').mockResolvedValue(detail)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders only the published metadata returned by the detail endpoint', async () => {
    renderDetail()

    expect(
      await screen.findByRole('heading', { name: detail.article.title }),
    ).toBeInTheDocument()
    expect(screen.getByText(detail.article.summary)).toBeInTheDocument()
    expect(screen.getByText('CEFR B1')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('2 quizzes')).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: 'Visit source: Vocab Mate News',
      }),
    ).toHaveAttribute('href', detail.article.sourceUrl)
    expect(document.body.innerHTML).not.toContain('contentHtml')
  })

  it('shows a dedicated not-found state for missing or unpublished articles', async () => {
    vi.mocked(articlesApi.detail).mockRejectedValue(
      new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Article not found',
      }),
    )

    renderDetail()

    expect(
      await screen.findByRole('heading', { name: 'Article not found' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to articles' }),
    ).toHaveAttribute('href', '/articles')
  })

  it('navigates an authenticated learner directly to the slug reader route', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(
      await screen.findByRole('link', { name: 'Start reading' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Reader destination' }),
    ).toBeInTheDocument()
  })

  it('sends a guest through login and returns to the safe reader destination', async () => {
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue(null)
    vi.spyOn(authApi, 'login').mockResolvedValue(userAccount)
    const router = createMemoryRouter(
      [{ path: '*', element: <AppRoutes /> }],
      { initialEntries: [`/articles/${slug}`] },
    )

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={createQueryClient()}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>,
    )

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('link', { name: 'Start reading' }),
    )

    await screen.findByRole('heading', { name: 'Welcome Back' })
    expect(router.state.location).toMatchObject({
      pathname: '/login',
      state: { from: `/read/${slug}` },
    })

    await user.type(screen.getByLabelText('Email'), 'learner@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPass@123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/read/${slug}`)
    })
  })
})

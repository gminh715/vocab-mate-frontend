import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryRouter,
  type InitialEntry,
} from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/config/apiClient'
import { AppRoutes } from '@/routes/AppRoutes'
import { appTheme } from '@/theme'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import {
  adminCategoriesApi,
  adminUsersApi,
  authApi,
} from '@/api'
import type { AdminCategoryListData } from '@/types/Admin/adminCategories'
import type {
  AdminUserDetail,
  AdminUserListData,
} from '@/types/Admin/adminUsers'
import type { CurrentUser } from '@/types/Auth/auth'
import i18n from '@/i18n/i18n'

const userAccount: CurrentUser = {
  id: 'user-1',
  email: 'learner@example.com',
  role: 'USER',
  status: 'ACTIVE',
  displayName: 'Learner',
  avatarUrl: null,
  currentCefrLevel: 'B1',
  learningGoal: 'Read English news confidently',
  preferredLanguage: 'en',
}

const adminAccount: CurrentUser = {
  ...userAccount,
  id: 'admin-1',
  email: 'admin@example.com',
  role: 'ADMIN',
  displayName: 'Admin',
}

const adminUserList: AdminUserListData = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
}

const adminCategoryList: AdminCategoryListData = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
}

const adminUserDetail: AdminUserDetail = {
  user: {
    ...userAccount,
    lastLoginAt: null,
    createdAt: '2026-07-20T10:00:00.000Z',
  },
  learningSummary: {
    savedVocabularyCount: 0,
    completedArticleCount: 0,
  },
}

const renderRoute = (initialEntries: InitialEntry[]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const router = createMemoryRouter(
    [{ path: '*', element: <AppRoutes /> }],
    { initialEntries },
  )

  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )

  return { queryClient, router }
}

const completeLogin = async (
  email = 'learner@example.com',
  password = 'StrongPass@123',
) => {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign In' }))
}

describe('Auth routing and forms', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue(null)
    vi.spyOn(adminUsersApi, 'list').mockResolvedValue(adminUserList)
    vi.spyOn(adminUsersApi, 'detail').mockResolvedValue(adminUserDetail)
    vi.spyOn(adminCategoriesApi, 'list').mockResolvedValue(
      adminCategoryList,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logs in and returns to the originally requested protected URL', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(null)
    vi.spyOn(authApi, 'login').mockResolvedValue(adminAccount)
    const { router } = renderRoute(['/admin/users?status=active#results'])

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
    await completeLogin('admin@example.com')

    await screen.findByRole('heading', { name: 'Users' })
    expect(router.state.location).toMatchObject({
      pathname: '/admin/users',
      search: '?status=active',
      hash: '#results',
    })
  })

  it('shows the generic backend-approved invalid-login message', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(
      new ApiError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      }),
    )
    renderRoute(['/login'])

    await completeLogin()

    expect(
      await screen.findByText(
        'Email or password is incorrect. Check your details and try again.',
      ),
    ).toBeInTheDocument()
  })

  it('registers without learning-profile fields and asks the user to sign in', async () => {
    const registerSpy = vi
      .spyOn(authApi, 'register')
      .mockResolvedValue({
        id: userAccount.id,
        email: userAccount.email,
        role: userAccount.role,
        status: userAccount.status,
      })
    const { router } = renderRoute(['/register'])
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Display Name'), 'Learner')
    await user.type(screen.getByLabelText('Email'), 'learner@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPass@123')
    await user.type(
      screen.getByLabelText('Confirm Password'),
      'StrongPass@123',
    )
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    await screen.findByRole('heading', { name: 'Welcome Back' })
    expect(screen.getByText('Account created. Sign in to set up your learning plan.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(registerSpy.mock.calls[0]?.[0]).not.toHaveProperty(
      'confirmPassword',
    )
    expect(registerSpy.mock.calls[0]?.[0]).not.toHaveProperty('currentCefrLevel')
    expect(registerSpy.mock.calls[0]?.[0]).not.toHaveProperty('learningGoal')
  })

  it('places a duplicate-email error beside the email field', async () => {
    vi.spyOn(authApi, 'register').mockRejectedValue(
      new ApiError({
        status: 409,
        code: 'CONFLICT',
        message: 'Email is already registered',
      }),
    )
    renderRoute(['/register'])
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Display Name'), 'Learner')
    await user.type(screen.getByLabelText('Email'), 'learner@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPass@123')
    await user.type(
      screen.getByLabelText('Confirm Password'),
      'StrongPass@123',
    )
    await user.click(screen.getByRole('button', { name: 'Create Account' }))

    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('redirects an authenticated user away from the login page', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(userAccount)
    const { router } = renderRoute(['/login'])

    await screen.findByRole('heading', { name: 'Welcome back, Learner.' })
    expect(router.state.location.pathname).toBe('/')
  })

  it('restores an authenticated session during a page reload', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(userAccount)
    renderRoute(['/'])

    expect(
      screen.getByText('Restoring your session…'),
    ).toBeInTheDocument()
    await screen.findByRole('heading', { name: 'Welcome back, Learner.' })
  })

  it('redirects a guest opening a protected route and preserves the URL', async () => {
    const { router } = renderRoute(['/admin/users?status=active'])

    await screen.findByRole('heading', { name: 'Welcome Back' })
    expect(router.state.location).toMatchObject({
      pathname: '/login',
      state: { from: '/admin/users?status=active' },
    })
  })

  it('shows forbidden UI when a USER opens an admin route', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(userAccount)
    const { router } = renderRoute(['/admin'])

    await screen.findByRole('heading', { name: 'Access Restricted' })
    expect(router.state.location.pathname).toBe('/forbidden')
    expect(
      screen.queryByRole('link', { name: 'Admin' }),
    ).not.toBeInTheDocument()
  })

  it('allows an ADMIN to open admin routes and shows admin navigation', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(adminAccount)
    renderRoute(['/admin'])

    await screen.findByRole('heading', { name: 'Admin Area' })
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument()
  })

  it.each([
    ['/admin/users/user-1', 'Learner'],
    ['/admin/categories', 'Categories'],
    ['/admin/articles', 'Articles'],
    ['/admin/articles/new', 'New article'],
    ['/admin/articles/article-1/edit', 'Edit article'],
    ['/admin/articles/article-1/content', 'Article content'],
    ['/admin/articles/article-1/preview', 'Article preview'],
    ['/admin/analytics', 'Analytics'],
  ])('maps the admin route %s to %s', async (path, heading) => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(adminAccount)
    renderRoute([path])

    await screen.findByRole('heading', { name: heading })
  })

  it('marks the owning admin section active for a nested route', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(adminAccount)
    renderRoute(['/admin/articles/article-1/edit'])
    const user = userEvent.setup()

    await screen.findByRole('heading', { name: 'Edit article' })
    await user.click(
      screen.getByRole('button', { name: 'Open admin navigation' }),
    )

    expect(
      await screen.findByRole('link', { name: 'Articles' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('closes mobile admin navigation after choosing a destination', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(adminAccount)
    const { router } = renderRoute(['/admin'])
    const user = userEvent.setup()

    await screen.findByRole('heading', { name: 'Admin Area' })
    await user.click(
      screen.getByRole('button', { name: 'Open admin navigation' }),
    )
    await user.click(await screen.findByRole('link', { name: 'Analytics' }))

    await screen.findByRole('heading', { name: 'Analytics' })
    expect(router.state.location.pathname).toBe('/admin/analytics')
    expect(
      screen.queryByRole('navigation', { name: 'Admin navigation' }),
    ).not.toBeInTheDocument()
  })

  it('shows an admin-scoped not-found page for an unknown admin route', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(adminAccount)
    const { router } = renderRoute(['/admin/not-a-route'])

    await screen.findByRole('heading', {
      name: 'Admin page not found',
    })
    expect(router.state.location.pathname).toBe('/admin/not-a-route')
  })

  it('logs out, replaces the current entry, and keeps protected history gated', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(adminAccount)
    vi.spyOn(authApi, 'logout').mockResolvedValue(undefined)
    const { queryClient, router } = renderRoute(['/admin', '/'])
    const user = userEvent.setup()

    await screen.findByRole('heading', { name: 'Welcome back, Admin.' })
    queryClient.setQueryData(['vocabularies', 'private'], {
      term: 'sensitive-user-data',
    })
    await user.click(
      screen.getByRole('button', {
        name: 'Open account menu for Admin',
      }),
    )
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }))

    await screen.findByRole('heading', { name: 'Welcome Back' })
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })

    await router.navigate(-1)

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
    expect(
      queryClient.getQueryData(['vocabularies', 'private']),
    ).toBeUndefined()
    await waitFor(() => {
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
    })
  })

  it('clears the local session when the backend cannot confirm logout', async () => {
    vi.mocked(authApi.restoreSession).mockResolvedValue(userAccount)
    vi.spyOn(authApi, 'logout').mockRejectedValue(
      new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the server.',
      }),
    )
    const { router } = renderRoute(['/'])
    const user = userEvent.setup()

    await screen.findByRole('heading', { name: 'Welcome back, Learner.' })
    await user.click(
      screen.getByRole('button', {
        name: 'Open account menu for Learner',
      }),
    )
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }))

    await screen.findByRole('heading', { name: 'Welcome Back' })
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
  })

  it('keeps protected content hidden while session restoration is pending', () => {
    vi.mocked(authApi.restoreSession).mockReturnValue(
      new Promise<CurrentUser | null>(() => undefined),
    )
    renderRoute(['/'])

    expect(screen.getByRole('status')).toHaveTextContent(
      'Restoring your session…',
    )
    expect(
      screen.queryByRole('heading', { name: /Welcome back/ }),
    ).not.toBeInTheDocument()
  })
})

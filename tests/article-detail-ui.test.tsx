import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryRouter,
} from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '@/routes/AppRoutes'
import { authApi } from '@/api'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { appTheme } from '@/theme'
import type { CurrentUser } from '@/types/Auth/auth'

const slug = 'how-technology-changes-learning'

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
    preferredLanguage: 'en',
  },
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

describe('Article Detail route redirect', () => {
  it('redirects legacy article detail paths directly to the reader route for authenticated users', async () => {
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue(userAccount)
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

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/read/${slug}`)
    })
  })

  it('sends an unauthenticated user attempting to access article detail through login to the reader route', async () => {
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

    await screen.findByRole('heading', { name: 'Welcome Back' })
    expect(router.state.location).toMatchObject({
      pathname: '/login',
      state: { from: `/read/${slug}` },
    })

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Email'), 'learner@example.com')
    await user.type(screen.getByLabelText('Password'), 'StrongPass@123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/read/${slug}`)
    })
  })
})

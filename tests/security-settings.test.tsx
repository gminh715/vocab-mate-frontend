import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  RouterProvider,
  createMemoryRouter,
} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '@/api/Auth/AuthApi'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { ApiError } from '@/config/apiClient'
import { authQueryKeys } from '@/hooks/Auth/useAuth'
import { AppRoutes } from '@/routes/AppRoutes'
import {
  changePasswordFormSchema,
  toChangePasswordRequest,
} from '@/schemas/Auth/changePassword'
import { appTheme } from '@/theme'
import type { CurrentUser } from '@/types/Auth/auth'

const currentUser: CurrentUser = {
  id: 'user-1',
  email: 'learner@example.com',
  role: 'USER',
  status: 'ACTIVE',
  displayName: 'Mai',
  avatarUrl: null,
  currentCefrLevel: 'B1',
  learningGoal: 'C1',
  preferredLanguage: 'en',
}

const renderSecurity = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(authQueryKeys.currentUser(), currentUser)
  const router = createMemoryRouter(
    [{ path: '*', element: <AppRoutes /> }],
    { initialEntries: ['/settings/security'] },
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

const fillValidPasswords = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.type(
    await screen.findByLabelText('Current password'),
    'OldPass@123',
  )
  await user.type(screen.getByLabelText('New password'), 'NewPass@456')
  await user.type(
    screen.getByLabelText('Confirm new password'),
    'NewPass@456',
  )
}

describe('change-password schema and DTO', () => {
  it('rejects confirmation mismatch', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'OldPass@123',
      newPassword: 'NewPass@456',
      confirmNewPassword: 'DifferentPass@789',
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(
      result.error.flatten().fieldErrors.confirmNewPassword,
    ).toEqual(['New passwords do not match.'])
  })

  it('omits UI-only confirmation from the request', () => {
    expect(
      toChangePasswordRequest({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
        confirmNewPassword: 'NewPass@456',
      }),
    ).toEqual({
      currentPassword: 'OldPass@123',
      newPassword: 'NewPass@456',
    })
  })
})

import i18n from '@/i18n/i18n'

describe('Security settings UI', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await i18n.changeLanguage('en')
    vi.spyOn(authApi, 'restoreSession').mockResolvedValue(currentUser)
  })

  it('keeps mismatched confirmation client-side and exposes accessible visibility controls', async () => {
    const changePassword = vi.spyOn(authApi, 'changePassword')
    renderSecurity()
    const user = userEvent.setup()

    await user.type(
      await screen.findByLabelText('Current password'),
      'OldPass@123',
    )
    await user.type(
      screen.getByLabelText('New password'),
      'NewPass@456',
    )
    await user.type(
      screen.getByLabelText('Confirm new password'),
      'DifferentPass@789',
    )
    expect(
      screen.getByRole('button', { name: 'Show current password' }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Change password' }),
    )

    expect(
      await screen.findByText('New passwords do not match.'),
    ).toBeInTheDocument()
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('places incorrect-current-password feedback beside that field', async () => {
    vi.spyOn(authApi, 'changePassword').mockRejectedValue(
      new ApiError({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Current password is incorrect',
      }),
    )
    renderSecurity()
    const user = userEvent.setup()
    await fillValidPasswords(user)

    await user.click(
      screen.getByRole('button', { name: 'Change password' }),
    )

    expect(
      await screen.findByText(
        'Current password is incorrect. Check it and try again.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Current password')).toHaveValue(
      'OldPass@123',
    )
  })

  it('shows backend weak-password feedback beside the new password', async () => {
    vi.spyOn(authApi, 'changePassword').mockRejectedValue(
      new ApiError({
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: [
          'newPassword must contain uppercase, lowercase, number, and special character',
        ],
      }),
    )
    renderSecurity()
    const user = userEvent.setup()
    await fillValidPasswords(user)

    await user.click(
      screen.getByRole('button', { name: 'Change password' }),
    )

    expect(
      await screen.findByText(
        'newPassword must contain uppercase, lowercase, number, and special character',
      ),
    ).toBeInTheDocument()
  })

  it('shows a normalized network error and preserves password input', async () => {
    vi.spyOn(authApi, 'changePassword').mockRejectedValue(
      new ApiError({
        status: 0,
        code: 'NETWORK_ERROR',
        message:
          'Unable to reach the server. Check your connection and try again.',
      }),
    )
    renderSecurity()
    const user = userEvent.setup()
    await fillValidPasswords(user)

    await user.click(
      screen.getByRole('button', { name: 'Change password' }),
    )

    expect(
      await screen.findByText(
        'Unable to reach the server. Check your connection and try again.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('New password')).toHaveValue(
      'NewPass@456',
    )
  })

  it('clears the authenticated session and private caches, preserves public caches, and redirects with success feedback', async () => {
    const changePassword = vi
      .spyOn(authApi, 'changePassword')
      .mockResolvedValue({ message: 'Done' })
    const logout = vi.spyOn(authApi, 'logout')
    const { queryClient, router } = renderSecurity()
    const user = userEvent.setup()

    await screen.findByRole('heading', { name: 'Account security' })
    expect(
      screen.queryByRole('heading', {
        name: 'A clean session handoff',
      }),
    ).not.toBeInTheDocument()
    queryClient.setQueryData(['analytics', 'me'], { private: true })
    queryClient.setQueryData(['reading', 'history'], { private: true })
    queryClient.setQueryData(['vocabularies', 'list'], { private: true })
    queryClient.setQueryData(['collections', 'list'], { private: true })
    queryClient.setQueryData(['articles', 'list'], { public: true })
    queryClient.setQueryData(['categories', 'list'], { public: true })
    await fillValidPasswords(user)

    await user.click(
      screen.getByRole('button', { name: 'Change password' }),
    )

    expect(
      await screen.findByText(
        'Password changed successfully. Please sign in again with the new password.',
      ),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(changePassword.mock.calls[0]?.[0]).toEqual({
      currentPassword: 'OldPass@123',
      newPassword: 'NewPass@456',
    })
    expect(changePassword.mock.calls[0]?.[0]).not.toHaveProperty(
      'confirmNewPassword',
    )
    expect(logout).not.toHaveBeenCalled()
    expect(
      queryClient.getQueryData(authQueryKeys.currentUser()),
    ).toBeNull()
    expect(queryClient.getQueryData(['analytics', 'me'])).toBeUndefined()
    expect(queryClient.getQueryData(['reading', 'history'])).toBeUndefined()
    expect(
      queryClient.getQueryData(['vocabularies', 'list']),
    ).toBeUndefined()
    expect(
      queryClient.getQueryData(['collections', 'list']),
    ).toBeUndefined()
    expect(queryClient.getQueryData(['articles', 'list'])).toEqual({
      public: true,
    })
    expect(queryClient.getQueryData(['categories', 'list'])).toEqual({
      public: true,
    })
    await waitFor(() => {
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
    })
  }, 10_000)
})

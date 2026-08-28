import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminUsersApi } from '@/api'
import { ApiError } from '@/config/apiClient'
import { AdminUserDetailPage } from '@/pages/Admin/AdminUserDetailPage'
import { AdminUsersPage } from '@/pages/Admin/AdminUsersPage'
import { appTheme } from '@/theme'
import type { AdminUserDetail } from '@/types/Admin/adminUsers'

const detail: AdminUserDetail = {
  user: {
    id: 'user-1',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    lastLoginAt: '2026-07-23T10:00:00.000Z',
    createdAt: '2026-07-20T10:00:00.000Z',
    displayName: 'Admin User',
    avatarUrl: null,
    currentCefrLevel: 'B2',
    learningGoal: 'Read one article each day',
    preferredLanguage: 'en',
  },
  learningSummary: {
    savedVocabularyCount: 12,
    completedArticleCount: 3,
  },
}

const renderDetail = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/users/user-1']}>
          <Routes>
            <Route
              path="/admin/users/:userId"
              element={<AdminUserDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

const renderList = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/users?page=3']}>
          <Routes>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

describe('Admin user change confirmation', () => {
  beforeEach(() => {
    vi.spyOn(adminUsersApi, 'detail').mockResolvedValue(detail)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('waits for confirmation before changing account status', async () => {
    const updateStatus = vi
      .spyOn(adminUsersApi, 'updateStatus')
      .mockResolvedValue({
        id: 'user-1',
        status: 'DISABLED',
        updatedAt: '2026-07-24T10:00:00.000Z',
      })
    const user = userEvent.setup()
    renderDetail()

    await screen.findByRole('heading', { name: 'Admin User' })
    await user.click(screen.getByLabelText('Status'))
    await user.click(screen.getByRole('option', { name: 'Disabled' }))
    await user.click(
      screen.getByRole('button', { name: 'Change status' }),
    )

    expect(updateStatus).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog', {
      name: 'Confirm status change',
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Change status' }),
    )

    await waitFor(() => {
      expect(updateStatus).toHaveBeenCalledWith('user-1', 'DISABLED')
    })
    expect(
      await screen.findByText('Status changed to Disabled.'),
    ).toBeInTheDocument()
  })

  it('shows the backend conflict message when a role change is rejected', async () => {
    vi.spyOn(adminUsersApi, 'updateRole').mockRejectedValue(
      new ApiError({
        status: 409,
        code: 'CONFLICT',
        message: 'At least one active administrator must remain',
      }),
    )
    const user = userEvent.setup()
    renderDetail()

    await screen.findByRole('heading', { name: 'Admin User' })
    await user.click(screen.getByLabelText('Role'))
    await user.click(screen.getByRole('option', { name: 'User' }))
    await user.click(
      screen.getByRole('button', { name: 'Change role' }),
    )

    const dialog = screen.getByRole('dialog', {
      name: 'Confirm role change',
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Change role' }),
    )

    expect(
      await within(dialog).findByText(
        'At least one active administrator must remain',
      ),
    ).toBeInTheDocument()
  })

  it('debounces search and resets pagination before querying', async () => {
    const listUsers = vi
      .spyOn(adminUsersApi, 'list')
      .mockImplementation((params) =>
        Promise.resolve({
          items: [],
          meta: {
            page: params.page,
            limit: params.limit,
            total: 0,
            totalPages: 0,
          },
        }),
      )
    const user = userEvent.setup()
    renderList()

    await screen.findByRole('heading', { name: 'Users' })
    await waitFor(() => {
      expect(listUsers).toHaveBeenCalledWith({
        page: 3,
        limit: 20,
        sort: 'newest',
      })
    })

    await user.type(screen.getByLabelText('Search users'), 'Ada')

    expect(listUsers).not.toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      q: 'Ada',
      sort: 'newest',
    })

    await waitFor(
      () => {
        expect(listUsers).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
          q: 'Ada',
          sort: 'newest',
        })
      },
      { timeout: 1_500 },
    )
  })
})

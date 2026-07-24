import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminCategoriesApi } from '../src/api'
import { ApiError } from '../src/config/apiClient'
import { AdminCategoriesPage } from '../src/pages/Admin/AdminCategoriesPage'
import { appTheme } from '../src/theme'
import type {
  AdminCategory,
  AdminCategoryListData,
} from '../src/types/admin-categories'

const category: AdminCategory = {
  id: 'category-1',
  name: 'Technology',
  slug: 'technology',
  description: 'Technology articles',
  isActive: true,
  displayOrder: 1,
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-23T10:00:00.000Z',
}

const categoryList: AdminCategoryListData = {
  items: [category],
  meta: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
}

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/admin/categories']}>
          <Routes>
            <Route
              path="/admin/categories"
              element={<AdminCategoriesPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

describe('Admin Categories interactions', () => {
  beforeEach(() => {
    vi.spyOn(adminCategoriesApi, 'list').mockResolvedValue(categoryList)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('preserves form values and shows a duplicate slug conflict', async () => {
    vi.spyOn(adminCategoriesApi, 'create').mockRejectedValue(
      new ApiError({
        status: 409,
        code: 'CONFLICT',
        message: 'Category slug already exists',
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Technology')
    await user.click(
      screen.getByRole('button', { name: 'Create category' }),
    )
    await user.type(screen.getByLabelText('Name'), 'Science')
    await user.type(screen.getByLabelText('Slug'), 'science')
    await user.type(
      screen.getByLabelText('Description'),
      'Science articles',
    )
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Create category',
      }),
    )

    expect(
      await screen.findByText('Category slug already exists'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveValue('Science')
    expect(screen.getByLabelText('Description')).toHaveValue(
      'Science articles',
    )
  })

  it('requires confirmation before deactivating a category', async () => {
    const updateStatus = vi
      .spyOn(adminCategoriesApi, 'updateStatus')
      .mockResolvedValue({ id: category.id, isActive: false })
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Technology')
    await user.click(
      screen.getByRole('button', { name: 'Deactivate Technology' }),
    )
    expect(updateStatus).not.toHaveBeenCalled()

    const dialog = screen.getByRole('dialog', {
      name: 'Deactivate category',
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Deactivate' }),
    )

    await waitFor(() => {
      expect(updateStatus).toHaveBeenCalledWith(category.id, false)
    })
    expect(
      await screen.findByText('Technology deactivated.'),
    ).toBeInTheDocument()
  })

  it('explains deactivation when deletion is rejected as in use', async () => {
    vi.spyOn(adminCategoriesApi, 'delete').mockRejectedValue(
      new ApiError({
        status: 409,
        code: 'CONFLICT',
        message: 'Category is used by articles; deactivate it instead',
      }),
    )
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Technology')
    await user.click(
      screen.getByRole('button', { name: 'Delete Technology' }),
    )

    const dialog = screen.getByRole('dialog', {
      name: 'Delete category',
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Delete category' }),
    )

    expect(
      await within(dialog).findByText(/deactivate it instead/i),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText(/preserve its article references/i),
    ).toBeInTheDocument()
  })
})

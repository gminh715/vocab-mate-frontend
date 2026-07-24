import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminArticlesApi, adminCategoriesApi } from '../src/api'
import { AdminArticleForm } from '../src/components/AdminArticleForm'
import { ApiError } from '../src/config/apiClient'
import { AdminArticlesPage } from '../src/pages/Admin/AdminArticlesPage'
import type { ArticleFormOutput } from '../src/schemas/admin-article'
import { appTheme } from '../src/theme'
import type { AdminArticleListData } from '../src/types/admin-articles'

const category = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Technology',
  slug: 'technology',
  description: 'Technology articles',
  isActive: true,
  displayOrder: 1,
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-23T10:00:00.000Z',
}

const articleList: AdminArticleListData = {
  items: [
    {
      id: '660e8400-e29b-41d4-a716-446655440000',
      categoryId: category.id,
      title: 'How technology changes learning',
      slug: 'how-technology-changes-learning',
      summary: 'A concise introduction.',
      thumbnailUrl: null,
      cefrLevel: 'B1',
      status: 'DRAFT',
      contentVersion: 1,
      publishedAt: null,
      archivedAt: null,
      createdAt: '2026-07-22T10:00:00.000Z',
      updatedAt: '2026-07-23T10:00:00.000Z',
      category,
    },
  ],
  meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
}

const initialValues: ArticleFormOutput = {
  categoryId: category.id,
  title: 'How technology changes learning',
  slug: 'how-technology-changes-learning',
  summary: 'A concise introduction.',
  cefrLevel: 'B1',
  sourceName: '',
  sourceUrl: '',
  authorName: '',
  thumbnailUrl: '',
  contentHtml: '<p>Original article.</p>',
}

const providers = (children: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  )
}

describe('Admin Articles interactions', () => {
  beforeEach(() => {
    vi.spyOn(adminArticlesApi, 'list').mockResolvedValue(articleList)
    vi.spyOn(adminCategoriesApi, 'list').mockResolvedValue({
      items: [category],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('warns when article content changes and submits generated HTML', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      providers(
        <AdminArticleForm
          mode="edit"
          categories={[category]}
          initialValues={initialValues}
          isPending={false}
          serverError={null}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
        />,
      ),
    )

    expect(
      screen.getByText(/modifying article html may require parsing/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Paragraph' }),
    ).not.toBeInTheDocument()

    const editor = screen.getByRole('textbox', {
      name: 'Article content',
    })
    await user.click(
      screen.getByRole('combobox', { name: 'Text style' }),
    )
    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(
        screen.getByRole('option', { name: `Heading ${level}` }),
      ).toBeInTheDocument()
    }
    await user.click(
      screen.getByRole('option', { name: 'Heading 2' }),
    )

    expect(
      screen.getByText(/article html has changed/i),
    ).toBeInTheDocument()
    expect(editor).toHaveTextContent('Original article.')

    await user.click(
      screen.getByRole('button', { name: 'Save changes' }),
    )

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        contentHtml: '<h2>Original article.</h2>',
      })
    })
  })

  it('maps text alignment and inserted image attributes to contentHtml', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      providers(
        <AdminArticleForm
          mode="edit"
          categories={[category]}
          initialValues={initialValues}
          isPending={false}
          serverError={null}
          onCancel={vi.fn()}
          onSubmit={onSubmit}
        />,
      ),
    )

    await user.click(
      screen.getByRole('button', { name: 'Align center' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Insert image' }),
    )

    const dialog = screen.getByRole('dialog', {
      name: 'Insert image',
    })
    await user.type(
      within(dialog).getByLabelText('Image URL'),
      'https://example.com/article.png',
    )
    await user.type(
      within(dialog).getByLabelText('Alternative text'),
      'Article illustration',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Insert image' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Save changes' }),
    )

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        contentHtml: expect.stringContaining(
          'style="text-align: center;"',
        ),
      })
      expect(onSubmit).toHaveBeenCalledWith({
        contentHtml: expect.stringContaining(
          'src="https://example.com/article.png"',
        ),
      })
      expect(onSubmit).toHaveBeenCalledWith({
        contentHtml: expect.stringContaining(
          'alt="Article illustration"',
        ),
      })
      expect(onSubmit).toHaveBeenCalledWith({
        contentHtml: expect.stringContaining('loading="lazy"'),
      })
    })
  })

  it('explains archive-only handling when draft deletion conflicts', async () => {
    vi.spyOn(adminArticlesApi, 'delete').mockRejectedValue(
      new ApiError({
        status: 409,
        code: 'CONFLICT',
        message:
          'Only unused draft articles can be deleted; archive this article instead',
      }),
    )
    const user = userEvent.setup()

    render(
      providers(
        <MemoryRouter initialEntries={['/admin/articles']}>
          <Routes>
            <Route
              path="/admin/articles"
              element={<AdminArticlesPage />}
            />
          </Routes>
        </MemoryRouter>,
      ),
    )

    await screen.findByText('How technology changes learning')
    await user.click(
      screen.getByRole('button', {
        name: 'Delete How technology changes learning',
      }),
    )

    const dialog = screen.getByRole('dialog', {
      name: 'Delete draft article',
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Delete draft' }),
    )

    expect(
      await within(dialog).findByText(/used content must be archived/i),
    ).toBeInTheDocument()
  })
})

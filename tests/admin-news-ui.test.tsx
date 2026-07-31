import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { adminCategoriesApi, adminNewsApi } from '@/api'
import { AdminNewsPage } from '@/pages/Admin/AdminNewsPage'
import { appTheme } from '@/theme'

const categoryId = '550e8400-e29b-41d4-a716-446655440000'

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
        <MemoryRouter
          initialEntries={['/admin/news?q=climate&pageSize=10']}
        >
          <AdminNewsPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

describe('Admin Guardian intake', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reviews metadata and imports at most five drafts with the chosen category', async () => {
    vi.spyOn(adminCategoriesApi, 'list').mockResolvedValue({
      items: [
        {
          id: categoryId,
          name: 'Environment',
          slug: 'environment',
          description: null,
          isActive: true,
          displayOrder: 1,
          createdAt: '2026-07-31T00:00:00.000Z',
          updatedAt: '2026-07-31T00:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    })
    vi.spyOn(adminNewsApi, 'search').mockResolvedValue({
      totalArticles: 1,
      articles: [
        {
          externalId: 'environment/2026/jul/31/climate-story',
          title: 'A climate story',
          description: 'Guardian metadata only.',
          url: 'https://www.theguardian.com/environment/climate-story',
          imageUrl: null,
          sourceName: 'The Guardian',
          publishedAt: '2026-07-31T08:00:00.000Z',
          authorName: 'Guardian reporter',
          sectionId: 'environment',
          sectionName: 'Environment',
        },
      ],
    })
    const sync = vi.spyOn(adminNewsApi, 'sync').mockResolvedValue({
      counts: {
        discovered: 1,
        imported: 1,
        skippedDuplicate: 0,
        failed: 0,
      },
      items: [
        {
          status: 'imported',
          externalId: 'environment/2026/jul/31/climate-story',
          title: 'A climate story',
          canonicalUrl:
            'https://www.theguardian.com/environment/climate-story',
          articleId: '660e8400-e29b-41d4-a716-446655440000',
        },
      ],
    })
    const user = userEvent.setup()
    renderPage()

    expect(
      await screen.findByRole('heading', { name: 'A climate story' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'View on The Guardian' }),
    ).toHaveAttribute(
      'href',
      'https://www.theguardian.com/environment/climate-story',
    )

    await user.click(screen.getByLabelText('Default category'))
    await user.click(
      await screen.findByRole('option', { name: 'Environment' }),
    )
    await user.click(
      screen.getByRole('button', { name: 'Import drafts' }),
    )

    await waitFor(() =>
      expect(sync).toHaveBeenCalledWith({
        q: 'climate',
        orderBy: 'newest',
        pageSize: 5,
        defaultCategoryId: categoryId,
      }),
    )
    expect(await screen.findByText('1 imported')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Open draft' }),
    ).toBeInTheDocument()
  })
})

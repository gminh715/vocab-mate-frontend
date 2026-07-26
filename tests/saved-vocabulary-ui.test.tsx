import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectionsApi, vocabulariesApi } from '@/api'
import { ApiError } from '@/config/apiClient'
import { SavedVocabularyPage } from '@/pages/Vocabulary/SavedVocabularyPage'
import { appTheme } from '@/theme'
import type {
  CollectionListData,
  VocabularyListData,
  VocabularyListItem,
} from '@/types/Vocabulary/vocabulary'

const mockVocabularyItem: VocabularyListItem = {
  id: '770e8400-e29b-41d4-a716-446655440000',
  articleSentenceTermId: '550e8400-e29b-41d4-a716-446655440002',
  learningStatus: 'NEW',
  personalNote: 'Important note for review',
  savedWordDisplay: 'harmful',
  savedLemma: 'harmful',
  savedPartOfSpeech: 'adjective',
  savedIpa: 'hɑːmfʊl',
  savedCefrLevel: 'B1',
  savedMeaningVi: 'có hại',
  savedAt: '2026-07-24T10:00:00.000Z',
  nextReviewAt: '2026-07-25T10:00:00.000Z',
  collections: [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Environment',
      description: 'Environment related terms',
      addedAt: '2026-07-24T10:00:00.000Z',
    },
  ],
}

const mockVocabularyList: VocabularyListData = {
  items: [mockVocabularyItem],
  meta: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
}

const mockDueVocabularyList: VocabularyListData = {
  items: [mockVocabularyItem],
  meta: {
    page: 1,
    limit: 1,
    total: 1,
    totalPages: 1,
  },
}

const mockEmptyList: VocabularyListData = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
}

const mockCollectionList: CollectionListData = {
  items: [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Environment',
      description: 'Environment terms',
      createdAt: '2026-07-20T10:00:00.000Z',
      updatedAt: '2026-07-20T10:00:00.000Z',
      vocabularyCount: 5,
    },
  ],
  meta: {
    page: 1,
    limit: 100,
    total: 1,
    totalPages: 1,
  },
}

const renderPage = (initialEntries = ['/vocabularies']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const result = render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/vocabularies" element={<SavedVocabularyPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )

  return { ...result, queryClient }
}

describe('Saved Vocabulary Page UI', () => {
  beforeEach(() => {
    vi.spyOn(vocabulariesApi, 'findAll').mockResolvedValue(mockVocabularyList)
    vi.spyOn(vocabulariesApi, 'getDue').mockResolvedValue(mockDueVocabularyList)
    vi.spyOn(collectionsApi, 'findAll').mockResolvedValue(mockCollectionList)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders heading, due banner, filter bar, and vocabulary items table', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Saved Vocabulary' })).toBeInTheDocument()
    expect(await screen.findByText(/due for review today/i)).toBeInTheDocument()
    expect(screen.getByText('harmful')).toBeInTheDocument()
    expect(screen.getByText('có hại')).toBeInTheDocument()
    expect(screen.getAllByText('Environment').length).toBeGreaterThan(0)
  })

  it('renders empty state when user has no saved vocabulary', async () => {
    vi.spyOn(vocabulariesApi, 'findAll').mockResolvedValue(mockEmptyList)
    vi.spyOn(vocabulariesApi, 'getDue').mockResolvedValue(mockEmptyList)
    renderPage()

    expect(await screen.findByText('No Saved Vocabulary Yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        /You haven't saved any vocabulary terms yet/i,
      ),
    ).toBeInTheDocument()
  })

  it('renders no-results state with clear filters button when filters match no items', async () => {
    vi.spyOn(vocabulariesApi, 'findAll').mockResolvedValue(mockEmptyList)
    renderPage(['/vocabularies?q=nonexistent'])

    expect(await screen.findByText('No Vocabulary Found')).toBeInTheDocument()
    const clearButton = screen.getByRole('button', { name: 'Clear All Filters' })
    expect(clearButton).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(clearButton)

    expect(vocabulariesApi.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
      }),
    )
  })

  it('shows error state with retry button on API failure', async () => {
    vi.spyOn(vocabulariesApi, 'findAll').mockRejectedValue(
      new ApiError({
        status: 500,
        code: 'INTERNAL_ERROR',
        message: 'Server error',
      }),
    )

    renderPage()

    expect(
      await screen.findByText(
        'Failed to load saved vocabulary list. Check your connection and try again.',
      ),
    ).toBeInTheDocument()

    const retryButton = screen.getByRole('button', { name: 'Retry' })
    expect(retryButton).toBeInTheDocument()
  })

  it('triggers due-only toggle when clicking View Due Items', async () => {
    renderPage()

    const viewDueButton = await screen.findByRole('button', { name: 'View Due Items' })
    const user = userEvent.setup()
    await user.click(viewDueButton)

    expect(
      await screen.findByText('Showing Due Vocabulary Items Only'),
    ).toBeInTheDocument()
  })

  it('triggers delete confirmation dialog and calls delete mutation', async () => {
    vi.spyOn(vocabulariesApi, 'remove').mockResolvedValue(undefined)
    renderPage()

    const deleteButtons = await screen.findAllByRole('button', { name: /Delete harmful/i })
    const user = userEvent.setup()
    await user.click(deleteButtons[0])

    expect(
      await screen.findByRole('heading', { name: 'Remove Saved Vocabulary?' }),
    ).toBeInTheDocument()

    const confirmRemoveButton = screen.getByRole('button', { name: 'Remove' })
    await user.click(confirmRemoveButton)

    expect(vocabulariesApi.remove).toHaveBeenCalledWith(mockVocabularyItem.id)
  })
})

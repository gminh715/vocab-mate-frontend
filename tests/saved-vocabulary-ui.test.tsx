import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectionsApi, vocabulariesApi } from '@/api'
import { ApiError } from '@/config/apiClient'
import i18n from '@/i18n/i18n'
import { SavedVocabularyPage } from '@/pages/Vocabulary/SavedVocabularyPage'
import { appTheme } from '@/theme'
import type {
  CollectionDetailData,
  CollectionItemsListData,
  CollectionListData,
  VocabularyListData,
  VocabularyListItem,
} from '@/types/Vocabulary/vocabulary'

const mockVocabularyItem: VocabularyListItem = {
  id: '770e8400-e29b-41d4-a716-446655440000',
  articleSentenceTermId: '550e8400-e29b-41d4-a716-446655440002',
  learningStatus: 'NEW',
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
      addedAt: '2026-07-24T10:00:00.000Z',
    },
  ],
}

const secondVocabularyItem: VocabularyListItem = {
  ...mockVocabularyItem,
  id: '880e8400-e29b-41d4-a716-446655440000',
  articleSentenceTermId: '660e8400-e29b-41d4-a716-446655440002',
  savedWordDisplay: 'sustainable',
  savedLemma: 'sustainable',
  savedIpa: 'səˈsteɪnəbəl',
  savedMeaningVi: 'bền vững',
  learningStatus: 'REVIEWING',
}

const mockVocabularyList: VocabularyListData = {
  items: [mockVocabularyItem, secondVocabularyItem],
  meta: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1,
  },
}

const mockCollectionList: CollectionListData = {
  items: [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Environment',
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

const mockCollectionDetail: CollectionDetailData = {
  collection: {
    id: mockCollectionList.items[0].id,
    name: mockCollectionList.items[0].name,
    createdAt: mockCollectionList.items[0].createdAt,
    updatedAt: mockCollectionList.items[0].updatedAt,
  },
  vocabularyCount: 2,
}

const mockCollectionItems: CollectionItemsListData = {
  items: mockVocabularyList.items.map(({ collections, ...item }) => ({
    ...item,
    addedAt: collections[0]?.addedAt ?? item.savedAt,
  })),
  meta: mockVocabularyList.meta,
}

const mockEmptyCollectionItems: CollectionItemsListData = {
  items: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
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
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string): MediaQueryList => ({
        matches: query.includes('min-width'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
    vi.spyOn(collectionsApi, 'findAll').mockResolvedValue(mockCollectionList)
    vi.spyOn(collectionsApi, 'findOne').mockResolvedValue(mockCollectionDetail)
    vi.spyOn(collectionsApi, 'findItems').mockResolvedValue(mockCollectionItems)
    vi.spyOn(vocabulariesApi, 'findAll').mockResolvedValue(mockVocabularyList)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('defaults to the first collection and renders its vocabulary items', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Saved Vocabulary' })).toBeInTheDocument()
    expect(await screen.findByText('harmful')).toBeInTheDocument()
    expect(screen.getByText('có hại')).toBeInTheDocument()
    expect(screen.getAllByText('Environment').length).toBeGreaterThan(0)
    expect(screen.queryByText('All Vocabulary')).not.toBeInTheDocument()
    expect(vocabulariesApi.findAll).not.toHaveBeenCalled()
    expect(screen.queryByText('Phonetic / IPA')).not.toBeInTheDocument()
    expect(document.querySelector('[id^="table-status-select-"]')).toBeNull()
  })

  it('loads a selected collection through the collection items API', async () => {
    renderPage([
      `/vocabularies?collectionId=${mockCollectionDetail.collection.id}&cefrLevel=B2&dueOnly=true`,
    ])

    expect(await screen.findByText('harmful')).toBeInTheDocument()
    expect(collectionsApi.findOne).toHaveBeenCalledWith(
      mockCollectionDetail.collection.id,
    )
    expect(collectionsApi.findItems).toHaveBeenCalledWith(
      mockCollectionDetail.collection.id,
      {
        page: 1,
        limit: 20,
        sort: 'newest',
      },
    )
    expect(vocabulariesApi.findAll).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'View Due Items' }),
    ).not.toBeInTheDocument()
  })

  it('selects the current page and deletes the selected vocabulary in bulk', async () => {
    vi.spyOn(vocabulariesApi, 'remove').mockResolvedValue(undefined)
    renderPage()

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('checkbox', {
        name: 'Select all vocabulary on this page',
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Delete selected' }))
    expect(
      await screen.findByRole('heading', { name: 'Remove 2 selected words?' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove 2 words' }))

    expect(vocabulariesApi.remove).toHaveBeenCalledTimes(2)
    expect(vocabulariesApi.remove).toHaveBeenCalledWith(mockVocabularyItem.id)
    expect(vocabulariesApi.remove).toHaveBeenCalledWith(secondVocabularyItem.id)
  })

  it('renders empty state when user has no saved vocabulary', async () => {
    vi.spyOn(collectionsApi, 'findItems').mockResolvedValue(mockEmptyCollectionItems)
    renderPage()

    expect(await screen.findByText('No Saved Vocabulary Yet')).toBeInTheDocument()
    expect(
      screen.getByText(
        /You haven't saved any vocabulary terms yet/i,
      ),
    ).toBeInTheDocument()
  })

  it('renders no-results state with clear filters button when filters match no items', async () => {
    vi.spyOn(collectionsApi, 'findItems').mockResolvedValue(mockEmptyCollectionItems)
    renderPage(['/vocabularies?q=nonexistent'])

    expect(await screen.findByText('No Vocabulary Found')).toBeInTheDocument()
    const clearButton = screen.getByRole('button', { name: 'Clear All Filters' })
    expect(clearButton).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(clearButton)

    expect(collectionsApi.findItems).toHaveBeenLastCalledWith(
      mockCollectionDetail.collection.id,
      { page: 1, limit: 20, sort: 'newest' },
    )
  })

  it('shows error state with retry button on API failure', async () => {
    vi.spyOn(collectionsApi, 'findItems').mockRejectedValue(
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

  it('keeps collection actions in the right column instead of beside collection names', async () => {
    renderPage()

    expect(
      await screen.findByRole('button', { name: 'Rename Environment' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Environment' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Study with Flashcards' }),
    ).toHaveAttribute('href', '/review?reviewGoal=RECALL')
    expect(screen.getByRole('button', { name: 'Add vocabulary' })).toBeInTheDocument()
    expect(screen.queryByText('All Vocabulary')).not.toBeInTheDocument()
  })

  it('opens the add-vocabulary dialog for the selected collection', async () => {
    renderPage()

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: 'Add vocabulary' }),
    )

    expect(
      screen.getByRole('heading', { name: 'Add Saved Vocabulary to Collection' }),
    ).toBeInTheDocument()
  })

  it('renames the selected collection from the right column', async () => {
    vi.spyOn(collectionsApi, 'update').mockResolvedValue({
      collection: {
        ...mockCollectionDetail.collection,
        name: 'Nature',
      },
    })
    renderPage()

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Rename Environment' }))
    const nameInput = screen.getByLabelText('Collection name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Nature')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(collectionsApi.update).toHaveBeenCalledWith(
        mockCollectionDetail.collection.id,
        { name: 'Nature' },
      )
    })
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

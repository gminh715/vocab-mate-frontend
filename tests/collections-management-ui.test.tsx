import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectionsApi, vocabulariesApi } from '@/api'
import { AddVocabularyToCollectionDialog } from '@/components/Vocabulary/AddVocabularyToCollectionDialog'
import { CreateCollectionDialog } from '@/components/Vocabulary/CreateCollectionDialog'
import { collectionQueryKeys } from '@/hooks/Vocabulary/useCollections'
import { vocabularyQueryKeys } from '@/hooks/Vocabulary/useVocabularies'
import i18n from '@/i18n/i18n'
import { appTheme } from '@/theme'
import type {
  CollectionListData,
  VocabularyListData,
} from '@/types/Vocabulary/vocabulary'

const collectionId1 = '550e8400-e29b-41d4-a716-446655440010'
const collectionId2 = '550e8400-e29b-41d4-a716-446655440011'
const userVocabularyId = '770e8400-e29b-41d4-a716-446655440000'

const mockCollectionsList: CollectionListData = {
  items: [
    {
      id: collectionId1,
      name: 'Environment',
      createdAt: '2026-07-20T10:00:00.000Z',
      updatedAt: '2026-07-20T10:00:00.000Z',
      vocabularyCount: 5,
    },
    {
      id: collectionId2,
      name: 'Science',
      createdAt: '2026-07-21T10:00:00.000Z',
      updatedAt: '2026-07-21T10:00:00.000Z',
      vocabularyCount: 2,
    },
  ],
  meta: {
    page: 1,
    limit: 100,
    total: 2,
    totalPages: 1,
  },
}

const mockVocabList: VocabularyListData = {
  items: [
    {
      id: userVocabularyId,
      articleSentenceTermId: '550e8400-e29b-41d4-a716-446655440002',
      savedWordDisplay: 'harmful',
      savedLemma: 'harmful',
      savedPartOfSpeech: 'adjective',
      savedIpa: 'hɑːmfʊl',
      savedCefrLevel: 'B1',
      savedMeaningVi: 'có hại',
      savedAt: '2026-07-24T10:00:00.000Z',
      collections: [
        {
          id: collectionId1,
          name: 'Environment',
          addedAt: '2026-07-24T10:00:00.000Z',
        },
      ],
    },
  ],
  meta: {
    page: 1,
    limit: 100,
    total: 1,
    totalPages: 1,
  },
}

describe('Collections Management UI', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(collectionsApi, 'findAll').mockResolvedValue(mockCollectionsList)
    vi.spyOn(collectionsApi, 'findOne').mockImplementation(
      async (collectionId) => {
        const selected = mockCollectionsList.items.find(
          ({ id }) => id === collectionId,
        )
        if (!selected) throw new Error('Collection not found')
        const { vocabularyCount, ...collection } = selected
        return { collection, vocabularyCount }
      },
    )
    vi.spyOn(vocabulariesApi, 'findAll').mockResolvedValue(mockVocabList)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a new collection via CreateCollectionDialog', async () => {
    vi.spyOn(collectionsApi, 'create').mockResolvedValue({
      collection: {
        id: '550e8400-e29b-41d4-a716-446655440099',
        name: 'Technology',
        createdAt: '2026-07-25T10:00:00.000Z',
        updatedAt: '2026-07-25T10:00:00.000Z',
        vocabularyCount: 0,
      },
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const handleSuccess = vi.fn()

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={queryClient}>
          <CreateCollectionDialog
            open={true}
            onClose={() => {}}
            onSuccess={handleSuccess}
          />
        </QueryClientProvider>
      </ThemeProvider>,
    )

    expect(
      screen.getByRole('heading', { name: 'Create New Collection' }),
    ).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/Collection Name/i)
    const user = userEvent.setup()
    await user.type(nameInput, 'Technology')

    const submitButton = screen.getByRole('button', { name: 'Create Collection' })
    await user.click(submitButton)

    expect(collectionsApi.create).toHaveBeenCalledWith({
      name: 'Technology',
    })
    expect(handleSuccess).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440099')
  })

  it('adds saved vocabulary to a collection via AddVocabularyToCollectionDialog', async () => {
    vi.spyOn(collectionsApi, 'addItems').mockResolvedValue({
      addedCount: 1,
      skippedCount: 0,
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })

    queryClient.setQueryData(
      collectionQueryKeys.list({ limit: 100 }),
      mockCollectionsList,
    )
    queryClient.setQueryData(
      vocabularyQueryKeys.list({ page: 1, limit: 100, sort: 'newest' }),
      mockVocabList,
    )

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AddVocabularyToCollectionDialog
              open={true}
              onClose={() => {}}
              defaultCollectionId={collectionId2}
            />
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>,
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Add Saved Vocabulary to Collection',
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('harmful')).toBeInTheDocument()

    const checkbox = screen.getByRole('checkbox')
    const user = userEvent.setup()
    await user.click(checkbox)

    const addButton = screen.getByRole('button', {
      name: /Add 1 Selected Word/i,
    })
    await user.click(addButton)

    expect(collectionsApi.addItems).toHaveBeenCalledWith(collectionId2, [
      userVocabularyId,
    ])
  })

})

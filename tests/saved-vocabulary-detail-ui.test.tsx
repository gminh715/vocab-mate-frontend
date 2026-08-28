import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectionsApi, vocabulariesApi } from '@/api'
import { ApiError } from '@/config/apiClient'
import { VocabularyDetailPage } from '@/pages/Vocabulary/VocabularyDetailPage'
import { appTheme } from '@/theme'
import type {
  CollectionListData,
  VocabularyDetailData,
} from '@/types/Vocabulary/vocabulary'

const userVocabularyId = '770e8400-e29b-41d4-a716-446655440000'
const collectionId = '550e8400-e29b-41d4-a716-446655440010'

const mockDetailData: VocabularyDetailData = {
  vocabulary: {
    id: userVocabularyId,
    articleSentenceTermId: '550e8400-e29b-41d4-a716-446655440002',
    savedWordDisplay: 'harmful',
    savedLemma: 'harmful',
    savedPartOfSpeech: 'adjective',
    savedIpa: 'hɑːmfʊl',
    savedCefrLevel: 'B1',
    savedMeaningVi: 'có hại',
    definitionEn: 'causing damage or injury',
    savedAt: '2026-07-24T10:00:00.000Z',
    createdAt: '2026-07-24T10:00:00.000Z',
    savedExamples: [
      {
        sentence: 'Smoke is harmful.',
        translationVi: 'Khói có hại.',
      },
    ],
  },
  collections: [
    {
      id: collectionId,
      name: 'Environment',
      addedAt: '2026-07-24T10:00:00.000Z',
    },
  ],
  sourceArticle: {
    id: '660e8400-e29b-41d4-a716-446655440000',
    slug: 'plastic-and-marine-life',
    title: 'Plastic and marine life',
    thumbnailUrl: null,
    sourceName: 'Vocab Mate News',
    sourceUrl: null,
  },
}

const mockCollectionsList: CollectionListData = {
  items: [
    {
      id: collectionId,
      name: 'Environment',
      createdAt: '2026-07-20T10:00:00.000Z',
      updatedAt: '2026-07-20T10:00:00.000Z',
      vocabularyCount: 5,
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
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

const renderDetailPage = (id = userVocabularyId) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const result = render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/vocabularies/${id}`]}>
          <Routes>
            <Route
              path="/vocabularies/:userVocabularyId"
              element={<VocabularyDetailPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )

  return { ...result, queryClient }
}

describe('Saved Vocabulary Detail Page UI', () => {
  beforeEach(() => {
    vi.spyOn(vocabulariesApi, 'findOne').mockResolvedValue(mockDetailData)
    vi.spyOn(collectionsApi, 'findAll').mockResolvedValue(mockCollectionsList)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the reusable vocabulary snapshot and source article info', async () => {
    renderDetailPage()

    expect(await screen.findByRole('heading', { name: 'harmful' })).toBeInTheDocument()
    expect(screen.getByText('có hại')).toBeInTheDocument()
    expect(screen.getByText('causing damage or injury')).toBeInTheDocument()
    expect(screen.getByText('Plastic and marine life')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Read Article in Reader' })).toHaveAttribute(
      'href',
      '/read/plastic-and-marine-life',
    )
  })

  it('handles adding to collection and removing from collection', async () => {
    vi.spyOn(collectionsApi, 'addItems').mockResolvedValue({
      addedCount: 1,
      skippedCount: 0,
    })
    vi.spyOn(collectionsApi, 'removeItem').mockResolvedValue(undefined)

    renderDetailPage()

    const user = userEvent.setup()
    const addButton = await screen.findByRole('button', { name: '+ Add' })
    await user.click(addButton)

    expect(await screen.findByRole('heading', { name: 'Add Word to Collection' })).toBeInTheDocument()

    const scienceOption = screen.getByText('Science')
    await user.click(scienceOption)

    const addSelectedButton = screen.getByRole('button', { name: 'Add Selected' })
    await user.click(addSelectedButton)

    expect(collectionsApi.addItems).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440011',
      [userVocabularyId],
    )
  })

  it('displays 404 error state when vocabulary is not found or not owned', async () => {
    vi.spyOn(vocabulariesApi, 'findOne').mockRejectedValue(
      new ApiError({
        status: 404,
        code: 'NOT_FOUND',
        message: 'Saved vocabulary not found',
      }),
    )

    renderDetailPage('nonexistent-id')

    expect(await screen.findByText('Saved Vocabulary Not Found')).toBeInTheDocument()
    expect(
      screen.getByText(
        'The requested saved vocabulary item does not exist or is not owned by your account.',
      ),
    ).toBeInTheDocument()
  })

  it('triggers delete confirmation dialog and handles deletion', async () => {
    vi.spyOn(vocabulariesApi, 'remove').mockResolvedValue(undefined)

    renderDetailPage()

    const user = userEvent.setup()
    const deleteButton = await screen.findByRole('button', { name: 'Delete Vocabulary' })
    await user.click(deleteButton)

    expect(
      await screen.findByRole('heading', { name: 'Remove Saved Vocabulary?' }),
    ).toBeInTheDocument()

    const confirmRemoveButton = screen.getByRole('button', { name: 'Remove Vocabulary' })
    await user.click(confirmRemoveButton)

    expect(vocabulariesApi.remove).toHaveBeenCalledWith(userVocabularyId)
  })
})

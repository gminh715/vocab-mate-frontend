import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { collectionsApi, vocabulariesApi } from '@/api'
import { readingApi } from '@/api/Reading/ReadingApi'
import { ContextualTermDrawer } from '@/components/Article/ContextualTermDrawer'
import {
  saveVocabularyFormSchema,
  toSaveVocabularyRequest,
} from '@/schemas/Vocabulary/vocabulary'
import { appTheme } from '@/theme'
import { collectionQueryKeys } from '@/hooks/Vocabulary/useCollections'
import { readingQueryKeys } from '@/hooks/Reading/useReading'
import type { CollectionListData } from '@/types/Vocabulary/vocabulary'

const articleId = '660e8400-e29b-41d4-a716-446655440000'
const termId = '550e8400-e29b-41d4-a716-446655440002'
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

const mockEmptyCollectionsList: CollectionListData = {
  items: [],
  meta: {
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  },
}

const mockUnsavedLookup = {
  term: {
    id: termId,
    value: 'harmful',
    wordDisplay: 'harmful',
    lemma: 'harmful',
    unitType: 'WORD' as const,
    partOfSpeech: 'adjective',
    ipa: 'hɑːmfʊl',
    cefrLevel: 'B1' as const,
    contextualMeaningVi: 'có hại',
    definitionEn: 'causing damage',
    contextualExplanation: null,
    synonyms: [],
    antonyms: [],
    collocations: [],
    relatedTerms: [],
    vocabularyTopic: null,
    examples: [],
    skill: null,
  },
  parentSentence: {
    id: 'sentence-1',
    sentenceOrder: 1,
    sentenceText: 'Plastic waste is harmful to marine life.',
    translationVi: 'Rác thải nhựa có hại cho sinh vật biển.',
    explanationVi: null,
    referenceExplanation: null,
    skill: null,
  },
  saveState: {
    isSaved: false,
    userVocabularyId: null,
    learningStatus: null,
  },
}

const mockSavedLookup = {
  ...mockUnsavedLookup,
  saveState: {
    isSaved: true,
    userVocabularyId,
    learningStatus: 'NEW' as const,
  },
}

describe('Save Vocabulary with Collections', () => {
  beforeEach(() => {
    vi.spyOn(collectionsApi, 'findAll').mockResolvedValue(mockCollectionsList)
    vi.spyOn(vocabulariesApi, 'save').mockResolvedValue({
      vocabulary: {
        id: userVocabularyId,
        articleSentenceTermId: termId,
        learningStatus: 'NEW',
        savedWordDisplay: 'harmful',
        savedLemma: 'harmful',
        savedPartOfSpeech: 'adjective',
        savedIpa: 'hɑːmfʊl',
        savedCefrLevel: 'B1',
        savedMeaningVi: 'có hại',
        savedAt: '2026-07-24T10:00:00.000Z',
        nextReviewAt: null,
        savedContextSentence: 'Plastic waste is harmful.',
        savedContextTranslationVi: 'Rác thải nhựa có hại.',
        savedExplanation: null,
        savedExamples: [],
        lastReviewedAt: null,
        reviewIntervalDays: null,
      },
      collections: [],
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('validates saveVocabularyFormSchema requires at least one collectionId', () => {
    const invalidResult = saveVocabularyFormSchema.safeParse({
      collectionIds: [],
    })
    expect(invalidResult.success).toBe(false)

    const validResult = saveVocabularyFormSchema.safeParse({
      collectionIds: [collectionId1],
    })
    expect(validResult.success).toBe(true)
    if (validResult.success) {
      const req = toSaveVocabularyRequest(termId, validResult.data)
      expect(req.collectionIds).toEqual([collectionId1])
    }
  })

  it('shows the empty collection message in the collection selection area', async () => {
    vi.spyOn(readingApi, 'term').mockResolvedValue(mockUnsavedLookup)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })
    queryClient.setQueryData(
      readingQueryKeys.term(articleId, termId),
      mockUnsavedLookup,
    )
    queryClient.setQueryData(
      collectionQueryKeys.list({ limit: 100 }),
      mockEmptyCollectionsList,
    )

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ContextualTermDrawer
              open={true}
              articleId={articleId}
              termId={termId}
              onClose={() => {}}
            />
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>,
    )

    expect(await screen.findByRole('status')).toHaveTextContent(
      "You don't have any collections yet. Create one to save vocabulary.",
    )
    expect(screen.getByRole('button', { name: 'Create collection' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Save Vocabulary' })).toBeDisabled()
  })

  it('renders collection selection and saves vocabulary with collectionIds', async () => {
    vi.spyOn(readingApi, 'term').mockResolvedValue(mockUnsavedLookup)

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })

    queryClient.setQueryData(
      readingQueryKeys.term(articleId, termId),
      mockUnsavedLookup,
    )
    queryClient.setQueryData(
      collectionQueryKeys.list({ limit: 100 }),
      mockCollectionsList,
    )

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ContextualTermDrawer
              open={true}
              articleId={articleId}
              termId={termId}
              onClose={() => {}}
            />
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>,
    )

    const saveButton = await screen.findByRole('button', { name: 'Save Vocabulary' })
    const user = userEvent.setup()
    await user.click(saveButton)

    expect(vocabulariesApi.save).toHaveBeenCalledWith({
      articleSentenceTermId: termId,
      collectionIds: [collectionId1],
    })
  })

  it('allows adding an already saved word to additional collections', async () => {
    vi.spyOn(readingApi, 'term').mockResolvedValue(mockSavedLookup)
    vi.spyOn(collectionsApi, 'addItems').mockResolvedValue({
      addedCount: 1,
      skippedCount: 0,
    })

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    })

    queryClient.setQueryData(
      readingQueryKeys.term(articleId, termId),
      mockSavedLookup,
    )
    queryClient.setQueryData(
      collectionQueryKeys.list({ limit: 100 }),
      mockCollectionsList,
    )

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ContextualTermDrawer
              open={true}
              articleId={articleId}
              termId={termId}
              onClose={() => {}}
            />
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>,
    )

    expect(await screen.findByText('Add your vocab into collection')).toBeInTheDocument()

    const selectCombobox = screen.getByRole('combobox')
    const user = userEvent.setup()
    await user.click(selectCombobox)

    const scienceOption = await screen.findByRole('option', { name: 'Science' })
    await user.click(scienceOption)

    const addButton = screen.getByRole('button', { name: 'Add' })
    await user.click(addButton)

    expect(collectionsApi.addItems).toHaveBeenCalledWith(collectionId2, [
      userVocabularyId,
    ])
    expect(await screen.findByText('Added to collection successfully!')).toBeInTheDocument()
  })

  it('creates a collection from lookup and saves an unsaved word into it', async () => {
    vi.spyOn(readingApi, 'term').mockResolvedValue(mockUnsavedLookup)
    vi.spyOn(collectionsApi, 'create').mockResolvedValue({
      collection: {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'Travel',
        createdAt: '2026-08-25T10:00:00.000Z',
        updatedAt: '2026-08-25T10:00:00.000Z',
        vocabularyCount: 0,
      },
    })

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter>
            <ContextualTermDrawer
              open={true}
              articleId={articleId}
              termId={termId}
              onClose={() => {}}
            />
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>,
    )

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: 'Create collection' }),
    )
    await user.type(
      await screen.findByLabelText('Collection Name'),
      'Travel',
    )
    await user.click(
      screen.getByRole('button', { name: 'Create Collection', exact: true }),
    )

    await waitFor(() => {
      expect(vocabulariesApi.save).toHaveBeenCalledWith({
        articleSentenceTermId: termId,
        collectionIds: ['550e8400-e29b-41d4-a716-446655440012'],
      })
    })
  })

  it('creates a collection from lookup and adds an already saved word into it', async () => {
    vi.spyOn(readingApi, 'term').mockResolvedValue(mockSavedLookup)
    vi.spyOn(collectionsApi, 'create').mockResolvedValue({
      collection: {
        id: '550e8400-e29b-41d4-a716-446655440012',
        name: 'Travel',
        createdAt: '2026-08-25T10:00:00.000Z',
        updatedAt: '2026-08-25T10:00:00.000Z',
        vocabularyCount: 0,
      },
    })
    vi.spyOn(collectionsApi, 'addItems').mockResolvedValue({
      addedCount: 1,
      skippedCount: 0,
    })

    render(
      <ThemeProvider theme={appTheme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryRouter>
            <ContextualTermDrawer
              open={true}
              articleId={articleId}
              termId={termId}
              onClose={() => {}}
            />
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeProvider>,
    )

    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: 'Create collection' }),
    )
    await user.type(
      await screen.findByLabelText('Collection Name'),
      'Travel',
    )
    await user.click(
      screen.getByRole('button', { name: 'Create Collection', exact: true }),
    )

    await waitFor(() => {
      expect(collectionsApi.addItems).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440012',
        [userVocabularyId],
      )
    })
  })
})

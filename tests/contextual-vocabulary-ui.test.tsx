import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readingApi, vocabulariesApi } from '../src/api'
import { ApiError } from '../src/config/apiClient'
import { readingQueryKeys } from '../src/hooks/useReading'
import { ArticleReaderPage } from '../src/pages/ArticleReaderPage'
import { appTheme } from '../src/theme'
import type {
  ContextualTermLookupData,
  ReaderArticleData,
} from '../src/types/reading'
import type { SaveVocabularyData } from '../src/types/vocabulary'

const slug = 'plastic-and-marine-life'
const articleId = '660e8400-e29b-41d4-a716-446655440000'
const termId = '550e8400-e29b-41d4-a716-446655440002'

const readerData: ReaderArticleData = {
  article: {
    id: articleId,
    title: 'Plastic and marine life',
    slug,
    summary: 'How plastic waste affects ocean ecosystems.',
    sourceName: 'Vocab Mate News',
    sourceUrl: null,
    authorName: null,
    thumbnailUrl: null,
    cefrLevel: 'B1',
    status: 'PUBLISHED',
    publishedAt: '2026-07-22T10:00:00.000Z',
    category: {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Environment',
      slug: 'environment',
    },
  },
  contentHtml: `<p data-sentence-id="sentence-1">Plastic waste is <span data-term-id="${termId}">harmful</span> to marine life.</p>`,
  highlightedTermIds: [termId],
  progress: {
    articleId,
    status: 'READING',
    progressPercent: 20,
    lastBlockKey: null,
    completedAt: null,
  },
}

const unsavedLookup: ContextualTermLookupData = {
  term: {
    id: termId,
    value: 'harmful',
    wordDisplay: 'harmful',
    lemma: 'harmful',
    unitType: 'WORD',
    partOfSpeech: 'adjective',
    ipa: null,
    cefrLevel: 'B1',
    contextualMeaningVi: 'có hại',
    definitionEn: 'causing damage or injury',
    contextualExplanation: null,
    synonyms: ['damaging'],
    antonyms: [],
    collocations: ['harmful effect'],
    relatedTerms: [],
    vocabularyTopic: null,
    examples: [
      {
        sentence: 'Smoke can be harmful to your health.',
        translationVi: 'Khói có thể có hại cho sức khỏe.',
      },
    ],
    skill: null,
  },
  parentSentence: {
    id: '550e8400-e29b-41d4-a716-446655440001',
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

const savedLookup: ContextualTermLookupData = {
  ...unsavedLookup,
  saveState: {
    isSaved: true,
    userVocabularyId: '770e8400-e29b-41d4-a716-446655440000',
    learningStatus: 'NEW',
  },
}

const savedVocabulary: SaveVocabularyData = {
  vocabulary: {
    id: '770e8400-e29b-41d4-a716-446655440000',
    articleSentenceTermId: termId,
    learningStatus: 'NEW',
    personalNote: 'Remember this sentence',
    savedWordDisplay: 'harmful',
    savedLemma: 'harmful',
    savedPartOfSpeech: 'adjective',
    savedIpa: null,
    savedCefrLevel: 'B1',
    savedMeaningVi: 'có hại',
    savedAt: '2026-07-24T10:00:00.000Z',
    nextReviewAt: null,
    savedContextSentence: 'Plastic waste is harmful to marine life.',
    savedContextTranslationVi:
      'Rác thải nhựa có hại cho sinh vật biển.',
    savedExplanation: null,
    savedExamples: unsavedLookup.term.examples,
    lastReviewedAt: null,
    reviewIntervalDays: null,
  },
  collections: [],
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const renderReader = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const result = render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/read/${slug}`]}>
          <Routes>
            <Route path="/read/:slug" element={<ArticleReaderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )

  return { ...result, queryClient }
}

const openLookup = async () => {
  const user = userEvent.setup()
  await user.click(
    await screen.findByRole('button', {
      name: 'Turn on vocabulary lookup',
    }),
  )
  await user.click(await screen.findByRole('button', { name: 'harmful' }))
  return user
}

describe('contextual vocabulary lookup and save flow', () => {
  beforeEach(() => {
    vi.spyOn(readingApi, 'article').mockResolvedValue(readerData)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not fetch eagerly, opens from the delegated term, then renders nullable data safely', async () => {
    const lookup = deferred<ContextualTermLookupData>()
    vi.spyOn(readingApi, 'term').mockReturnValue(lookup.promise)
    renderReader()

    await screen.findByRole('heading', { name: readerData.article.title })
    expect(readingApi.term).not.toHaveBeenCalled()
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', {
        name: 'Turn on vocabulary lookup',
      }),
    )
    const activatedTerm = screen.getByRole('button', { name: 'harmful' })
    await user.click(activatedTerm)

    expect(
      screen.getByRole('dialog', { name: 'Vocabulary lookup' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Loading vocabulary details…')).toBeInTheDocument()
    expect(readingApi.term).toHaveBeenCalledWith(
      articleId,
      termId,
      expect.anything(),
    )

    await act(async () => {
      lookup.resolve(unsavedLookup)
      await lookup.promise
    })

    expect(
      await screen.findByRole('heading', { name: 'harmful' }),
    ).toBeInTheDocument()
    expect(screen.getByText('causing damage or injury')).toBeInTheDocument()
    expect(
      screen.getByText('Rác thải nhựa có hại cho sinh vật biển.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Smoke can be harmful to your health.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Contextual explanation' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('IPA')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Reference note' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(activatedTerm).toHaveFocus()
    expect(activatedTerm).toHaveAttribute('aria-pressed', 'false')
    expect(activatedTerm).not.toHaveClass('article-term-selected')
  })

  it('maps the save request, blocks duplicates, and updates the selected lookup state', async () => {
    vi.spyOn(readingApi, 'term').mockResolvedValue(unsavedLookup)
    const save = deferred<SaveVocabularyData>()
    vi.spyOn(vocabulariesApi, 'save').mockReturnValue(save.promise)
    const { queryClient } = renderReader()
    const vocabularyListKey = ['vocabularies', 'list', { page: 1 }] as const
    queryClient.setQueryData(vocabularyListKey, { items: [] })
    const user = await openLookup()

    await user.type(
      await screen.findByLabelText('Personal note (optional)'),
      '  Remember this sentence  ',
    )
    await user.click(
      screen.getByRole('button', { name: 'Save Vocabulary' }),
    )

    expect(vocabulariesApi.save).toHaveBeenCalledWith({
      articleSentenceTermId: termId,
      personalNote: 'Remember this sentence',
    })
    expect(
      screen.getByRole('button', { name: 'Saving…' }),
    ).toBeDisabled()
    expect(vocabulariesApi.save).toHaveBeenCalledTimes(1)

    await act(async () => {
      save.resolve(savedVocabulary)
      await save.promise
    })

    expect(
      await screen.findByText('Saved to vocabulary'),
    ).toBeInTheDocument()
    expect(screen.getByText('Status: New.')).toBeInTheDocument()
    expect(
      queryClient.getQueryData<ContextualTermLookupData>(
        readingQueryKeys.term(articleId, termId),
      )?.saveState,
    ).toEqual({
      isSaved: true,
      userVocabularyId: savedVocabulary.vocabulary.id,
      learningStatus: 'NEW',
    })
    expect(queryClient.getQueryState(vocabularyListKey)?.isInvalidated).toBe(
      true,
    )
  })

  it('treats 409 as already saved and refreshes the authoritative save state', async () => {
    vi.spyOn(readingApi, 'term')
      .mockResolvedValueOnce(unsavedLookup)
      .mockResolvedValueOnce(savedLookup)
    vi.spyOn(vocabulariesApi, 'save').mockRejectedValue(
      new ApiError({
        status: 409,
        code: 'CONFLICT',
        message: 'Contextual term is already saved',
      }),
    )
    renderReader()
    const user = await openLookup()

    await user.click(
      await screen.findByRole('button', { name: 'Save Vocabulary' }),
    )

    expect(
      await screen.findByText('Saved to vocabulary'),
    ).toBeInTheDocument()
    expect(readingApi.term).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toHaveTextContent(
      'Saved to vocabulary',
    )
  })

  it.each([
    {
      status: 403,
      message: 'Lookup is disabled for this contextual term.',
    },
    {
      status: 404,
      message: 'This contextual term is no longer available in the article.',
    },
  ])(
    'shows the dedicated lookup $status state',
    async ({ status, message }) => {
      vi.spyOn(readingApi, 'term').mockRejectedValue(
        new ApiError({
          status,
          code: status === 403 ? 'FORBIDDEN' : 'NOT_FOUND',
          message,
        }),
      )
      renderReader()

      await openLookup()

      expect(await screen.findByText(message)).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Save Vocabulary' }),
      ).not.toBeInTheDocument()
    },
  )

  it('explains a 422 collection-ownership rejection without exposing the raw error', async () => {
    vi.spyOn(readingApi, 'term').mockResolvedValue(unsavedLookup)
    vi.spyOn(vocabulariesApi, 'save').mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'UNPROCESSABLE_ENTITY',
        message: 'One or more collections are unavailable',
      }),
    )
    renderReader()
    const user = await openLookup()

    await user.click(
      await screen.findByRole('button', { name: 'Save Vocabulary' }),
    )

    expect(
      await screen.findByText(
        'One or more selected collections are no longer available. Review your collections and try again.',
      ),
    ).toBeInTheDocument()
  })

  it('does not expose unexpected backend save details', async () => {
    vi.spyOn(readingApi, 'term').mockResolvedValue(unsavedLookup)
    vi.spyOn(vocabulariesApi, 'save').mockRejectedValue(
      new ApiError({
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Internal vocabulary detail',
        details: ['private snapshot detail'],
      }),
    )
    renderReader()
    const user = await openLookup()

    await user.click(
      await screen.findByRole('button', { name: 'Save Vocabulary' }),
    )

    expect(
      await screen.findByText('Vocabulary could not be saved. Try again.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('private snapshot detail'),
    ).not.toBeInTheDocument()
  })
})

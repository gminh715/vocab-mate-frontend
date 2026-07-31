import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readingApi } from '@/api'
import { ArticleRenderer } from '@/components/Article/ArticleRenderer'
import { ApiError } from '@/config/apiClient'
import { ArticleReaderPage } from '@/pages/Article/ArticleReaderPage'
import { appTheme } from '@/theme'
import type {
  ContextualTermLookupData,
  ReaderArticleData,
} from '@/types/Reading/reading'

const slug = 'how-technology-changes-learning'
const contentHtml =
  '<p data-sentence-id="sentence-1">A <span data-term-id="term-1">complex</span> idea stays <span data-term-id="term-2"><strong>complex</strong></span>, while <span data-term-id="term-3">simple</span> stays plain.</p>'

const readerData: ReaderArticleData = {
  article: {
    id: '660e8400-e29b-41d4-a716-446655440000',
    title: 'How technology changes learning',
    slug,
    summary: 'A concise introduction to technology in the classroom.',
    sourceName: 'Vocab Mate News',
    sourceUrl: 'https://example.com/original',
    authorName: 'Jane Doe',
    thumbnailUrl: null,
    cefrLevel: 'B1',
    status: 'PUBLISHED',
    publishedAt: '2026-07-22T10:00:00.000Z',
    category: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Technology',
      slug: 'technology',
    },
  },
  contentHtml,
  highlightedTermIds: ['term-2'],
  progress: {
    articleId: '660e8400-e29b-41d4-a716-446655440000',
    status: 'READING',
    progressPercent: 37.5,
    lastBlockKey: 'sentence-1',
    completedAt: null,
  },
}

const lookupData: ContextualTermLookupData = {
  term: {
    id: 'term-2',
    value: 'complex',
    wordDisplay: 'complex',
    lemma: 'complex',
    unitType: 'WORD',
    partOfSpeech: 'adjective',
    ipa: null,
    cefrLevel: 'B1',
    contextualMeaningVi: 'phức tạp',
    definitionEn: null,
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
    sentenceText: 'A complex idea stays complex.',
    translationVi: null,
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

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderReaderPage = () =>
  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={createQueryClient()}>
        <MemoryRouter initialEntries={[`/read/${slug}`]}>
          <Routes>
            <Route path="/read/:slug" element={<ArticleReaderPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )

const renderArticle = (onTermSelect = vi.fn()) => {
  const result = render(
    <ThemeProvider theme={appTheme}>
      <ArticleRenderer
        contentHtml={contentHtml}
        highlightedTermIds={['term-1', 'term-2']}
        onTermSelect={onTermSelect}
      />
    </ThemeProvider>,
  )

  return { ...result, onTermSelect }
}

describe('ArticleRenderer term interaction', () => {
  it('keeps highlighting separate from lookup interaction', () => {
    const { container } = renderArticle()
    const sentence = container.querySelector(
      '[data-sentence-id="sentence-1"]',
    )
    const firstDuplicate = container.querySelector(
      '[data-term-id="term-1"]',
    )
    const secondDuplicate = container.querySelector(
      '[data-term-id="term-2"]',
    )
    const nonHighlighted = container.querySelector(
      '[data-term-id="term-3"]',
    )

    expect(sentence).toHaveTextContent(
      'A complex idea stays complex, while simple stays plain.',
    )
    expect(secondDuplicate?.querySelector('strong')).toHaveTextContent(
      'complex',
    )
    expect(firstDuplicate).toHaveAttribute('role', 'button')
    expect(secondDuplicate).toHaveAttribute('role', 'button')
    expect(nonHighlighted).toHaveAttribute('role', 'button')
    expect(nonHighlighted).toHaveAttribute('tabindex', '-1')
    expect(nonHighlighted).not.toHaveClass('article-term-highlighted')
  })

  it('does not make term markers interactive when lookup is disabled', () => {
    const { container } = render(
      <ThemeProvider theme={appTheme}>
        <ArticleRenderer
          contentHtml={contentHtml}
          highlightedTermIds={['term-2']}
        />
      </ThemeProvider>,
    )

    for (const marker of container.querySelectorAll('[data-term-id]')) {
      expect(marker).not.toHaveAttribute('role')
      expect(marker).not.toHaveAttribute('tabindex')
    }
  })

  it('delegates nested term clicks to the exact data-term-id and ignores outside clicks', async () => {
    const user = userEvent.setup()
    const { container, onTermSelect } = renderArticle()

    await user.click(screen.getByText('complex', { selector: 'strong' }))
    expect(onTermSelect).toHaveBeenCalledWith('term-2')

    fireEvent.click(
      container.querySelector('[data-sentence-id="sentence-1"]')!,
    )
    expect(onTermSelect).toHaveBeenCalledTimes(1)
  })

  it('uses one roving tab stop and supports keyboard selection', () => {
    const { container, onTermSelect } = renderArticle()
    const first = container.querySelector<HTMLElement>(
      '[data-term-id="term-1"]',
    )!
    const second = container.querySelector<HTMLElement>(
      '[data-term-id="term-2"]',
    )!

    expect(first).toHaveAttribute('tabindex', '0')
    expect(second).toHaveAttribute('tabindex', '-1')

    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(second, { key: 'Enter' })
    expect(onTermSelect).toHaveBeenCalledWith('term-2')
  })
})

describe('Article reader page', () => {
  beforeEach(() => {
    vi.spyOn(readingApi, 'article').mockResolvedValue(readerData)
    vi.spyOn(readingApi, 'term').mockResolvedValue(lookupData)
    vi.spyOn(readingApi, 'updateProgress').mockImplementation(
      async (_, input) => ({
        progress: {
          ...readerData.progress,
          progressPercent:
            input.progressPercent ?? readerData.progress.progressPercent,
        },
      }),
    )
    vi.spyOn(readingApi, 'complete').mockResolvedValue({
      progress: {
        ...readerData.progress,
        status: 'COMPLETED',
        progressPercent: 100,
        completedAt: '2026-07-24T10:00:00.000Z',
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the reader payload, backend progress, and selected-term state', async () => {
    const user = userEvent.setup()
    const { container } = renderReaderPage()

    expect(
      await screen.findByRole('heading', {
        name: readerData.article.title,
      }),
    ).toBeInTheDocument()
    const progressBar = screen.getByRole('progressbar', {
      name: 'Reading progress: 37.5% read',
    })
    expect(progressBar).toHaveAttribute('aria-valuenow', '37.5')
    expect(
      progressBar.closest('header'),
    ).toBeNull()

    const firstDuplicate = container.querySelector(
      '[data-term-id="term-1"]',
    )
    expect(firstDuplicate).not.toHaveAttribute('role')
    expect(readingApi.term).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Turn on vocabulary lookup',
      }),
    )
    const highlightedDuplicate =
      container.querySelector<HTMLElement>(
        '[data-term-id="term-2"]',
      )!

    await user.click(highlightedDuplicate)
    expect(
      screen.getByText('Vocabulary details are open.'),
    ).toBeInTheDocument()
    const lookupDialog = screen.getByRole('dialog', { name: 'complex' })
    expect(lookupDialog).toBeInTheDocument()
    expect(highlightedDuplicate).toBeInTheDocument()
    expect(lookupDialog).toHaveFocus()
    expect(highlightedDuplicate).toHaveAttribute('aria-pressed', 'true')
    expect(readingApi.article).toHaveBeenCalledTimes(1)
  })

  it('looks up a backend-marked term that is not highlighted for the user level', async () => {
    const user = userEvent.setup()
    const { container } = renderReaderPage()

    await screen.findByRole('heading', {
      name: readerData.article.title,
    })
    const easierTerm = container.querySelector<HTMLElement>(
      '[data-term-id="term-1"]',
    )!

    fireEvent.click(easierTerm)
    expect(readingApi.term).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', {
        name: 'Turn on vocabulary lookup',
      }),
    )
    expect(easierTerm).toHaveAttribute('role', 'button')
    expect(easierTerm).not.toHaveClass('article-term-highlighted')

    await user.click(easierTerm)

    await waitFor(() => {
      expect(readingApi.term).toHaveBeenCalledWith(
        readerData.article.id,
        'term-1',
        expect.any(AbortSignal),
      )
    })
  })

  it('keeps backend-recommended highlights visible when lookup is toggled', async () => {
    const user = userEvent.setup()
    const { container } = renderReaderPage()

    await screen.findByRole('heading', {
      name: readerData.article.title,
    })
    const suggestedTerm = container.querySelector<HTMLElement>(
      '[data-term-id="term-2"]',
    )!
    const otherTerm = container.querySelector<HTMLElement>(
      '[data-term-id="term-1"]',
    )!

    expect(suggestedTerm).toHaveClass('article-term-highlighted')
    expect(otherTerm).not.toHaveClass('article-term-highlighted')

    await user.click(
      screen.getByRole('button', {
        name: 'Turn on vocabulary lookup',
      }),
    )
    expect(suggestedTerm).toHaveClass('article-term-highlighted')
    expect(otherTerm).not.toHaveClass('article-term-highlighted')

    await user.click(
      screen.getByRole('button', {
        name: 'Turn off vocabulary lookup',
      }),
    )
    expect(suggestedTerm).toHaveClass('article-term-highlighted')
    expect(suggestedTerm).not.toHaveAttribute('role')
    expect(otherTerm).not.toHaveClass('article-term-highlighted')
    expect(otherTerm).not.toHaveAttribute('role')
  })

  it.each([
    {
      status: 403,
      heading: 'Reading unavailable',
      message: 'This account is suspended or disabled.',
    },
    {
      status: 404,
      heading: 'Article not found',
      message: 'This article may be unavailable or no longer published.',
    },
  ])(
    'renders the dedicated $status reader state',
    async ({ status, heading, message }) => {
      vi.mocked(readingApi.article).mockRejectedValue(
        new ApiError({
          status,
          code: status === 403 ? 'FORBIDDEN' : 'NOT_FOUND',
          message,
        }),
      )

      renderReaderPage()

      expect(
        await screen.findByRole('heading', { name: heading }),
      ).toBeInTheDocument()
      expect(screen.getByText(new RegExp(message))).toBeInTheDocument()
    },
  )

  it('does not expose backend reader error details', async () => {
    vi.mocked(readingApi.article).mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'UNPROCESSABLE_ENTITY',
        message: 'Internal reader detail',
        details: ['private reader detail'],
      }),
    )

    renderReaderPage()

    expect(
      await screen.findByText(
        'The article reader could not be loaded. Try again.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('private reader detail')).not.toBeInTheDocument()
  })

  it('automatically completes the article when reading progress reaches 100%', async () => {
    vi.spyOn(
      HTMLElement.prototype,
      'getBoundingClientRect',
    ).mockReturnValue({
      top: -400,
      bottom: 600,
      height: 1_000,
      left: 0,
      right: 800,
      width: 800,
      x: 0,
      y: -400,
      toJSON: () => ({}),
    })
    renderReaderPage()

    await screen.findByRole('heading', {
      name: readerData.article.title,
    })
    fireEvent.scroll(window)

    await waitFor(() => {
      expect(readingApi.complete).toHaveBeenCalledTimes(1)
    })
    expect(
      screen.getByRole('progressbar', {
        name: 'Reading progress: Complete',
      }),
    ).toHaveAttribute('aria-valuenow', '100')
    expect(screen.queryByText('Completed')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reset progress' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Mark as complete' }),
    ).not.toBeInTheDocument()
  })
})

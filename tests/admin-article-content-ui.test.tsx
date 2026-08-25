import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminArticleContentApi, adminArticlesApi } from '@/api'
import { ArticleSentenceEditor } from '@/components/Article/ArticleSentenceEditor'
import { ApiError } from '@/config/apiClient'
import { AdminArticleContentPage } from '@/pages/Admin/AdminArticleContentPage'
import { AdminArticlePreviewPage } from '@/pages/Admin/AdminArticlePreviewPage'
import { appTheme } from '@/theme'
import type {
  ArticlePreviewData,
  ArticleSentence,
  ArticleSentenceTerm,
  ArticleTermListItem,
} from '@/types/Admin/adminArticleContent'
import type { AdminArticleDetail } from '@/types/Admin/adminArticles'

const articleId = '660e8400-e29b-41d4-a716-446655440000'
const sentenceId = '770e8400-e29b-41d4-a716-446655440000'
const termId = '880e8400-e29b-41d4-a716-446655440000'

const category = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Technology',
  slug: 'technology',
}

const sentence: ArticleSentence = {
  id: sentenceId,
  articleId,
  contentVersion: 2,
  sentenceOrder: 1,
  sentenceText: 'Digital tools improve access to education.',
  translationVi: 'Công cụ số cải thiện khả năng tiếp cận giáo dục.',
  explanationVi: null,
  referenceExplanation: null,
  skill: 'reading',
  isActive: true,
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-23T10:00:00.000Z',
}

const term: ArticleSentenceTerm = {
  id: termId,
  sentenceId,
  value: 'Digital tools',
  wordDisplay: 'Digital tools',
  lemma: 'digital tool',
  normalizedLemma: 'digital tool',
  unitType: 'PHRASE',
  partOfSpeech: 'noun phrase',
  ipa: null,
  cefrLevel: 'B1',
  contextualMeaningVi: 'công cụ số',
  definitionEn: 'Electronic resources.',
  contextualExplanation: null,
  synonyms: [],
  antonyms: [],
  collocations: [],
  relatedTerms: [],
  vocabularyTopic: 'technology',
  examples: [],
  skill: null,
  origin: 'MANUAL',
  reviewStatus: 'APPROVED',
  selectionReason: null,
  explanationStatus: 'READY',
  explanationError: null,
  explanationGeneratedAt: '2026-07-20T10:00:00.000Z',
  isLookupEnabled: true,
  isActive: true,
  createdAt: '2026-07-20T10:00:00.000Z',
  updatedAt: '2026-07-23T10:00:00.000Z',
}

const articleDetail: AdminArticleDetail = {
  article: {
    id: articleId,
    categoryId: category.id,
    title: 'How technology changes learning',
    slug: 'how-technology-changes-learning',
    summary: 'A concise introduction.',
    contentHtml:
      `<p><span data-sentence-id="${sentenceId}">Digital tools improve access to education.</span></p>`,
    contentVersion: 2,
    importSource: null,
    externalId: null,
    canonicalUrl: null,
    contentHash: null,
    sourcePublishedAt: null,
    aiAnalysisStatus: 'PENDING',
    aiAnalysisError: null,
    sourceName: null,
    sourceUrl: null,
    authorName: null,
    thumbnailUrl: null,
    cefrLevel: 'B1',
    status: 'DRAFT',
    publishedAt: null,
    archivedAt: null,
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-23T10:00:00.000Z',
    category,
  },
  sentenceCount: 1,
  termCount: 1,
}

const termListItem: ArticleTermListItem = {
  ...term,
  sentenceOrder: 1,
  hasDefinitionEn: true,
  hasContextualExplanation: false,
  hasExamples: false,
}

const previewData: ArticlePreviewData = {
  article: {
    id: articleId,
    title: articleDetail.article.title,
    slug: articleDetail.article.slug,
    summary: articleDetail.article.summary,
    sourceName: null,
    sourceUrl: null,
    authorName: null,
    thumbnailUrl: null,
    cefrLevel: 'B1',
    status: 'DRAFT',
    contentVersion: 2,
    publishedAt: null,
    category,
  },
  contentHtml:
    `<p><span data-sentence-id="${sentenceId}"><span data-term-id="${termId}">Digital tools</span> improve access.</span></p>`,
  terms: [{ ...term, isHighlighted: true }],
  validationWarnings: [],
}

const renderWithProviders = (
  node: React.ReactNode,
  initialEntries = ['/'],
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{node}</MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

const renderContentPage = (entry = `/admin/articles/${articleId}/content`) =>
  renderWithProviders(
    <Routes>
      <Route
        path="/admin/articles/:articleId/content"
        element={<AdminArticleContentPage />}
      />
    </Routes>,
    [entry],
  )

describe('Admin article content workspace', () => {
  beforeEach(() => {
    vi.spyOn(adminArticlesApi, 'detail').mockResolvedValue(articleDetail)
    vi.spyOn(adminArticleContentApi, 'listSentences').mockResolvedValue({
      items: [sentence],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      contentVersion: 2,
    })
    vi.spyOn(adminArticleContentApi, 'sentenceDetail').mockResolvedValue({
      sentence,
      terms: [term],
    })
    vi.spyOn(adminArticleContentApi, 'listTerms').mockResolvedValue({
      items: [termListItem],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      contentVersion: 2,
    })
    vi.spyOn(adminArticleContentApi, 'termDetail').mockResolvedValue({
      term,
      sentence,
    })
    vi.spyOn(adminArticleContentApi, 'updateTerm').mockResolvedValue({
      term,
      contentHtmlChanged: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders source sentence text outside editable form controls', () => {
    renderWithProviders(
      <ArticleSentenceEditor
        sentence={sentence}
        isPending={false}
        isReadOnly={false}
        serverError={null}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByText(sentence.sentenceText)).toBeInTheDocument()
    expect(screen.queryByDisplayValue(sentence.sentenceText)).toBeNull()
    expect(
      screen.getByText(/source sentence · read only/i),
    ).toBeInTheDocument()
  })

  it('handles parse 422 and confirms before forced parsing', async () => {
    const parse = vi
      .spyOn(adminArticleContentApi, 'parse')
      .mockRejectedValueOnce(
        new ApiError({
          status: 422,
          code: 'UNPROCESSABLE_ENTITY',
          message: 'Article content contains no parseable reading sentences',
        }),
      )
      .mockRejectedValueOnce(
        new ApiError({
          status: 409,
          code: 'CONFLICT',
          message:
            'The current article content version has already been parsed',
        }),
      )
      .mockResolvedValueOnce({
        contentVersion: 2,
        sentenceCount: 1,
        contentHtml: articleDetail.article.contentHtml,
      })
    const user = userEvent.setup()
    renderContentPage()

    await screen.findByRole('heading', { name: 'Article content' })
    await user.click(
      await screen.findByRole('button', { name: 'Parse current content' }),
    )
    expect(
      await screen.findByText(/no parseable reading sentences/i),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Parse current content' }),
    )
    const dialog = await screen.findByRole('dialog', {
      name: 'Force parse current content',
    })
    expect(parse).toHaveBeenNthCalledWith(2, articleId, {})

    await user.click(
      within(dialog).getByRole('button', { name: 'Force parse' }),
    )
    await waitFor(() => {
      expect(parse).toHaveBeenNthCalledWith(3, articleId, {
        force: true,
      })
    })
  })

  it('offers deactivation or lookup disabling for referenced terms', async () => {
    vi.spyOn(adminArticleContentApi, 'deleteTerm').mockRejectedValue(
      new ApiError({
        status: 409,
        code: 'CONFLICT',
        message:
          'Term is referenced by vocabulary or review history and cannot be deleted',
      }),
    )
    const update = vi.mocked(adminArticleContentApi.updateTerm)
    const user = userEvent.setup()
    renderContentPage(
      `/admin/articles/${articleId}/content?sentenceId=${sentenceId}`,
    )

    await screen.findByText('Contextual terms')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog', {
      name: 'Delete contextual term',
    })
    await user.click(
      within(dialog).getByRole('button', { name: 'Delete term' }),
    )

    expect(
      await within(dialog).findByRole('button', {
        name: 'Deactivate term',
      }),
    ).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Disable lookup' }),
    )

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(articleId, termId, {
        isLookupEnabled: false,
      })
    })
  })

  it('shows backend publish issues as an actionable checklist', async () => {
    vi.spyOn(adminArticleContentApi, 'publish').mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'UNPROCESSABLE_ENTITY',
        message: 'Article failed publication validation',
        issues: [
          {
            code: 'MISSING_TERM_METADATA',
            message: 'An active term is missing required metadata.',
            entityId: termId,
          },
        ],
      }),
    )
    const user = userEvent.setup()
    renderContentPage()

    await screen.findByRole('heading', { name: 'Article content' })
    await user.click(
      await screen.findByRole('button', { name: 'Publish' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Publish article' })
    await user.click(
      within(dialog).getByRole('button', { name: 'Publish' }),
    )

    expect(
      await within(dialog).findByText(
        /active term is missing required metadata/i,
      ),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: 'Publish' }),
    ).toBeDisabled()
  })

  it('archives through the backend lifecycle endpoint', async () => {
    const archive = vi
      .spyOn(adminArticleContentApi, 'archive')
      .mockResolvedValue({
        id: articleId,
        status: 'ARCHIVED',
        archivedAt: '2026-07-24T10:00:00.000Z',
      })
    const user = userEvent.setup()
    renderContentPage()

    await screen.findByRole('heading', { name: 'Article content' })
    await user.click(
      await screen.findByRole('button', { name: 'Archive' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Archive article' })
    await user.click(
      within(dialog).getByRole('button', { name: 'Archive' }),
    )

    await waitFor(() => expect(archive).toHaveBeenCalledWith(articleId))
    expect(await screen.findByText('Article archived.')).toBeInTheDocument()
  })

  it('runs local CEFR vocabulary analysis and shows the assigned term level', async () => {
    const nlpTerm: ArticleTermListItem = {
      ...termListItem,
      wordDisplay: null,
      normalizedLemma: null,
      partOfSpeech: null,
      cefrLevel: 'B1',
      contextualMeaningVi: null,
      origin: 'NLP',
      reviewStatus: 'APPROVED',
      selectionReason: null,
      explanationStatus: 'PENDING',
      explanationGeneratedAt: null,
    }
    vi.mocked(adminArticleContentApi.listTerms).mockResolvedValue({
      items: [nlpTerm],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      contentVersion: 2,
    })
    const analyze = vi
      .spyOn(adminArticleContentApi, 'analyze')
      .mockResolvedValue({
        articleId,
        contentVersion: 2,
        aiAnalysisStatus: 'READY',
        category,
        cefrLevel: 'B1',
        candidateCount: 1,
      })
    const user = userEvent.setup()
    renderContentPage()

    await user.click(
      await screen.findByRole('button', { name: 'Analyze vocabulary' }),
    )
    expect(
      screen.getByText(/uses cefr-analyzer to set the article CEFR/i),
    ).toBeInTheDocument()
    const analysisDialog = screen.getByRole('dialog', {
      name: 'Analyze this draft',
    })
    await user.click(
      within(analysisDialog).getByRole('button', { name: 'Run analysis' }),
    )

    await waitFor(() => expect(analyze).toHaveBeenCalledWith(articleId))
    expect(
      await screen.findByText(
        /vocabulary analysis created 1 terms and set article CEFR to B1/i,
      ),
    ).toBeInTheDocument()
    await waitForElementToBeRemoved(analysisDialog)
    expect(await screen.findByText('Digital tools')).toBeInTheDocument()
    expect(screen.getByText('B1')).toBeInTheDocument()
    expect(adminArticleContentApi.listTerms).toHaveBeenLastCalledWith(
      articleId,
      expect.objectContaining({
        origin: 'NLP',
        reviewStatus: 'APPROVED',
      }),
    )
  })

  it('does not offer unsupported reanalysis after a draft is ready', async () => {
    vi.mocked(adminArticlesApi.detail).mockResolvedValue({
      ...articleDetail,
      article: {
        ...articleDetail.article,
        aiAnalysisStatus: 'READY',
      },
    })
    renderContentPage()

    await screen.findByRole('heading', { name: 'Article content' })
    expect(
      screen.queryByRole('button', { name: /analy/i }),
    ).not.toBeInTheDocument()
  })
})

describe('Admin article preview isolation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders only backend preview data without learning mutations', async () => {
    const preview = vi
      .spyOn(adminArticleContentApi, 'preview')
      .mockResolvedValue(previewData)
    const createTerm = vi.spyOn(adminArticleContentApi, 'createTerm')
    const updateSentence = vi.spyOn(
      adminArticleContentApi,
      'updateSentence',
    )

    renderWithProviders(
      <Routes>
        <Route
          path="/admin/articles/:articleId/preview"
          element={<AdminArticlePreviewPage />}
        />
      </Routes>,
      [`/admin/articles/${articleId}/preview?cefrLevel=B2`],
    )

    expect(
      await screen.findByRole('heading', {
        name: articleDetail.article.title,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('isolated-article-renderer'),
    ).toHaveTextContent('Digital tools improve access.')
    expect(
      screen.queryByRole('button', { name: /save vocabulary/i }),
    ).toBeNull()
    expect(preview).toHaveBeenCalledWith(articleId, 'B2')
    expect(createTerm).not.toHaveBeenCalled()
    expect(updateSentence).not.toHaveBeenCalled()
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  deleteNoContent: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}))

vi.mock('../src/config/apiClient', () => ({
  apiClient: {
    deleteNoContent: clientMocks.deleteNoContent,
    get: clientMocks.get,
    patch: clientMocks.patch,
    post: clientMocks.post,
  },
}))

import {
  adminArticleContentApi,
  sentenceListRequestParams,
  termListRequestParams,
} from '../src/api/AdminArticleContentApi'
import {
  articleTermFormSchema,
  toCreateArticleTermRequest,
  toUpdateArticleTermRequest,
  toUpdateArticleSentenceRequest,
} from '../src/schemas/admin-article-content'

describe('adminArticleContentApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clientMocks.get.mockResolvedValue({})
    clientMocks.post.mockResolvedValue({})
    clientMocks.patch.mockResolvedValue({})
    clientMocks.deleteNoContent.mockResolvedValue(undefined)
  })

  it('maps parsing, sentence, and term endpoints without creating IDs', async () => {
    await adminArticleContentApi.parse('article/id', { force: true })
    await adminArticleContentApi.listSentences('article/id', {
      page: 2,
      limit: 50,
      isActive: false,
    })
    await adminArticleContentApi.createTerm(
      'article/id',
      'sentence/id',
      {
        value: 'digital tools',
        wordDisplay: 'digital tools',
        lemma: 'digital tool',
        normalizedLemma: 'digital tool',
        unitType: 'PHRASE',
        partOfSpeech: 'noun phrase',
        cefrLevel: 'B1',
        contextualMeaningVi: 'công cụ số',
      },
    )
    await adminArticleContentApi.deleteTerm('article/id', 'term/id')

    expect(clientMocks.post).toHaveBeenNthCalledWith(
      1,
      '/admin/articles/article%2Fid/parse-content',
      { force: true },
    )
    expect(clientMocks.get).toHaveBeenCalledWith(
      '/admin/articles/article%2Fid/sentences',
      { params: { page: 2, limit: 50, isActive: false } },
    )
    expect(clientMocks.post).toHaveBeenNthCalledWith(
      2,
      '/admin/articles/article%2Fid/sentences/sentence%2Fid/terms',
      expect.not.objectContaining({
        id: expect.anything(),
        sentenceId: expect.anything(),
      }),
    )
    expect(clientMocks.deleteNoContent).toHaveBeenCalledWith(
      '/admin/articles/article%2Fid/terms/term%2Fid',
    )
  })

  it('maps preview simulation and all lifecycle endpoints', async () => {
    await adminArticleContentApi.preview('article-1', 'C1')
    await adminArticleContentApi.publish('article-1')
    await adminArticleContentApi.archive('article-1')
    await adminArticleContentApi.restoreDraft('article-1')

    expect(clientMocks.get).toHaveBeenCalledWith(
      '/admin/articles/article-1/preview',
      { params: { cefrLevel: 'C1' } },
    )
    expect(clientMocks.post.mock.calls).toEqual([
      ['/admin/articles/article-1/publish'],
      ['/admin/articles/article-1/archive'],
      ['/admin/articles/article-1/restore-draft'],
    ])
  })

  it('maps allowlisted sentence and term list filters', () => {
    expect(
      sentenceListRequestParams({
        page: 1,
        limit: 20,
        isActive: false,
      }),
    ).toEqual({ page: 1, limit: 20, isActive: false })

    expect(
      termListRequestParams({
        page: 3,
        limit: 10,
        sentenceId: 'sentence-1',
        cefrLevel: 'B2',
        unitType: 'PHRASE',
        isActive: true,
        q: 'digital',
      }),
    ).toEqual({
      page: 3,
      limit: 10,
      sentenceId: 'sentence-1',
      cefrLevel: 'B2',
      unitType: 'PHRASE',
      isActive: true,
      q: 'digital',
    })
  })
})

describe('article content DTO mapping', () => {
  it('maps only supported sentence metadata and never sentence text', () => {
    expect(
      toUpdateArticleSentenceRequest({
        translationVi: 'Bản dịch',
        explanationVi: 'Giải thích',
        referenceExplanation: '',
        skill: 'reading',
        isActive: true,
      }),
    ).toEqual({
      translationVi: 'Bản dịch',
      explanationVi: 'Giải thích',
      skill: 'reading',
      isActive: true,
    })
  })

  it('maps structured term arrays and examples to the exact create DTO', () => {
    const values = articleTermFormSchema.parse({
      value: '  digital tools  ',
      wordDisplay: 'Digital tools',
      lemma: 'digital tool',
      normalizedLemma: '  Digital Tool  ',
      unitType: 'PHRASE',
      partOfSpeech: 'noun phrase',
      ipa: '',
      cefrLevel: 'B1',
      contextualMeaningVi: '  công cụ số  ',
      definitionEn: 'Electronic resources.',
      contextualExplanation: '',
      synonyms: ['technology tools'],
      antonyms: [],
      collocations: ['use digital tools'],
      relatedTerms: [],
      vocabularyTopic: 'technology',
      examples: [
        {
          sentence: 'Digital tools improve access.',
          translationVi: 'Công cụ số cải thiện khả năng tiếp cận.',
        },
      ],
      skill: '',
      isLookupEnabled: true,
      isActive: true,
    })

    expect(toCreateArticleTermRequest(values)).toEqual({
      value: 'digital tools',
      wordDisplay: 'Digital tools',
      lemma: 'digital tool',
      normalizedLemma: 'digital tool',
      unitType: 'PHRASE',
      partOfSpeech: 'noun phrase',
      cefrLevel: 'B1',
      contextualMeaningVi: 'công cụ số',
      definitionEn: 'Electronic resources.',
      synonyms: ['technology tools'],
      antonyms: [],
      collocations: ['use digital tools'],
      relatedTerms: [],
      vocabularyTopic: 'technology',
      examples: [
        {
          sentence: 'Digital tools improve access.',
          translationVi: 'Công cụ số cải thiện khả năng tiếp cận.',
        },
      ],
      isLookupEnabled: true,
      isActive: true,
    })

    const metadataChange = articleTermFormSchema.parse({
      ...values,
      contextualMeaningVi: 'nguồn lực kỹ thuật số',
      synonyms: ['technology tools', 'electronic tools'],
    })
    expect(toUpdateArticleTermRequest(metadataChange, values)).toEqual({
      contextualMeaningVi: 'nguồn lực kỹ thuật số',
      synonyms: ['technology tools', 'electronic tools'],
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/config/apiClient', () => ({
  apiClient: {
    get: clientMocks.get,
    post: clientMocks.post,
  },
}))

import { readingApi } from '@/api/Reading/ReadingApi'
import { vocabulariesApi } from '@/api/Vocabulary/VocabulariesApi'
import { toSaveVocabularyRequest } from '@/schemas/Vocabulary/vocabulary'

describe('contextual vocabulary API mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds the lookup URL from encoded article and contextual term IDs', async () => {
    const signal = new AbortController().signal
    clientMocks.get.mockResolvedValue({
      term: { id: 'term/id' },
      parentSentence: { id: 'sentence-id' },
      saveState: { isSaved: false },
    })

    await readingApi.term('article/id', 'term/id', signal)

    expect(clientMocks.get).toHaveBeenCalledWith(
      '/reading/articles/article%2Fid/terms/term%2Fid',
      { signal },
    )
  })

  it('sends only the stable term ID and selected collections', async () => {
    clientMocks.post.mockResolvedValue({
      vocabulary: { id: 'vocabulary-id' },
      collections: [],
    })
    const request = toSaveVocabularyRequest('term-id', {
      collectionIds: ['550e8400-e29b-41d4-a716-446655440010'],
    })

    await vocabulariesApi.save(request)

    expect(clientMocks.post).toHaveBeenCalledWith('/vocabularies', {
      articleSentenceTermId: 'term-id',
      collectionIds: ['550e8400-e29b-41d4-a716-446655440010'],
    })
  })

  it('maps the selected collections without extra fields', () => {
    expect(
      toSaveVocabularyRequest('term-id', {
        collectionIds: ['550e8400-e29b-41d4-a716-446655440010'],
      }),
    ).toEqual({
      articleSentenceTermId: 'term-id',
      collectionIds: ['550e8400-e29b-41d4-a716-446655440010'],
    })
  })
})

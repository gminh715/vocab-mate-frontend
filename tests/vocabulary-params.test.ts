import { describe, expect, it } from 'vitest'
import {
  normalizeVocabularySearchParams,
  vocabularyParamsFromSearchParams,
  vocabularySearchParamsFromParams,
} from '@/utils/Vocabulary/vocabularyParams'

describe('vocabulary search params mapping', () => {
  it('maps valid URL search parameters to API query parameters', () => {
    const searchParams = new URLSearchParams(
      'page=2&limit=50&q=harmful&learningStatus=LEARNING&cefrLevel=B2&collectionId=550e8400-e29b-41d4-a716-446655440010&dueOnly=true&sort=oldest',
    )

    expect(vocabularyParamsFromSearchParams(searchParams)).toEqual({
      page: 2,
      limit: 50,
      q: 'harmful',
      learningStatus: 'LEARNING',
      cefrLevel: 'B2',
      collectionId: '550e8400-e29b-41d4-a716-446655440010',
      dueOnly: true,
      sort: 'oldest',
    })
  })

  it('normalizes invalid parameters and applies default values', () => {
    const invalidSearchParams = new URLSearchParams(
      'page=-5&limit=999&learningStatus=INVALID&cefrLevel=Z1&collectionId=not-a-uuid&dueOnly=maybe&sort=invalid',
    )

    expect(vocabularyParamsFromSearchParams(invalidSearchParams)).toEqual({
      page: 1,
      limit: 20,
      sort: 'newest',
    })

    expect(normalizeVocabularySearchParams(invalidSearchParams).toString()).toBe('')
  })

  it('serializes parameter object cleanly to URLSearchParams omitting defaults', () => {
    const params = {
      page: 1,
      limit: 20,
      q: 'climate',
      learningStatus: 'NEW' as const,
      sort: 'newest' as const,
    }

    const searchParams = vocabularySearchParamsFromParams(params)
    expect(searchParams.toString()).toBe('q=climate&learningStatus=NEW')
  })

  it('preserves page number and custom limit when non-default', () => {
    const params = {
      page: 3,
      limit: 10,
      sort: 'oldest' as const,
    }

    const searchParams = vocabularySearchParamsFromParams(params)
    expect(searchParams.toString()).toBe('page=3&limit=10&sort=oldest')
  })
})

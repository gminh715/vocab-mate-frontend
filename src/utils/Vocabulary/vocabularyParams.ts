import { CEFR_LEVELS, type CefrLevel } from '@/types/Auth/auth'
import {
  VOCABULARY_SORTS,
  type GetCollectionItemsQueryParams,
  type GetVocabulariesQueryParams,
  type VocabularySort,
} from '@/types/Vocabulary/vocabulary'

export const DEFAULT_VOCABULARY_LIMIT = 20
export const VOCABULARY_LIMIT_OPTIONS = [10, 20, 50, 100] as const

const includes = <T extends string>(
  values: readonly T[],
  value: string | null,
): value is T => value !== null && values.includes(value as T)

const pageFromValue = (value: string | null): number => {
  if (!value || !/^\d+$/.test(value)) return 1

  const page = Number(value)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

const limitFromValue = (value: string | null): number => {
  if (!value || !/^\d+$/.test(value)) return DEFAULT_VOCABULARY_LIMIT

  const limit = Number(value)
  return VOCABULARY_LIMIT_OPTIONS.includes(
    limit as (typeof VOCABULARY_LIMIT_OPTIONS)[number],
  )
    ? limit
    : DEFAULT_VOCABULARY_LIMIT
}

const isUuid = (value: string | null): boolean =>
  value !== null &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export const vocabularyParamsFromSearchParams = (
  searchParams: URLSearchParams,
): GetVocabulariesQueryParams => {
  const qValue = searchParams.get('q')?.trim()
  const cefrValue = searchParams.get('cefrLevel')
  const collectionValue = searchParams.get('collectionId')
  const sortValue = searchParams.get('sort')

  const q = qValue ? qValue : undefined
  const cefrLevel = includes(CEFR_LEVELS, cefrValue)
    ? (cefrValue as CefrLevel)
    : undefined
  const collectionId = isUuid(collectionValue)
    ? collectionValue!
    : undefined
  const sort = includes(VOCABULARY_SORTS, sortValue)
    ? (sortValue as VocabularySort)
    : 'newest'

  return {
    page: pageFromValue(searchParams.get('page')),
    limit: limitFromValue(searchParams.get('limit')),
    ...(q ? { q } : {}),
    ...(!collectionId && cefrLevel ? { cefrLevel } : {}),
    ...(collectionId ? { collectionId } : {}),
    sort,
  }
}

export const collectionItemsParamsFromVocabularyParams = (
  params: GetVocabulariesQueryParams,
): GetCollectionItemsQueryParams => ({
  page: params.page,
  limit: params.limit,
  ...(params.q ? { q: params.q } : {}),
  sort: params.sort,
})

export const vocabularySearchParamsFromParams = (
  params: GetVocabulariesQueryParams,
): URLSearchParams => {
  const searchParams = new URLSearchParams()

  if (params.page !== 1) searchParams.set('page', String(params.page))
  if (params.limit !== DEFAULT_VOCABULARY_LIMIT) {
    searchParams.set('limit', String(params.limit))
  }
  if (params.q) searchParams.set('q', params.q)
  if (params.cefrLevel) searchParams.set('cefrLevel', params.cefrLevel)
  if (params.collectionId) searchParams.set('collectionId', params.collectionId)
  if (params.sort !== 'newest') searchParams.set('sort', params.sort)

  return searchParams
}

export const normalizeVocabularySearchParams = (
  searchParams: URLSearchParams,
): URLSearchParams =>
  vocabularySearchParamsFromParams(
    vocabularyParamsFromSearchParams(searchParams),
  )

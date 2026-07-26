import {
  READING_HISTORY_SORTS,
  READING_STATUSES,
  type ReadingHistoryParams,
  type ReadingHistorySort,
  type ReadingStatus,
} from '@/types/Reading/reading'

export const READING_HISTORY_PAGE_SIZE = 10

const includes = <T extends string>(
  values: readonly T[],
  value: string | null,
): value is T => value !== null && values.includes(value as T)

const pageFromValue = (value: string | null): number => {
  if (!value || !/^\d+$/.test(value)) return 1

  const page = Number(value)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

export const readingHistoryParamsFromSearchParams = (
  searchParams: URLSearchParams,
): ReadingHistoryParams => {
  const statusValue = searchParams.get('status')
  const sortValue = searchParams.get('sort')
  const status = includes(READING_STATUSES, statusValue)
    ? (statusValue as ReadingStatus)
    : undefined
  const sort = includes(READING_HISTORY_SORTS, sortValue)
    ? (sortValue as ReadingHistorySort)
    : 'newest'

  return {
    page: pageFromValue(searchParams.get('page')),
    limit: READING_HISTORY_PAGE_SIZE,
    ...(status ? { status } : {}),
    sort,
  }
}

export const readingHistorySearchParamsFromParams = (
  params: ReadingHistoryParams,
): URLSearchParams => {
  const searchParams = new URLSearchParams()

  if (params.page !== 1) searchParams.set('page', String(params.page))
  if (params.status) searchParams.set('status', params.status)
  if (params.sort !== 'newest') searchParams.set('sort', params.sort)

  return searchParams
}

export const normalizeReadingHistorySearchParams = (
  searchParams: URLSearchParams,
): URLSearchParams =>
  readingHistorySearchParamsFromParams(
    readingHistoryParamsFromSearchParams(searchParams),
  )

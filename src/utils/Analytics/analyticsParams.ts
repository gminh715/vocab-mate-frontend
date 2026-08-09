import {
  ANALYTICS_GROUP_BY_VALUES,
  ANALYTICS_SECTIONS,
  type AnalyticsDateFilters,
  type AnalyticsFilters,
  type AnalyticsGroupBy,
  type AnalyticsOverviewParams,
  type AnalyticsSection,
  type QuizAnalyticsParams,
  type VocabularyAnalyticsParams,
} from '@/types/Analytics/analytics'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const DAY_MS = 86_400_000
const MAX_RANGE_DAYS = 366

const includes = <T extends string>(
  values: readonly T[],
  value: string | null,
): value is T => value !== null && values.includes(value as T)

const isCalendarDate = (value: string | null): value is string => {
  if (!value || !DATE_PATTERN.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const localDateToIso = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toISOString()
}

export const analyticsFiltersFromSearchParams = (
  searchParams: URLSearchParams,
): AnalyticsFilters => {
  const rawFrom = searchParams.get('from')
  const rawTo = searchParams.get('to')
  const rawGroupBy = searchParams.get('groupBy')
  const rawArticleId = searchParams.get('articleId')?.trim() ?? ''
  const rawSection = searchParams.get('section')

  return {
    ...(isCalendarDate(rawFrom) ? { from: rawFrom } : {}),
    ...(isCalendarDate(rawTo) ? { to: rawTo } : {}),
    ...(includes(ANALYTICS_GROUP_BY_VALUES, rawGroupBy)
      ? { groupBy: rawGroupBy as AnalyticsGroupBy }
      : {}),
    ...(UUID_PATTERN.test(rawArticleId) ? { articleId: rawArticleId } : {}),
    ...(includes(ANALYTICS_SECTIONS, rawSection)
      ? { section: rawSection as AnalyticsSection }
      : {}),
  }
}

export const analyticsSearchParamsFromFilters = (
  filters: AnalyticsFilters,
): URLSearchParams => {
  const searchParams = new URLSearchParams()

  if (filters.from) searchParams.set('from', filters.from)
  if (filters.to) searchParams.set('to', filters.to)
  if (filters.groupBy) searchParams.set('groupBy', filters.groupBy)
  if (filters.articleId) searchParams.set('articleId', filters.articleId)
  if (filters.section && filters.section !== 'vocabulary') {
    searchParams.set('section', filters.section)
  }

  return searchParams
}

export const normalizeAnalyticsSearchParams = (
  searchParams: URLSearchParams,
): URLSearchParams =>
  analyticsSearchParamsFromFilters(
    analyticsFiltersFromSearchParams(searchParams),
  )

export const analyticsDateRangeError = (
  filters: AnalyticsDateFilters,
): string | null => {
  if (!filters.from || !filters.to) return null

  const from = new Date(`${filters.from}T00:00:00`)
  const to = new Date(`${filters.to}T00:00:00`)

  if (from >= to) {
    return 'The end date is exclusive and must be after the start date.'
  }
  if ((to.getTime() - from.getTime()) / DAY_MS > MAX_RANGE_DAYS) {
    return 'Analytics date ranges cannot exceed 366 days.'
  }

  return null
}

export const analyticsRequestParams = (
  filters: AnalyticsDateFilters,
): AnalyticsOverviewParams => ({
  ...(filters.from ? { from: localDateToIso(filters.from) } : {}),
  ...(filters.to ? { to: localDateToIso(filters.to) } : {}),
})

export const vocabularyAnalyticsRequestParams = (
  filters: AnalyticsFilters,
): VocabularyAnalyticsParams => ({
  ...analyticsRequestParams(filters),
  ...(filters.groupBy ? { groupBy: filters.groupBy } : {}),
})

export const quizAnalyticsRequestParams = (
  filters: AnalyticsFilters,
): QuizAnalyticsParams => ({
  ...analyticsRequestParams(filters),
  ...(filters.articleId ? { articleId: filters.articleId } : {}),
})

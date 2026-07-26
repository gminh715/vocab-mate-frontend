import { USER_STATUSES, type UserStatus } from '@/types/Auth/auth'
import type {
  AdminAnalyticsFilters,
  AnalyticsDateFilters,
  AnalyticsRequestParams,
  ContentAnalyticsRequestParams,
  UserAnalyticsRequestParams,
} from '@/types/Admin/adminAnalytics'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u
const DAY_MS = 86_400_000
const MAX_RANGE_DAYS = 366

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

export const adminAnalyticsFiltersFromSearchParams = (
  searchParams: URLSearchParams,
): AdminAnalyticsFilters => {
  const rawFrom = searchParams.get('from')
  const rawTo = searchParams.get('to')
  const categoryId = searchParams.get('categoryId')?.trim()
  const rawStatus = searchParams.get('status')
  const status = USER_STATUSES.includes(rawStatus as UserStatus)
    ? (rawStatus as UserStatus)
    : undefined

  return {
    ...(isCalendarDate(rawFrom) ? { from: rawFrom } : {}),
    ...(isCalendarDate(rawTo) ? { to: rawTo } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status } : {}),
  }
}

export const analyticsDateRangeError = (
  filters: AnalyticsDateFilters,
): string | null => {
  if (!filters.from || !filters.to) return null

  const from = new Date(`${filters.from}T00:00:00`)
  const to = new Date(`${filters.to}T00:00:00`)
  if (from >= to) return 'The exclusive end date must be after the start date.'
  if ((to.getTime() - from.getTime()) / DAY_MS > MAX_RANGE_DAYS) {
    return 'Analytics date ranges cannot exceed 366 days.'
  }
  return null
}

export const analyticsRequestParams = (
  filters: AnalyticsDateFilters,
): AnalyticsRequestParams => ({
  ...(filters.from ? { from: localDateToIso(filters.from) } : {}),
  ...(filters.to ? { to: localDateToIso(filters.to) } : {}),
})

export const contentAnalyticsRequestParams = (
  filters: AdminAnalyticsFilters,
): ContentAnalyticsRequestParams => ({
  ...analyticsRequestParams(filters),
  ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
})

export const userAnalyticsRequestParams = (
  filters: AdminAnalyticsFilters,
): UserAnalyticsRequestParams => ({
  ...analyticsRequestParams(filters),
  ...(filters.status ? { status: filters.status } : {}),
})

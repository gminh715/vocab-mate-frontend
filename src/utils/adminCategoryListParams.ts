import type { AdminCategoryListParams } from '../types/admin-categories'

const boundedInteger = (
  value: string | null,
  fallback: number,
  maximum = Number.POSITIVE_INFINITY,
): number => {
  if (!value) return fallback

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum
    ? parsed
    : fallback
}

export const adminCategoryListParamsFromSearchParams = (
  searchParams: URLSearchParams,
): AdminCategoryListParams => {
  const q = searchParams.get('q')?.trim()
  const activeValue = searchParams.get('isActive')
  const isActive =
    activeValue === 'true'
      ? true
      : activeValue === 'false'
        ? false
        : undefined

  return {
    page: boundedInteger(searchParams.get('page'), 1),
    limit: boundedInteger(searchParams.get('limit'), 20, 100),
    ...(q ? { q } : {}),
    ...(isActive === undefined ? {} : { isActive }),
  }
}

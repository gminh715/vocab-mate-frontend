import { CEFR_LEVELS, type CefrLevel } from '../types/auth'
import {
  ADMIN_ARTICLE_SORTS,
  ARTICLE_STATUSES,
  type AdminArticleListParams,
  type AdminArticleSort,
  type ArticleStatus,
} from '../types/admin-articles'

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

const includes = <T extends string>(
  values: readonly T[],
  value: string | null,
): value is T => value !== null && values.includes(value as T)

export const adminArticleListParamsFromSearchParams = (
  searchParams: URLSearchParams,
): AdminArticleListParams => {
  const q = searchParams.get('q')?.trim()
  const categoryId = searchParams.get('categoryId')?.trim()
  const cefrValue = searchParams.get('cefrLevel')
  const statusValue = searchParams.get('status')
  const sortValue = searchParams.get('sort')

  const cefrLevel = includes(CEFR_LEVELS, cefrValue)
    ? (cefrValue as CefrLevel)
    : undefined
  const status = includes(ARTICLE_STATUSES, statusValue)
    ? (statusValue as ArticleStatus)
    : undefined
  const sort = includes(ADMIN_ARTICLE_SORTS, sortValue)
    ? (sortValue as AdminArticleSort)
    : 'newest'

  return {
    page: boundedInteger(searchParams.get('page'), 1),
    limit: boundedInteger(searchParams.get('limit'), 20, 100),
    ...(q ? { q } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(cefrLevel ? { cefrLevel } : {}),
    ...(status ? { status } : {}),
    sort,
  }
}

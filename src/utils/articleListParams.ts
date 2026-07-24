import {
  ARTICLE_SORTS,
  type ArticleListParams,
  type ArticleSort,
} from '../types/articles'
import { CEFR_LEVELS, type CefrLevel } from '../types/auth'

export const ARTICLE_PAGE_SIZE = 12

const categorySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const includes = <T extends string>(
  values: readonly T[],
  value: string | null,
): value is T => value !== null && values.includes(value as T)

const pageFromValue = (value: string | null): number => {
  if (!value || !/^\d+$/.test(value)) return 1

  const page = Number(value)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

export const articleListParamsFromSearchParams = (
  searchParams: URLSearchParams,
): ArticleListParams => {
  const searchValue = searchParams.get('q')?.trim()
  const q =
    searchValue && searchValue.length <= 320 ? searchValue : undefined
  const categoryValue = searchParams.get('category')?.trim().toLowerCase()
  const categorySlug =
    categoryValue && categorySlugPattern.test(categoryValue)
      ? categoryValue
      : undefined
  const cefrValue = searchParams.get('cefr')
  const sortValue = searchParams.get('sort')
  const cefrLevel = includes(CEFR_LEVELS, cefrValue)
    ? (cefrValue as CefrLevel)
    : undefined
  const sort = includes(ARTICLE_SORTS, sortValue)
    ? (sortValue as ArticleSort)
    : 'newest'

  return {
    page: pageFromValue(searchParams.get('page')),
    limit: ARTICLE_PAGE_SIZE,
    ...(q ? { q } : {}),
    ...(categorySlug ? { categorySlug } : {}),
    ...(cefrLevel ? { cefrLevel } : {}),
    sort,
  }
}

export const articleSearchParamsFromListParams = (
  params: ArticleListParams,
): URLSearchParams => {
  const searchParams = new URLSearchParams()

  if (params.page !== 1) searchParams.set('page', String(params.page))
  if (params.q) searchParams.set('q', params.q)
  if (params.categorySlug) {
    searchParams.set('category', params.categorySlug)
  }
  if (params.cefrLevel) searchParams.set('cefr', params.cefrLevel)
  if (params.sort !== 'newest') searchParams.set('sort', params.sort)

  return searchParams
}

export const normalizeArticleSearchParams = (
  searchParams: URLSearchParams,
): URLSearchParams =>
  articleSearchParamsFromListParams(
    articleListParamsFromSearchParams(searchParams),
  )


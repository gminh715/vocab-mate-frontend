import { queryOptions, useQuery } from '@tanstack/react-query'
import {
  categoriesApi,
  type CategoryListParams,
} from '../api/CategoriesApi'

export const categoryQueryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryQueryKeys.all, 'list'] as const,
  list: (params: CategoryListParams) =>
    [...categoryQueryKeys.lists(), params] as const,
  details: () => [...categoryQueryKeys.all, 'detail'] as const,
  detail: (slug: string) =>
    [...categoryQueryKeys.details(), slug] as const,
}

export const categoryListQueryOptions = (
  params: CategoryListParams = {},
) =>
  queryOptions({
    queryKey: categoryQueryKeys.list(params),
    queryFn: () => categoriesApi.list(params),
    staleTime: 5 * 60_000,
    retry: false,
  })

export const categoryDetailQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: categoryQueryKeys.detail(slug),
    queryFn: () => categoriesApi.detail(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60_000,
    retry: false,
  })

export const useCategoryListQuery = (
  params: CategoryListParams = {},
) => useQuery(categoryListQueryOptions(params))

export const useCategoryDetailQuery = (slug: string) =>
  useQuery(categoryDetailQueryOptions(slug))

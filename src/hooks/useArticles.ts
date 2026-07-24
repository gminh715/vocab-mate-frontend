import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from '@tanstack/react-query'
import { articlesApi } from '../api/ArticlesApi'
import type { ArticleListParams } from '../types/articles'

export const articleQueryKeys = {
  all: ['articles'] as const,
  lists: () => [...articleQueryKeys.all, 'list'] as const,
  list: (params: ArticleListParams) =>
    [...articleQueryKeys.lists(), params] as const,
  details: () => [...articleQueryKeys.all, 'detail'] as const,
  detail: (slug: string) =>
    [...articleQueryKeys.details(), slug] as const,
}

export const articleListQueryOptions = (params: ArticleListParams) =>
  queryOptions({
    queryKey: articleQueryKeys.list(params),
    queryFn: () => articlesApi.list(params),
    placeholderData: keepPreviousData,
    retry: false,
  })

export const useArticleListQuery = (params: ArticleListParams) =>
  useQuery(articleListQueryOptions(params))

export const articleDetailQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: articleQueryKeys.detail(slug),
    queryFn: () => articlesApi.detail(slug),
    enabled: Boolean(slug),
    retry: false,
  })

export const useArticleDetailQuery = (slug: string) =>
  useQuery(articleDetailQueryOptions(slug))

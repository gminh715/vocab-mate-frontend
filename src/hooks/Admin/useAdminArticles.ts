import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { adminArticlesApi } from '@/api/Admin/AdminArticlesApi'
import type {
  AdminArticleListParams,
  CreateArticleRequest,
  UpdateArticleRequest,
} from '@/types/Admin/adminArticles'

export const adminArticleQueryKeys = {
  all: ['/adminArticles'] as const,
  lists: () => [...adminArticleQueryKeys.all, 'list'] as const,
  list: (params: AdminArticleListParams) =>
    [...adminArticleQueryKeys.lists(), params] as const,
  details: () => [...adminArticleQueryKeys.all, 'detail'] as const,
  detail: (articleId: string) =>
    [...adminArticleQueryKeys.details(), articleId] as const,
}

export const adminArticleListQueryOptions = (
  params: AdminArticleListParams,
) =>
  queryOptions({
    queryKey: adminArticleQueryKeys.list(params),
    queryFn: () => adminArticlesApi.list(params),
    placeholderData: keepPreviousData,
    retry: false,
  })

export const adminArticleDetailQueryOptions = (articleId: string) =>
  queryOptions({
    queryKey: adminArticleQueryKeys.detail(articleId),
    queryFn: () => adminArticlesApi.detail(articleId),
    enabled: Boolean(articleId),
    retry: false,
  })

export const useAdminArticleListQuery = (
  params: AdminArticleListParams,
) => useQuery(adminArticleListQueryOptions(params))

export const useAdminArticleDetailQuery = (articleId: string) =>
  useQuery(adminArticleDetailQueryOptions(articleId))

export const useCreateAdminArticleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateArticleRequest) =>
      adminArticlesApi.create(request),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminArticleQueryKeys.lists(),
      }),
    retry: false,
  })
}

export const useUpdateAdminArticleMutation = (articleId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateArticleRequest) =>
      adminArticlesApi.update(articleId, request),
    onSuccess: (data) => {
      queryClient.setQueryData(
        adminArticleQueryKeys.detail(articleId),
        (current: unknown) => {
          if (
            typeof current !== 'object' ||
            current === null ||
            !('sentenceCount' in current) ||
            !('termCount' in current)
          ) {
            return current
          }

          return {
            ...current,
            article: data.article,
            ...(data.contentChanged
              ? { sentenceCount: 0, termCount: 0 }
              : {}),
          }
        },
      )
      void queryClient.invalidateQueries({
        queryKey: adminArticleQueryKeys.lists(),
      })
      void queryClient.invalidateQueries({
        queryKey: adminArticleQueryKeys.detail(articleId),
      })
    },
    retry: false,
  })
}

export const useDeleteAdminArticleMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminArticlesApi.delete,
    onSuccess: (_, articleId) => {
      queryClient.removeQueries({
        queryKey: adminArticleQueryKeys.detail(articleId),
      })
      void queryClient.invalidateQueries({
        queryKey: adminArticleQueryKeys.lists(),
      })
    },
    retry: false,
  })
}

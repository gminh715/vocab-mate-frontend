import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { adminNewsApi } from '@/api/Admin/AdminNewsApi'
import { adminArticleQueryKeys } from '@/hooks/Admin/useAdminArticles'
import type {
  AdminNewsSearchParams,
  AdminNewsSyncRequest,
} from '@/types/Admin/adminNews'

export const adminNewsQueryKeys = {
  all: ['/adminNews'] as const,
  searches: () => [...adminNewsQueryKeys.all, 'search'] as const,
  search: (params: AdminNewsSearchParams) =>
    [...adminNewsQueryKeys.searches(), params] as const,
}

export const adminNewsSearchQueryOptions = (
  params: AdminNewsSearchParams,
) =>
  queryOptions({
    queryKey: adminNewsQueryKeys.search(params),
    queryFn: () => adminNewsApi.search(params),
    enabled: Boolean(params.q || params.section),
    placeholderData: keepPreviousData,
    retry: false,
  })

export const useAdminNewsSearchQuery = (
  params: AdminNewsSearchParams,
) => useQuery(adminNewsSearchQueryOptions(params))

export const useAdminNewsSyncMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: AdminNewsSyncRequest) =>
      adminNewsApi.sync(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminArticleQueryKeys.lists(),
      })
    },
    retry: false,
  })
}

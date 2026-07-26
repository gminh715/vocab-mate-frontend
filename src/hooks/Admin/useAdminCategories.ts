import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { adminCategoriesApi } from '@/api/Admin/AdminCategoriesApi'
import type {
  AdminCategoryListParams,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/Admin/adminCategories'
import { categoryQueryKeys } from '@/hooks/Article/useCategories'

export { categoryQueryKeys } from '@/hooks/Article/useCategories'

export const adminCategoryQueryKeys = {
  all: ['/adminCategories'] as const,
  lists: () => [...adminCategoryQueryKeys.all, 'list'] as const,
  list: (params: AdminCategoryListParams) =>
    [...adminCategoryQueryKeys.lists(), params] as const,
  details: () => [...adminCategoryQueryKeys.all, 'detail'] as const,
  detail: (categoryId: string) =>
    [...adminCategoryQueryKeys.details(), categoryId] as const,
}

export const adminCategoryListQueryOptions = (
  params: AdminCategoryListParams,
) =>
  queryOptions({
    queryKey: adminCategoryQueryKeys.list(params),
    queryFn: () => adminCategoriesApi.list(params),
    placeholderData: keepPreviousData,
    retry: false,
  })

export const adminCategoryDetailQueryOptions = (categoryId: string) =>
  queryOptions({
    queryKey: adminCategoryQueryKeys.detail(categoryId),
    queryFn: () => adminCategoriesApi.detail(categoryId),
    enabled: Boolean(categoryId),
    retry: false,
  })

export const adminCategoryOptionsQueryOptions = (isActive?: boolean) =>
  queryOptions({
    queryKey: [
      ...adminCategoryQueryKeys.all,
      'options',
      isActive ?? 'all',
    ] as const,
    queryFn: async () => {
      const baseParams = { limit: 100, ...(isActive === undefined
        ? {}
        : { isActive }) }
      const firstPage = await adminCategoriesApi.list({
        ...baseParams,
        page: 1,
      })

      if (firstPage.meta.totalPages <= 1) return firstPage.items

      const remainingPages = await Promise.all(
        Array.from(
          { length: firstPage.meta.totalPages - 1 },
          (_, index) =>
            adminCategoriesApi.list({
              ...baseParams,
              page: index + 2,
            }),
        ),
      )

      return [
        ...firstPage.items,
        ...remainingPages.flatMap((page) => page.items),
      ]
    },
    staleTime: 60_000,
    retry: false,
  })

export const useAdminCategoryListQuery = (
  params: AdminCategoryListParams,
) => useQuery(adminCategoryListQueryOptions(params))

export const useAdminCategoryDetailQuery = (categoryId: string) =>
  useQuery(adminCategoryDetailQueryOptions(categoryId))

export const useAdminCategoryOptionsQuery = (isActive?: boolean) =>
  useQuery(adminCategoryOptionsQueryOptions(isActive))

const useInvalidateCategoryQueries = () => {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({
      queryKey: adminCategoryQueryKeys.all,
    })
    void queryClient.invalidateQueries({
      queryKey: categoryQueryKeys.all,
    })
  }
}

export const useCreateAdminCategoryMutation = () => {
  const invalidateCategoryQueries = useInvalidateCategoryQueries()

  return useMutation({
    mutationFn: (request: CreateCategoryRequest) =>
      adminCategoriesApi.create(request),
    onSuccess: invalidateCategoryQueries,
    retry: false,
  })
}

export const useUpdateAdminCategoryMutation = (categoryId: string) => {
  const invalidateCategoryQueries = useInvalidateCategoryQueries()

  return useMutation({
    mutationFn: (request: UpdateCategoryRequest) =>
      adminCategoriesApi.update(categoryId, request),
    onSuccess: invalidateCategoryQueries,
    retry: false,
  })
}

export const useUpdateAdminCategoryStatusMutation = () => {
  const invalidateCategoryQueries = useInvalidateCategoryQueries()

  return useMutation({
    mutationFn: ({
      categoryId,
      isActive,
    }: {
      categoryId: string
      isActive: boolean
    }) => adminCategoriesApi.updateStatus(categoryId, isActive),
    onSuccess: invalidateCategoryQueries,
    retry: false,
  })
}

export const useDeleteAdminCategoryMutation = () => {
  const queryClient = useQueryClient()
  const invalidateCategoryQueries = useInvalidateCategoryQueries()

  return useMutation({
    mutationFn: adminCategoriesApi.delete,
    onSuccess: (_, categoryId) => {
      queryClient.removeQueries({
        queryKey: adminCategoryQueryKeys.detail(categoryId),
      })
      invalidateCategoryQueries()
    },
    retry: false,
  })
}

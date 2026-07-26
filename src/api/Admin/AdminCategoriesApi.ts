import { ApiError, apiClient } from '@/config/apiClient'
import type {
  AdminCategoryDetail,
  AdminCategoryListData,
  AdminCategoryListParams,
  CategoryMutationData,
  CategoryStatusData,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/Admin/adminCategories'
import type { PaginationMeta } from '@/types/Admin/adminUsers'

const adminCategoriesPath = '/admin/categories'

const listRequestParams = (params: AdminCategoryListParams) => ({
  page: params.page,
  limit: params.limit,
  ...(params.q ? { q: params.q } : {}),
  ...(params.isActive === undefined
    ? {}
    : { isActive: params.isActive }),
})

export const adminCategoriesApi = {
  async list(
    params: AdminCategoryListParams,
  ): Promise<AdminCategoryListData> {
    const response = await apiClient.getWithMeta<
      { items: AdminCategoryListData['items'] },
      PaginationMeta
    >(adminCategoriesPath, {
      params: listRequestParams(params),
    })

    if (!response.meta) {
      throw new ApiError({
        status: 0,
        code: 'INVALID_RESPONSE',
        message: 'Category pagination data is missing.',
      })
    }

    return {
      items: response.data.items,
      meta: response.meta,
    }
  },

  detail: (categoryId: string): Promise<AdminCategoryDetail> =>
    apiClient.get<AdminCategoryDetail>(
      `${adminCategoriesPath}/${encodeURIComponent(categoryId)}`,
    ),

  create: (
    request: CreateCategoryRequest,
  ): Promise<CategoryMutationData> =>
    apiClient.post<CategoryMutationData>(adminCategoriesPath, request),

  update: (
    categoryId: string,
    request: UpdateCategoryRequest,
  ): Promise<CategoryMutationData> =>
    apiClient.patch<CategoryMutationData>(
      `${adminCategoriesPath}/${encodeURIComponent(categoryId)}`,
      request,
    ),

  updateStatus: (
    categoryId: string,
    isActive: boolean,
  ): Promise<CategoryStatusData> =>
    apiClient.patch<CategoryStatusData>(
      `${adminCategoriesPath}/${encodeURIComponent(categoryId)}/status`,
      { isActive },
    ),

  delete: (categoryId: string): Promise<void> =>
    apiClient.deleteNoContent(
      `${adminCategoriesPath}/${encodeURIComponent(categoryId)}`,
    ),
}

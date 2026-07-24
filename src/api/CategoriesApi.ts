import { apiClient } from '../config/apiClient'
import type { PublicCategory } from '../types/admin-categories'

export interface CategoryListParams {
  q?: string
}

export interface CategoryListData {
  items: PublicCategory[]
}

export interface CategoryDetailData {
  category: PublicCategory
}

export const categoriesApi = {
  list: (params: CategoryListParams = {}): Promise<CategoryListData> =>
    apiClient.get<CategoryListData>('/categories', {
      params: params.q ? { q: params.q } : {},
    }),

  detail: (slug: string): Promise<CategoryDetailData> =>
    apiClient.get<CategoryDetailData>(
      `/categories/${encodeURIComponent(slug)}`,
    ),
}


import type { PaginationMeta } from './admin-users'

export interface PublicCategory {
  id: string
  name: string
  slug: string
}

export interface AdminCategory extends PublicCategory {
  description: string | null
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface AdminCategoryListParams {
  page: number
  limit: number
  q?: string
  isActive?: boolean
}

export interface AdminCategoryListData {
  items: AdminCategory[]
  meta: PaginationMeta
}

export interface AdminCategoryDetail {
  category: AdminCategory
  articleCount: number
}

export interface CreateCategoryRequest {
  name: string
  slug: string
  description?: string
  isActive?: boolean
  displayOrder?: number
}

export interface UpdateCategoryRequest {
  name?: string
  slug?: string
  description?: string
  displayOrder?: number
}

export interface CategoryMutationData {
  category: PublicCategory
}

export interface CategoryStatusData {
  id: string
  isActive: boolean
}

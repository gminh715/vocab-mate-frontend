import type {
  CurrentUser,
  UserRole,
  UserStatus,
} from '@/types/Auth/auth'

export const ADMIN_USER_SORTS = ['newest', 'oldest'] as const

export type AdminUserSort = (typeof ADMIN_USER_SORTS)[number]

export interface AdminUserListParams {
  page: number
  limit: number
  q?: string
  role?: UserRole
  status?: UserStatus
  sort: AdminUserSort
}

export interface AdminUserListItem {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
  displayName: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface AdminUserListData {
  items: AdminUserListItem[]
  meta: PaginationMeta
}

export interface AdminUserDetail {
  user: CurrentUser & {
    lastLoginAt: string | null
    createdAt: string
  }
  learningSummary: {
    savedVocabularyCount: number
    completedArticleCount: number
  }
}

export interface UpdatedAdminUserStatus {
  id: string
  status: UserStatus
  updatedAt: string
}

export interface UpdatedAdminUserRole {
  id: string
  role: UserRole
  updatedAt: string
}

import type {
  PublicUser,
  UserProfile,
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

export interface AdminUserListItem extends PublicUser {
  lastLoginAt: string | null
  createdAt: string
  profile: Pick<UserProfile, 'displayName'> | null
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
  user: PublicUser & {
    lastLoginAt: string | null
    createdAt: string
  }
  profile: UserProfile | null
  learningSummary: {
    savedVocabularyCount: number
    masteredVocabularyCount: number
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

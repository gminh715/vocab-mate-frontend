import {
  ADMIN_USER_SORTS,
  type AdminUserListParams,
  type AdminUserSort,
} from '@/types/Admin/adminUsers'
import {
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus,
} from '@/types/Auth/auth'

const defaultPage = 1
const defaultLimit = 20
const defaultSort: AdminUserSort = 'newest'

const isUserRole = (value: string): value is UserRole =>
  USER_ROLES.some((role) => role === value)

const isUserStatus = (value: string): value is UserStatus =>
  USER_STATUSES.some((status) => status === value)

const isAdminUserSort = (value: string): value is AdminUserSort =>
  ADMIN_USER_SORTS.some((sort) => sort === value)

const boundedInteger = (
  value: string | null,
  fallback: number,
  maximum = Number.POSITIVE_INFINITY,
): number => {
  if (!value) return fallback

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum
    ? parsed
    : fallback
}

export const adminUserListParamsFromSearchParams = (
  searchParams: URLSearchParams,
): AdminUserListParams => {
  const q = searchParams.get('q')?.trim()
  const role = searchParams.get('role')
  const status = searchParams.get('status')
  const sort = searchParams.get('sort')

  return {
    page: boundedInteger(searchParams.get('page'), defaultPage),
    limit: boundedInteger(searchParams.get('limit'), defaultLimit, 100),
    ...(q ? { q } : {}),
    ...(role && isUserRole(role) ? { role } : {}),
    ...(status && isUserStatus(status) ? { status } : {}),
    sort: sort && isAdminUserSort(sort) ? sort : defaultSort,
  }
}

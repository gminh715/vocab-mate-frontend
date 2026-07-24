import { apiClient } from '../config/apiClient'
import type {
  AdminUserDetail,
  AdminUserListData,
  AdminUserListParams,
  UpdatedAdminUserRole,
  UpdatedAdminUserStatus,
} from '../types/admin-users'
import type { UserRole, UserStatus } from '../types/auth'

const adminUsersPath = '/admin/users'

const listRequestParams = (params: AdminUserListParams) => ({
  page: params.page,
  limit: params.limit,
  ...(params.q ? { q: params.q } : {}),
  ...(params.role ? { role: params.role } : {}),
  ...(params.status ? { status: params.status } : {}),
  sort: params.sort,
})

export const adminUsersApi = {
  list: (params: AdminUserListParams): Promise<AdminUserListData> =>
    apiClient.get<AdminUserListData>(adminUsersPath, {
      params: listRequestParams(params),
    }),

  detail: (userId: string): Promise<AdminUserDetail> =>
    apiClient.get<AdminUserDetail>(
      `${adminUsersPath}/${encodeURIComponent(userId)}`,
    ),

  updateStatus: (
    userId: string,
    status: UserStatus,
  ): Promise<UpdatedAdminUserStatus> =>
    apiClient.patch<UpdatedAdminUserStatus>(
      `${adminUsersPath}/${encodeURIComponent(userId)}/status`,
      { status },
    ),

  updateRole: (
    userId: string,
    role: UserRole,
  ): Promise<UpdatedAdminUserRole> =>
    apiClient.patch<UpdatedAdminUserRole>(
      `${adminUsersPath}/${encodeURIComponent(userId)}/role`,
      { role },
    ),
}

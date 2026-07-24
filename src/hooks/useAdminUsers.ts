import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { adminUsersApi } from '../api'
import type {
  AdminUserDetail,
  AdminUserListParams,
} from '../types/admin-users'
import type { UserRole, UserStatus } from '../types/auth'

export const adminUserQueryKeys = {
  all: ['admin-users'] as const,
  lists: () => [...adminUserQueryKeys.all, 'list'] as const,
  list: (params: AdminUserListParams) =>
    [...adminUserQueryKeys.lists(), params] as const,
  details: () => [...adminUserQueryKeys.all, 'detail'] as const,
  detail: (userId: string) =>
    [...adminUserQueryKeys.details(), userId] as const,
}

export const adminUserListQueryOptions = (
  params: AdminUserListParams,
) =>
  queryOptions({
    queryKey: adminUserQueryKeys.list(params),
    queryFn: () => adminUsersApi.list(params),
    placeholderData: keepPreviousData,
    retry: false,
  })

export const adminUserDetailQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: adminUserQueryKeys.detail(userId),
    queryFn: () => adminUsersApi.detail(userId),
    retry: false,
  })

export const useAdminUserListQuery = (
  params: AdminUserListParams,
) => useQuery(adminUserListQueryOptions(params))

export const useAdminUserDetailQuery = (userId: string) =>
  useQuery(adminUserDetailQueryOptions(userId))

export const useUpdateAdminUserStatusMutation = (userId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: UserStatus) =>
      adminUsersApi.updateStatus(userId, status),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<AdminUserDetail>(
        adminUserQueryKeys.detail(userId),
        (current) =>
          current
            ? {
                ...current,
                user: {
                  ...current.user,
                  status: updatedUser.status,
                },
              }
            : current,
      )
      void queryClient.invalidateQueries({
        queryKey: adminUserQueryKeys.lists(),
      })
    },
    retry: false,
  })
}

export const useUpdateAdminUserRoleMutation = (userId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (role: UserRole) =>
      adminUsersApi.updateRole(userId, role),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<AdminUserDetail>(
        adminUserQueryKeys.detail(userId),
        (current) =>
          current
            ? {
                ...current,
                user: {
                  ...current.user,
                  role: updatedUser.role,
                },
              }
            : current,
      )
      void queryClient.invalidateQueries({
        queryKey: adminUserQueryKeys.lists(),
      })
    },
    retry: false,
  })
}

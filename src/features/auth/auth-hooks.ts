import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { authApi } from './auth-api'
import {
  authQueryKeys,
  clearAuthSession,
  currentUserQueryOptions,
} from './auth-query'

export const useCurrentUserQuery = () =>
  useQuery(currentUserQueryOptions())

export const useLoginMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (currentUser) => {
      queryClient.setQueryData(authQueryKeys.currentUser(), currentUser)
    },
    retry: false,
  })
}

export const useRegisterMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (currentUser) => {
      queryClient.setQueryData(authQueryKeys.currentUser(), currentUser)
    },
    retry: false,
  })
}

export const useRefreshSessionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.refreshSession,
    onSuccess: (currentUser) => {
      queryClient.setQueryData(authQueryKeys.currentUser(), currentUser)
    },
    onError: () => {
      clearAuthSession(queryClient)
    },
    retry: false,
  })
}

export const useLogoutMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuthSession(queryClient)
    },
    retry: false,
  })
}

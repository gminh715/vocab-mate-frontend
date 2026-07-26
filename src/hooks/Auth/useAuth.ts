import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { authApi } from '@/api/Auth/AuthApi'

export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'current-user'] as const,
}

const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: authQueryKeys.currentUser(),
    queryFn: authApi.restoreSession,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })

export const clearAuthSession = (queryClient: QueryClient): void => {
  const currentUserKey = authQueryKeys.currentUser()

  queryClient.removeQueries({
    predicate: ({ queryKey }) =>
      queryKey.length !== currentUserKey.length ||
      queryKey.some((part, index) => part !== currentUserKey[index]),
  })
  queryClient.setQueryData(currentUserKey, null)

  setTimeout(() => {
    queryClient.getMutationCache().clear()
  }, 0)
}

export const useCurrentUserQuery = () =>
  useQuery(currentUserQueryOptions())

export const useLoginMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    gcTime: 0,
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
    gcTime: 0,
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

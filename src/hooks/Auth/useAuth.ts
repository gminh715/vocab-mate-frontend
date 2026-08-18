import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { authApi } from '@/api/Auth/AuthApi'
import { setAccessToken } from '@/config/apiClient'

export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'current-user'] as const,
  sessionNotice: () => [...authQueryKeys.all, 'session-notice'] as const,
}

export type AuthSessionNotice = 'PASSWORD_CHANGED' | 'REGISTERED'

const privateQueryRoots = new Set([
  'analytics',
  'auth',
  'collections',
  'reading',
  'review',
  'reviews',
  'vocabularies',
  '/adminAnalytics',
  '/adminArticleContent',
  '/adminArticles',
  '/adminCategories',
  '/adminQuizzes',
  '/adminUsers',
])

export const isPrivateQueryKey = (queryKey: readonly unknown[]): boolean =>
  typeof queryKey[0] === 'string' &&
  privateQueryRoots.has(queryKey[0])

const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: authQueryKeys.currentUser(),
    queryFn: authApi.restoreSession,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })

export const clearAuthSession = (
  queryClient: QueryClient,
  notice?: AuthSessionNotice,
): void => {
  const currentUserKey = authQueryKeys.currentUser()

  setAccessToken(null)
  queryClient.removeQueries({
    predicate: ({ queryKey }) =>
      isPrivateQueryKey(queryKey) &&
      (queryKey.length !== currentUserKey.length ||
        queryKey.some((part, index) => part !== currentUserKey[index])),
  })
  queryClient.setQueryData(currentUserKey, null)
  if (notice) {
    queryClient.setQueryData(authQueryKeys.sessionNotice(), notice)
  }

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
    onSuccess: () => {
      queryClient.setQueryData(authQueryKeys.sessionNotice(), 'REGISTERED')
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

export const useChangePasswordMutation = () => {
  return useMutation({
    gcTime: 0,
    mutationFn: authApi.changePassword,
    retry: false,
  })
}

export const useClearAuthSession = () => {
  const queryClient = useQueryClient()
  return (notice?: AuthSessionNotice) =>
    clearAuthSession(queryClient, notice)
}

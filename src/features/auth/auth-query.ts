import {
  queryOptions,
  type QueryClient,
} from '@tanstack/react-query'
import { authApi } from './auth-api'

export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authQueryKeys.all, 'current-user'] as const,
}

export const currentUserQueryOptions = () =>
  queryOptions({
    queryKey: authQueryKeys.currentUser(),
    queryFn: authApi.restoreSession,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })

export const clearAuthSession = (queryClient: QueryClient): void => {
  queryClient.setQueryData(authQueryKeys.currentUser(), null)
}

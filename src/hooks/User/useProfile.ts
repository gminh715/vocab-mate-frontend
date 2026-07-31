import { useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/api/User/ProfileApi'
import { authQueryKeys } from '@/hooks/Auth/useAuth'
import { readingQueryKeys } from '@/hooks/Reading/useReading'
import type {
  CurrentUser,
  UpdateMyProfileRequest,
} from '@/types/Auth/auth'

export const useUpdateMyProfileMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.update,
    retry: false,
    onSuccess: ({ user, profile }, request: UpdateMyProfileRequest) => {
      const currentUser: CurrentUser = { ...user, profile }
      queryClient.setQueryData(
        authQueryKeys.currentUser(),
        currentUser,
      )

      if (request.currentCefrLevel !== undefined) {
        void queryClient.invalidateQueries({
          queryKey: readingQueryKeys.articles(),
        })
      }
    },
  })
}

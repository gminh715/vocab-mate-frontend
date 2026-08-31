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
    onSuccess: (currentUser: CurrentUser, request: UpdateMyProfileRequest) => {
      queryClient.setQueryData(
        authQueryKeys.currentUser(),
        currentUser,
      )

      if (
        request.currentCefrLevel !== undefined ||
        request.learningGoal !== undefined
      ) {
        void queryClient.invalidateQueries({
          queryKey: readingQueryKeys.articles(),
        })
      }
    },
  })
}

export const useUploadMyAvatarMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.uploadAvatar,
    retry: false,
    onSuccess: (currentUser: CurrentUser) => {
      queryClient.setQueryData(
        authQueryKeys.currentUser(),
        currentUser,
      )
    },
  })
}

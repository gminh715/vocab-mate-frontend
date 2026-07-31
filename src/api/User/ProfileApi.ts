import { apiClient } from '@/config/apiClient'
import type {
  UpdatedMyProfile,
  UpdateMyProfileRequest,
} from '@/types/Auth/auth'

export const profileApi = {
  update(
    request: UpdateMyProfileRequest,
  ): Promise<UpdatedMyProfile> {
    return apiClient.patch<UpdatedMyProfile>('/users/me', request)
  },
}

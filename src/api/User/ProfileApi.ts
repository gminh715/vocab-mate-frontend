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
  uploadAvatar(
    file: File,
  ): Promise<UpdatedMyProfile> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<UpdatedMyProfile>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}


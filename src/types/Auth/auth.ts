export const USER_ROLES = ['USER', 'ADMIN'] as const
export const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DISABLED'] as const
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export type UserRole = (typeof USER_ROLES)[number]
export type UserStatus = (typeof USER_STATUSES)[number]
export type CefrLevel = (typeof CEFR_LEVELS)[number]

export interface PublicUser {
  id: string
  email: string
  role: UserRole
  status: UserStatus
}

export interface UserLearningSettings {
  displayName: string
  avatarUrl: string | null
  currentCefrLevel: CefrLevel | null
  learningGoal: string | null
  preferredLanguage: string
  dailyStudyMinutes: number
}

export interface UpdateMyProfileRequest {
  displayName?: string
  avatarUrl?: string
  currentCefrLevel?: CefrLevel | null
  learningGoal?: string | null
  preferredLanguage?: string
  dailyStudyMinutes?: 5 | 10 | 15 | 20
}

export interface CurrentUser extends PublicUser, UserLearningSettings {}

export type UpdatedMyProfile = CurrentUser

export interface AuthData {
  user: PublicUser
  accessToken: string
}

export interface RegistrationData {
  user: PublicUser
}

export interface MessageData {
  message: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export type UserRole = 'USER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface PublicUser {
  id: string
  email: string
  role: UserRole
  status: UserStatus
}

export interface UserProfile {
  displayName: string
  avatarUrl: string | null
  currentCefrLevel: CefrLevel
  learningGoal: string | null
  preferredLanguage: string
}

export interface MyAccount extends PublicUser {
  profile: UserProfile
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthData {
  user: PublicUser
  accessToken: string
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: string[]
  issues?: Array<{
    code: string
    message: string
    entityId?: string
  }>
}

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: unknown
}

export interface ApiFailure {
  success: false
  error: ApiErrorBody
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

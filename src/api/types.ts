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

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName: string
  currentCefrLevel: CefrLevel
  learningGoal?: string
  preferredLanguage?: string
}

export interface AuthData {
  user: PublicUser
  accessToken: string
}

export interface MessageData {
  message: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedData<T> {
  items: T[]
  meta: PaginationMeta
}

export interface ApiValidationIssue {
  code: string
  message: string
  entityId?: string
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: string[]
  issues?: ApiValidationIssue[]
}

export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiSuccessWithMeta<T, TMeta = PaginationMeta>
  extends ApiSuccess<T> {
  meta: TMeta
}

export interface ApiFailure {
  success: false
  error: ApiErrorBody
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export type ApiResponseWithMeta<T, TMeta = PaginationMeta> =
  | ApiSuccessWithMeta<T, TMeta>
  | ApiFailure

export interface ApiIssue {
  code: string
  message: string
  entityId?: string
}

export interface ApiErrorBody {
  code: string
  message: string
  details?: string[]
  issues?: ApiIssue[]
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

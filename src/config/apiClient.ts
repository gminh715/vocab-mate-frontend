import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

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

export interface ApiSuccess<T, M = unknown> {
  success: true
  data: T
  meta?: M
}

export interface ApiFailure {
  success: false
  error: ApiErrorBody
}

export type ApiResponse<T, M = unknown> = ApiSuccess<T, M> | ApiFailure

declare module 'axios' {
  interface AxiosRequestConfig {
    hasRetriedAfterRefresh?: boolean
    skipAuth?: boolean
    skipAuthRefresh?: boolean
    suppressSessionExpiredAfterRetry?: boolean
  }
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredBaseUrl || '/api/v1').replace(/\/+$/, '')

const authRefreshExcludedPaths = new Set([
  '/auth/login',
  '/auth/refresh',
  '/auth/register',
])

const httpClient = axios.create({
  allowAbsoluteUrls: false,
  baseURL: API_BASE_URL,
  withCredentials: true,
})

const refreshClient = axios.create({
  allowAbsoluteUrls: false,
  baseURL: API_BASE_URL,
  withCredentials: true,
})

let accessToken: string | null = null
let refreshRequest: Promise<void> | null = null
let sessionExpiredHandler: (() => void) | null = null

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: string[]
  readonly issues?: ApiErrorBody['issues']

  constructor({
    status,
    code,
    message,
    details,
    issues,
  }: {
    status: number
    code: string
    message: string
    details?: string[]
    issues?: ApiErrorBody['issues']
  }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.issues = issues
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isApiFailure = (value: unknown): value is ApiFailure => {
  if (!isRecord(value) || value.success !== false || !isRecord(value.error)) {
    return false
  }

  return (
    typeof value.error.code === 'string' &&
    typeof value.error.message === 'string'
  )
}

const errorMessageForStatus = (status: number): string => {
  if (status === 401) return 'Your session is no longer valid.'
  if (status === 403) return 'You do not have permission to do that.'
  if (status >= 500) return 'The server could not complete the request.'
  return 'The request could not be completed.'
}

export const normalizeApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const failure = isApiFailure(error.response?.data)
      ? error.response.data
      : undefined

    if (!error.response) {
      return new ApiError({
        status,
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the server. Check your connection and try again.',
      })
    }

    return new ApiError({
      status,
      code: failure?.error.code ?? 'REQUEST_FAILED',
      message:
        status >= 500
          ? errorMessageForStatus(status)
          : failure?.error.message || errorMessageForStatus(status),
      details: failure?.error.details,
      issues: failure?.error.issues,
    })
  }

  return new ApiError({
    status: 0,
    code: 'UNEXPECTED_ERROR',
    message: 'An unexpected error occurred. Try again.',
  })
}

const requestPath = (config: AxiosRequestConfig): string =>
  (config.url ?? '').split('?')[0] ?? ''

const canRefreshRequest = (
  config: InternalAxiosRequestConfig,
): boolean =>
  !config.hasRetriedAfterRefresh &&
  !config.skipAuthRefresh &&
  !authRefreshExcludedPaths.has(requestPath(config))

const notifySessionExpired = (): void => {
  sessionExpiredHandler?.()
}

export const setAccessToken = (token: string | null): void => {
  accessToken = token
}

export const setSessionExpiredHandler = (
  handler: (() => void) | null,
): void => {
  sessionExpiredHandler = handler
}

export const refreshAccessToken = (): Promise<void> => {
  if (refreshRequest) return refreshRequest

  refreshRequest = refreshClient
    .post<ApiResponse<{ accessToken: string }>>('/auth/refresh')
    .then((response) => {
      if (!response.data.success) {
        throw new ApiError({
          status: response.status,
          code: response.data.error.code,
          message: response.data.error.message,
          details: response.data.error.details,
          issues: response.data.error.issues,
        })
      }

      setAccessToken(response.data.data.accessToken)
    })
    .catch((error: unknown) => {
      setAccessToken(null)
      notifySessionExpired()
      throw normalizeApiError(error)
    })
    .finally(() => {
      refreshRequest = null
    })

  return refreshRequest
}

export const waitForPendingRefresh = (): Promise<void> =>
  refreshRequest ?? Promise.resolve()

httpClient.interceptors.request.use((config) => {
  if (accessToken && !config.skipAuth) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    const originalRequest = error.config

    if (!originalRequest || !canRefreshRequest(originalRequest)) {
      if (
        originalRequest?.hasRetriedAfterRefresh &&
        !originalRequest.suppressSessionExpiredAfterRetry
      ) {
        setAccessToken(null)
        notifySessionExpired()
      }

      return Promise.reject(error)
    }

    originalRequest.hasRetriedAfterRefresh = true

    try {
      await refreshAccessToken()
      return await httpClient.request(originalRequest)
    } catch (refreshError: unknown) {
      return Promise.reject(refreshError)
    }
  },
)

const requestEnvelope = async <T, M = unknown>(
  config: AxiosRequestConfig,
): Promise<ApiSuccess<T, M>> => {
  try {
    const response = await httpClient.request<ApiResponse<T, M>>(config)
    const payload = response.data

    if (!payload.success) {
      throw new ApiError({
        status: response.status,
        code: payload.error.code,
        message: payload.error.message,
        details: payload.error.details,
        issues: payload.error.issues,
      })
    }

    return payload
  } catch (error: unknown) {
    throw normalizeApiError(error)
  }
}

const request = async <T>(config: AxiosRequestConfig): Promise<T> =>
  (await requestEnvelope<T>(config)).data

const requestNoContent = async (
  config: AxiosRequestConfig,
): Promise<void> => {
  try {
    await httpClient.request(config)
  } catch (error: unknown) {
    throw normalizeApiError(error)
  }
}

interface ApiRequestOptions extends AxiosRequestConfig {
  retryOnUnauthorized?: boolean
}

const withLegacyRetryOption = (
  options: ApiRequestOptions = {},
): AxiosRequestConfig => {
  const { retryOnUnauthorized, ...config } = options

  return {
    ...config,
    skipAuthRefresh:
      config.skipAuthRefresh ??
      (retryOnUnauthorized === undefined ? undefined : !retryOnUnauthorized),
  }
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>({ ...withLegacyRetryOption(options), method: 'GET', url: path }),
  getWithMeta: <T, M>(
    path: string,
    options?: ApiRequestOptions,
  ) =>
    requestEnvelope<T, M>({
      ...withLegacyRetryOption(options),
      method: 'GET',
      url: path,
    }).then(({ data, meta }) => ({ data, meta })),
  post: <T>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) =>
    request<T>({
      ...withLegacyRetryOption(options),
      method: 'POST',
      url: path,
      data: body,
    }),
  patch: <T>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) =>
    request<T>({
      ...withLegacyRetryOption(options),
      method: 'PATCH',
      url: path,
      data: body,
    }),
  put: <T>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) =>
    request<T>({
      ...withLegacyRetryOption(options),
      method: 'PUT',
      url: path,
      data: body,
    }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>({
      ...withLegacyRetryOption(options),
      method: 'DELETE',
      url: path,
    }),
  deleteNoContent: (path: string, options?: ApiRequestOptions) =>
    requestNoContent({
      ...withLegacyRetryOption(options),
      method: 'DELETE',
      url: path,
    }),
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError

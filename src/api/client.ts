import type {
  ApiFailure,
  ApiResponse,
  ApiValidationIssue,
} from './types'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredBaseUrl || '/api/v1').replace(/\/+$/, '')

const versionedPathPattern = /^(?:api(?:\/v1)?|v1)(?:\/|$)/

const buildApiUrl = (path: string): string => {
  const featurePath = path.trim().replace(/^\/+/, '')

  if (versionedPathPattern.test(featurePath)) {
    throw new Error(
      'API feature paths must not repeat the configured /api/v1 prefix',
    )
  }

  return featurePath ? `${API_BASE_URL}/${featurePath}` : API_BASE_URL
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  retryOnUnauthorized?: boolean
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: string[]
  readonly issues?: ApiValidationIssue[]

  constructor(status: number, failure?: ApiFailure) {
    super(failure?.error.message || `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = failure?.error.code || 'REQUEST_FAILED'
    this.details = failure?.error.details
    this.issues = failure?.error.issues
  }
}

let accessToken: string | null = null
let refreshRequest: Promise<boolean> | null = null

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> =>
  typeof value === 'object' &&
  value !== null &&
  'success' in value &&
  typeof value.success === 'boolean'

const readResponse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined

  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('application/json')
    ? response.json()
    : response.text()
}

const request = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const {
    body,
    headers: suppliedHeaders,
    retryOnUnauthorized = true,
    ...fetchOptions
  } = options
  const headers = new Headers(suppliedHeaders)

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(buildApiUrl(path), {
    ...fetchOptions,
    credentials: 'include',
    headers,
    body:
      body === undefined || body instanceof FormData
        ? body
        : JSON.stringify(body),
  })

  if (
    response.status === 401 &&
    retryOnUnauthorized &&
    path !== '/auth/refresh' &&
    (await refreshAccessToken())
  ) {
    return request<T>(path, { ...options, retryOnUnauthorized: false })
  }

  const payload = await readResponse(response)

  if (!response.ok) {
    const failure =
      isApiResponse<never>(payload) && !payload.success ? payload : undefined
    throw new ApiError(response.status, failure)
  }

  if (isApiResponse<T>(payload)) {
    if (!payload.success) throw new ApiError(response.status, payload)
    return payload.data
  }

  return payload as T
}

export const setAccessToken = (token: string | null): void => {
  accessToken = token
}

export const refreshAccessToken = (): Promise<boolean> => {
  if (refreshRequest) return refreshRequest

  refreshRequest = request<{ accessToken: string }>('/auth/refresh', {
    method: 'POST',
    retryOnUnauthorized: false,
  })
    .then(({ accessToken: nextToken }) => {
      setAccessToken(nextToken)
      return true
    })
    .catch(() => {
      setAccessToken(null)
      return false
    })
    .finally(() => {
      refreshRequest = null
    })

  return refreshRequest
}

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}

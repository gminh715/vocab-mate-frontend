import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  ApiError,
  normalizeApiError,
  type ApiFailure,
} from '../src/config/apiClient'

describe('normalizeApiError', () => {
  it('preserves the documented backend error envelope', () => {
    const failure: ApiFailure = {
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Email is already registered',
        details: ['email must be unique'],
      },
    }
    const response: AxiosResponse<ApiFailure> = {
      data: failure,
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: new AxiosHeaders() },
    }
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      response,
    )

    expect(normalizeApiError(error)).toMatchObject({
      status: 409,
      code: 'CONFLICT',
      message: 'Email is already registered',
      details: ['email must be unique'],
    })
  })

  it('does not expose a raw server message for 500 responses', () => {
    const failure: ApiFailure = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'sensitive implementation detail',
      },
    }
    const response: AxiosResponse<ApiFailure> = {
      data: failure,
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: { headers: new AxiosHeaders() },
    }
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_RESPONSE',
      undefined,
      undefined,
      response,
    )

    expect(normalizeApiError(error).message).toBe(
      'The server could not complete the request.',
    )
  })

  it('normalizes network and unexpected failures', () => {
    expect(normalizeApiError(new AxiosError('socket failed'))).toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
    })
    expect(normalizeApiError(new Error('unknown detail'))).toMatchObject({
      status: 0,
      code: 'UNEXPECTED_ERROR',
    })
  })

  it('returns an existing ApiError unchanged', () => {
    const error = new ApiError({
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password',
    })

    expect(normalizeApiError(error)).toBe(error)
  })
})

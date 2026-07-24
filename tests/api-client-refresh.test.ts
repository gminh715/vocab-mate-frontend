// @vitest-environment node
/// <reference types="node" />

import {
  createServer,
  type Server,
  type ServerResponse,
} from 'node:http'
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

type ClientModule = typeof import('../src/config/apiClient')
type ServerMode =
  | 'normal'
  | 'always-unauthorized'
  | 'refresh-failure'

let client: ClientModule
let server: Server
let mode: ServerMode = 'normal'
let refreshCalls = 0
let logoutCalls = 0
const resourceCalls = new Map<string, number>()
const authorizationHeaders = new Map<string, Array<string | undefined>>()

const sendJson = (
  response: ServerResponse,
  status: number,
  body: unknown,
): void => {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

const recordRequest = (
  path: string,
  authorization: string | undefined,
): void => {
  resourceCalls.set(path, (resourceCalls.get(path) ?? 0) + 1)
  const headers = authorizationHeaders.get(path) ?? []
  headers.push(authorization)
  authorizationHeaders.set(path, headers)
}

beforeAll(async () => {
  server = createServer(async (request, response) => {
    const path = request.url ?? ''
    const authorization = request.headers.authorization

    if (path === '/api/v1/auth/refresh') {
      refreshCalls += 1

      if (mode === 'refresh-failure') {
        sendJson(response, 403, {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Refresh token is invalid or expired',
          },
        })
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 20))
      sendJson(response, 200, {
        success: true,
        data: { accessToken: 'fresh-token' },
      })
      return
    }

    if (path === '/api/v1/auth/logout') {
      logoutCalls += 1
      recordRequest(path, authorization)

      if (authorization !== 'Bearer fresh-token') {
        sendJson(response, 401, {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        })
        return
      }

      sendJson(response, 200, {
        success: true,
        data: { message: 'Done' },
      })
      return
    }

    if (
      path === '/api/v1/auth/login' ||
      path === '/api/v1/auth/register'
    ) {
      recordRequest(path, authorization)
      sendJson(response, 401, {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        },
      })
      return
    }

    recordRequest(path, authorization)

    if (
      mode === 'always-unauthorized' ||
      authorization !== 'Bearer fresh-token'
    ) {
      sendJson(response, 401, {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      })
      return
    }

    sendJson(response, 200, {
      success: true,
      data: { path },
    })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Expected the test server to listen on a TCP port')
  }
  vi.stubEnv(
    'VITE_API_BASE_URL',
    `http://127.0.0.1:${address.port}/api/v1`,
  )
  vi.resetModules()
  client = await import('../src/config/apiClient')
})

beforeEach(() => {
  mode = 'normal'
  refreshCalls = 0
  logoutCalls = 0
  resourceCalls.clear()
  authorizationHeaders.clear()
  client.setAccessToken(null)
  client.setSessionExpiredHandler(null)
})

afterAll(async () => {
  client.setAccessToken(null)
  client.setSessionExpiredHandler(null)
  vi.unstubAllEnvs()
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
})

describe('Axios authentication behavior', () => {
  it('shares one refresh across concurrent 401 responses', async () => {
    client.setAccessToken('expired-token')

    const [first, second] = await Promise.all([
      client.apiClient.get<{ path: string }>('/resource-a'),
      client.apiClient.get<{ path: string }>('/resource-b'),
    ])

    expect(first.path).toBe('/api/v1/resource-a')
    expect(second.path).toBe('/api/v1/resource-b')
    expect(refreshCalls).toBe(1)
    expect(resourceCalls.get('/api/v1/resource-a')).toBe(2)
    expect(resourceCalls.get('/api/v1/resource-b')).toBe(2)
    expect(authorizationHeaders.get('/api/v1/resource-a')).toEqual([
      'Bearer expired-token',
      'Bearer fresh-token',
    ])
  })

  it('retries the original request at most once', async () => {
    mode = 'always-unauthorized'
    const sessionExpired = vi.fn()
    client.setSessionExpiredHandler(sessionExpired)
    client.setAccessToken('expired-token')

    await expect(
      client.apiClient.get('/always-unauthorized'),
    ).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHORIZED',
    })

    expect(refreshCalls).toBe(1)
    expect(resourceCalls.get('/api/v1/always-unauthorized')).toBe(2)
    expect(sessionExpired).toHaveBeenCalledOnce()
  })

  it('does not refresh login or register failures', async () => {
    client.setAccessToken('expired-token')

    await expect(
      client.apiClient.post('/auth/login', {
        email: 'learner@example.com',
        password: 'WrongPass@123',
      }),
    ).rejects.toMatchObject({ status: 401 })
    await expect(
      client.apiClient.post('/auth/register', {}),
    ).rejects.toMatchObject({ status: 401 })

    expect(refreshCalls).toBe(0)
    expect(resourceCalls.get('/api/v1/auth/login')).toBe(1)
    expect(resourceCalls.get('/api/v1/auth/register')).toBe(1)
  })

  it('clears the session once when a shared refresh fails', async () => {
    mode = 'refresh-failure'
    const sessionExpired = vi.fn()
    client.setSessionExpiredHandler(sessionExpired)
    client.setAccessToken('expired-token')

    const results = await Promise.allSettled([
      client.apiClient.get('/resource-a'),
      client.apiClient.get('/resource-b'),
    ])

    expect(results.every(({ status }) => status === 'rejected')).toBe(true)
    expect(refreshCalls).toBe(1)
    expect(sessionExpired).toHaveBeenCalledOnce()
    expect(resourceCalls.get('/api/v1/resource-a')).toBe(1)
    expect(resourceCalls.get('/api/v1/resource-b')).toBe(1)
  })

  it('refreshes an expired access token before retrying logout', async () => {
    client.setAccessToken('expired-token')

    await client.apiClient.post('/auth/logout')

    expect(refreshCalls).toBe(1)
    expect(logoutCalls).toBe(2)
    expect(authorizationHeaders.get('/api/v1/auth/logout')).toEqual([
      'Bearer expired-token',
      'Bearer fresh-token',
    ])
  })
})

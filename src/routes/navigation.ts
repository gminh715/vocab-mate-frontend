import { ROUTE_PATHS } from './paths'

interface InternalRouteLocation {
  pathname: string
  search: string
  hash: string
}

interface RouteIntentState {
  from: InternalRouteLocation
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isSafeInternalPath = (value: string): boolean =>
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\') &&
  value !== ROUTE_PATHS.login &&
  !value.startsWith(`${ROUTE_PATHS.login}?`) &&
  !value.startsWith(`${ROUTE_PATHS.login}#`)

export const createRouteIntent = (
  location: InternalRouteLocation,
): RouteIntentState => ({
  from: {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  },
})

export const getSafeReturnPath = (state: unknown): string | null => {
  if (!isRecord(state) || !('from' in state)) return null

  const { from } = state
  if (typeof from === 'string') {
    return isSafeInternalPath(from) ? from : null
  }
  if (!isRecord(from) || typeof from.pathname !== 'string') return null

  const search =
    typeof from.search === 'string' &&
    (from.search === '' || from.search.startsWith('?'))
      ? from.search
      : ''
  const hash =
    typeof from.hash === 'string' &&
    (from.hash === '' || from.hash.startsWith('#'))
      ? from.hash
      : ''
  const requestedPath = `${from.pathname}${search}${hash}`

  return isSafeInternalPath(requestedPath) ? requestedPath : null
}

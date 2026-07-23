import type { UserRole } from '~/api/types'

export const ROUTE_PATHS = {
  home: '/',
  login: '/login',
  register: '/register',
  forbidden: '/forbidden',
} as const

export const USER_DEFAULT_ROUTE = ROUTE_PATHS.home
// Batch 4 has not introduced a separate Admin destination yet.
export const ADMIN_DEFAULT_ROUTE = ROUTE_PATHS.home

export const getDefaultRouteForRole = (role: UserRole): string =>
  role === 'ADMIN' ? ADMIN_DEFAULT_ROUTE : USER_DEFAULT_ROUTE

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  postAuthPath,
  requestedPath,
  routePaths,
} from '../utils/paths'
import type { UserRole } from '../types/auth'
import { SessionLoading } from './SessionLoading'
import { useAuth } from '../contexts/AuthContext'

export function GuestRoute() {
  const { currentUser, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) return <SessionLoading />

  if (currentUser) {
    return (
      <Navigate
        to={postAuthPath(currentUser.role, location.state)}
        replace
      />
    )
  }

  return <Outlet />
}

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) return <SessionLoading />

  if (!isAuthenticated) {
    return (
      <Navigate
        to={routePaths.login}
        replace
        state={{ from: requestedPath(location) }}
      />
    )
  }

  return <Outlet />
}

interface RoleRouteProps {
  allowedRoles: readonly UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { currentUser, isInitializing } = useAuth()

  if (isInitializing) return <SessionLoading />

  if (!currentUser) {
    return <Navigate to={routePaths.login} replace />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={routePaths.forbidden} replace />
  }

  return <Outlet />
}

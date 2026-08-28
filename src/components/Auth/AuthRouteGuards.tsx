import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  defaultAuthenticatedPath,
  postLoginPath,
  requestedPath,
  routePaths,
} from '@/utils/paths'
import type { UserRole } from '@/types/Auth/auth'
import { SessionLoading } from '@/components/Shared/SessionLoading'
import { useAuth } from '@/contexts/AuthContext'

export function GuestRoute() {
  const { currentUser, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) return <SessionLoading />

  if (currentUser && location.state?.loggingOut !== true) {
    return (
      <Navigate
        to={postLoginPath(currentUser, location.state)}
        replace
      />
    )
  }

  return <Outlet />
}

export function ProtectedRoute() {
  const { currentUser, isAuthenticated, isInitializing } = useAuth()
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

  if (
    currentUser?.role === 'USER' &&
    currentUser.learningGoal === null &&
    location.pathname !== routePaths.onboarding
  ) {
    return <Navigate to={routePaths.onboarding} replace />
  }

  return <Outlet />
}

export function OnboardingRoute() {
  const { currentUser, isInitializing } = useAuth()

  if (isInitializing) return <SessionLoading />
  if (!currentUser) return <Navigate to={routePaths.login} replace />
  if (
    currentUser.role !== 'USER' ||
    currentUser.learningGoal !== null
  ) {
    return (
      <Navigate to={defaultAuthenticatedPath(currentUser.role)} replace />
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

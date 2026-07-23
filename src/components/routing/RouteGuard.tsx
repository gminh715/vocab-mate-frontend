import { Navigate, Outlet, useLocation } from 'react-router-dom'

import LoadingState from '~/components/states/LoadingState'
import { useAppSelector } from '~/redux/hooks'
import { selectSessionStatus } from '~/redux/sessionSlice'
import { selectCurrentUser } from '~/redux/userSlice'
import { createRouteIntent } from '~/routes/navigation'
import {
  getDefaultRouteForRole,
  ROUTE_PATHS,
} from '~/routes/paths'

type RouteAccess = 'authenticated' | 'guest' | 'admin'

interface RouteGuardProps {
  access: RouteAccess
}

function RouteGuard({ access }: RouteGuardProps) {
  const location = useLocation()
  const sessionStatus = useAppSelector(selectSessionStatus)
  const currentUser = useAppSelector(selectCurrentUser)

  if (sessionStatus === 'idle' || sessionStatus === 'restoring') {
    return <LoadingState message="Restoring your session…" />
  }

  const hasAuthenticatedSession =
    sessionStatus === 'authenticated' && currentUser !== null

  if (hasAuthenticatedSession && currentUser.status !== 'ACTIVE') {
    return <Navigate to={ROUTE_PATHS.forbidden} replace />
  }

  if (access === 'guest') {
    return hasAuthenticatedSession ? (
      <Navigate
        to={getDefaultRouteForRole(currentUser.role)}
        replace
      />
    ) : (
      <Outlet />
    )
  }

  if (!hasAuthenticatedSession) {
    return (
      <Navigate
        to={ROUTE_PATHS.login}
        replace
        state={createRouteIntent(location)}
      />
    )
  }

  if (access === 'admin' && currentUser.role !== 'ADMIN') {
    return <Navigate to={ROUTE_PATHS.forbidden} replace />
  }

  return <Outlet />
}

export default RouteGuard

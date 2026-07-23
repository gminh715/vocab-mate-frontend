import Button from '@mui/material/Button'
import { Link as RouterLink } from 'react-router-dom'

import LogoutButton from '~/components/auth/LogoutButton'
import RouteStatePage from '~/components/states/RouteStatePage'
import { useAppSelector } from '~/redux/hooks'
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from '~/redux/userSlice'
import {
  ROUTE_PATHS,
  USER_DEFAULT_ROUTE,
} from '~/routes/paths'

function ForbiddenPage() {
  const currentUser = useAppSelector(selectCurrentUser)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isAccountUnavailable =
    currentUser !== null && currentUser.status !== 'ACTIVE'

  if (isAccountUnavailable) {
    return (
      <RouteStatePage
        eyebrow="Account unavailable"
        title="Your account cannot access Vocab Mate"
        description="Sign out, then contact an administrator if you need help restoring access."
        action={<LogoutButton />}
      />
    )
  }

  return (
    <RouteStatePage
      eyebrow="403"
      title="You do not have access to this page"
      description="Your account does not have the required permission. Choose an available destination to continue."
      action={
        <Button
          component={RouterLink}
          to={
            isAuthenticated
              ? USER_DEFAULT_ROUTE
              : ROUTE_PATHS.login
          }
          variant="contained"
          color="success"
        >
          {isAuthenticated ? 'Back to home' : 'Sign in'}
        </Button>
      }
    />
  )
}

export default ForbiddenPage

import Button from '@mui/material/Button'
import { Link as RouterLink } from 'react-router-dom'

import RouteStatePage from '~/components/states/RouteStatePage'
import { useAppSelector } from '~/redux/hooks'
import { selectIsAuthenticated } from '~/redux/userSlice'
import {
  ROUTE_PATHS,
  USER_DEFAULT_ROUTE,
} from '~/routes/paths'

function NotFoundPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  return (
    <RouteStatePage
      eyebrow="404"
      title="Page not found"
      description="The page may have moved or the address may be incorrect."
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
          {isAuthenticated ? 'Back to home' : 'Go to sign in'}
        </Button>
      }
    />
  )
}

export default NotFoundPage

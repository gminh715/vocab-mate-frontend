import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

import { useLogout } from '~/hooks/useLogout'

function LogoutButton() {
  const { isLoggingOut, logout } = useLogout()

  return (
    <Button
      type="button"
      variant="outlined"
      color="success"
      disabled={isLoggingOut}
      aria-busy={isLoggingOut}
      aria-live="polite"
      onClick={() => void logout()}
      sx={{ minHeight: 44, fontWeight: 750 }}
    >
      {isLoggingOut ? (
        <>
          <CircularProgress
            aria-hidden="true"
            color="inherit"
            size={18}
            sx={{ mr: 1.25 }}
          />
          Signing out…
        </>
      ) : (
        'Sign out'
      )}
    </Button>
  )
}

export default LogoutButton

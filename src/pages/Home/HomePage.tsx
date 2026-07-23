import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

import LogoutButton from '~/components/auth/LogoutButton'
import { useAppSelector } from '~/redux/hooks'
import { selectCurrentUser } from '~/redux/userSlice'

function HomePage() {
  const currentUser = useAppSelector(selectCurrentUser)

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Paper
        variant="outlined"
        sx={{ width: '100%', maxWidth: 640, p: { xs: 3, sm: 5 } }}
      >
        <Typography color="success.dark" fontWeight={800}>
          Vocab Mate
        </Typography>
        <Typography component="h1" variant="h4" sx={{ mt: 1.5 }}>
          {currentUser ? 'You’re signed in' : 'Keep learning in context'}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ mt: 1.5, overflowWrap: 'anywhere' }}
        >
          {currentUser
            ? `Your account ${currentUser.email} is ready.`
            : 'Sign in to continue your vocabulary journey.'}
        </Typography>
        {currentUser ? (
          <Box sx={{ mt: 3 }}>
            <LogoutButton />
          </Box>
        ) : null}
      </Paper>
    </Box>
  )
}

export default HomePage

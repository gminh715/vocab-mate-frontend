import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { routePaths } from '../utils/paths'

export function ForbiddenPage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 620 }}>
      <Typography variant="h1" sx={{ fontSize: { xs: 38, md: 52 } }}>
        Access Restricted
      </Typography>
      <Alert severity="warning">
        Your account does not have permission to open this page.
      </Alert>
      <Button
        component={RouterLink}
        to={routePaths.home}
        variant="contained"
        sx={{ alignSelf: 'flex-start' }}
      >
        Return Home
      </Button>
    </Stack>
  )
}

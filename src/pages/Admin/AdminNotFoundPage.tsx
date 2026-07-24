import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { routePaths } from '../../utils/paths'

export function AdminNotFoundPage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 680 }}>
      <Typography
        sx={{
          color: 'primary.main',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        404 · Admin
      </Typography>
      <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 } }}>
        Admin page not found
      </Typography>
      <Typography color="text.secondary">
        The address does not match an admin route. Use the navigation or
        return to the dashboard.
      </Typography>
      <Button
        component={RouterLink}
        to={routePaths.admin}
        variant="contained"
        sx={{ alignSelf: 'flex-start' }}
      >
        Return to dashboard
      </Button>
    </Stack>
  )
}

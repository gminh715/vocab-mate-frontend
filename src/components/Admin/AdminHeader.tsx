import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useLogoutMutation } from '@/hooks/Auth/useAuth'
import { routePaths } from '@/utils/paths'

interface AdminHeaderProps {
  drawerWidth: number
  onOpenNavigation: () => void
}

export function AdminHeader({
  drawerWidth,
  onOpenNavigation,
}: AdminHeaderProps) {
  const { currentUser } = useAuth()
  const logoutMutation = useLogoutMutation()

  return (
    <AppBar
      component="header"
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: 'rgba(255, 255, 255, 0.96)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ minHeight: '76px !important', gap: 1.5 }}>
        <IconButton
          aria-label="Open admin navigation"
          onClick={onOpenNavigation}
          sx={{ display: { md: 'none' } }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: 20,
              height: 14,
              borderTop: 2,
              borderBottom: 2,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 4,
                left: 0,
                width: '100%',
                borderTop: 2,
              },
            }}
          />
        </IconButton>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Content operations
          </Typography>
          <Typography
            component={RouterLink}
            to={routePaths.admin}
            aria-label="Admin"
            sx={{
              color: 'text.primary',
              fontFamily: '"Merriweather", serif',
              fontSize: { xs: 20, sm: 23 },
              fontWeight: 700,
              lineHeight: 1.15,
              textDecoration: 'none',
            }}
          >
            Admin
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Typography
          color="text.secondary"
          noWrap
          sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 200 }}
        >
          {currentUser?.profile.displayName}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          sx={{ minWidth: { xs: 88, sm: 104 } }}
        >
          {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
        </Button>
      </Toolbar>
    </AppBar>
  )
}

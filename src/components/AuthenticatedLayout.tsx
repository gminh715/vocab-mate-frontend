import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, Outlet } from 'react-router-dom'
import { routePaths } from '../utils/paths'
import { useLogoutMutation } from '../hooks/useAuth'
import { useAuth } from '../contexts/AuthContext'

export function AuthenticatedLayout() {
  const { currentUser, isInitializing } = useAuth()
  const logoutMutation = useLogoutMutation()

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default' }}>
      <Link
        href="#main-content"
        sx={{
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: 1301,
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          transform: 'translateY(-150%)',
          transition: 'transform 120ms ease',
          '&:focus-visible': {
            transform: 'translateY(0)',
          },
        }}
      >
        Skip to main content
      </Link>

      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              minHeight: 72,
              gap: 2,
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              py: { xs: 1, sm: 0 },
            }}
          >
            <Typography
              component={RouterLink}
              to={currentUser ? routePaths.home : routePaths.articles}
              sx={{
                color: 'primary.dark',
                fontFamily: 'Georgia, serif',
                fontSize: 24,
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Vocab Mate
            </Typography>

            <Stack
              component="nav"
              aria-label="Primary navigation"
              direction="row"
              spacing={0.5}
              sx={{
                ml: { xs: 0, sm: 2 },
                order: { xs: 3, sm: 0 },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {currentUser ? (
                <Button
                  component={RouterLink}
                  to={routePaths.home}
                  color="inherit"
                >
                  Home
                </Button>
              ) : null}
              <Button
                component={RouterLink}
                to={routePaths.articles}
                color="inherit"
              >
                Articles
              </Button>
              {currentUser ? (
                <Button
                  component={RouterLink}
                  to={routePaths.readingHistory}
                  color="inherit"
                >
                  Reading history
                </Button>
              ) : null}
              {currentUser?.role === 'ADMIN' ? (
                <Button
                  component={RouterLink}
                  to={routePaths.admin}
                  color="inherit"
                >
                  Admin
                </Button>
              ) : null}
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            {currentUser ? (
              <>
                <Typography
                  color="text.secondary"
                  noWrap
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    maxWidth: 220,
                  }}
                >
                  {currentUser.profile.displayName}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
              {logoutMutation.isPending ? 'Signing Out…' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <Button
                component={RouterLink}
                to={routePaths.login}
                variant="outlined"
                disabled={isInitializing}
              >
                Sign In
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        id="main-content"
        component="main"
        maxWidth="lg"
        tabIndex={-1}
        sx={{ py: { xs: 4, md: 6 } }}
      >
        <Outlet />
      </Container>
    </Box>
  )
}

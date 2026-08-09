import AppBar from '@mui/material/AppBar'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, Outlet, useMatch } from 'react-router-dom'
import { UserAvatar } from '@/components/Shared/UserAvatar'
import { routePaths } from '@/utils/paths'
import { useLogoutMutation } from '@/hooks/Auth/useAuth'
import { useUpdateMyProfileMutation } from '@/hooks/User/useProfile'
import { useAuth } from '@/contexts/AuthContext'

function NavLink({ to, end = true, children }: { to: string; end?: boolean; children: React.ReactNode }) {
  const match = useMatch({ path: to, end })
  const isActive = Boolean(match)

  return (
    <Button
      component={RouterLink}
      to={to}
      color={isActive ? 'primary' : 'inherit'}
      sx={{
        fontWeight: isActive ? 700 : 500,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 6,
          left: 8,
          right: 8,
          height: 2,
          borderRadius: 1,
          bgcolor: 'primary.main',
          opacity: isActive ? 1 : 0,
          transition: 'opacity 150ms ease',
        },
      }}
    >
      {children}
    </Button>
  )
}

export function AuthenticatedLayout() {
  const { t } = useTranslation('home')
  const { currentUser, isInitializing } = useAuth()
  const logoutMutation = useLogoutMutation()
  const updateProfileMutation = useUpdateMyProfileMutation()
  const [accountMenuAnchor, setAccountMenuAnchor] =
    useState<HTMLElement | null>(null)
  const [languageNotice, setLanguageNotice] = useState<string | null>(null)
  const accountMenuOpen = Boolean(accountMenuAnchor)

  const closeAccountMenu = () => setAccountMenuAnchor(null)

  if (!currentUser) {
    return <Outlet />
  }

  const changePreferredLanguage = async () => {
    if (!currentUser || updateProfileMutation.isPending) return

    const preferredLanguage =
      currentUser.profile.preferredLanguage === 'en' ? 'vi' : 'en'
    closeAccountMenu()

    try {
      await updateProfileMutation.mutateAsync({ preferredLanguage })
      setLanguageNotice(
        t('nav.languageUpdated', { language: preferredLanguage.toUpperCase() }),
      )
    } catch {
      setLanguageNotice(t('nav.languageError'))
    }
  }

  const logout = () => {
    closeAccountMenu()
    logoutMutation.mutate()
  }

  return (
    <Box
      sx={{
        minHeight: '100svh',
        bgcolor: 'background.default',
        overflowX: 'hidden',
        maxWidth: '100%',
      }}
    >
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
        {t('nav.skipToContent', 'Skip to main content')}
      </Link>

      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1100,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
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
                fontFamily: '"Merriweather", serif',
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
              useFlexGap
              sx={{
                ml: { xs: 0, sm: 2 },
                order: { xs: 3, sm: 0 },
                width: { xs: '100%', sm: 'auto' },
                flexWrap: 'wrap',
              }}
            >
              {currentUser ? (
                <NavLink to={routePaths.home}>{t('nav.home', 'Home')}</NavLink>
              ) : null}
              <NavLink to={routePaths.articles}>{t('nav.articles', 'Articles')}</NavLink>
              {currentUser ? (
                <>
                  <NavLink to={routePaths.readingHistory}>{t('nav.readingHistory', 'Reading history')}</NavLink>
                  <NavLink to={routePaths.reviewHistory}>{t('nav.reviewHistory', 'Review history')}</NavLink>
                  <NavLink to={routePaths.vocabularies}>{t('nav.vocabulary', 'Vocabulary')}</NavLink>
                </>
              ) : null}
              {currentUser?.role === 'ADMIN' ? (
                <NavLink to={routePaths.admin} end={false}>{t('nav.admin', 'Admin')}</NavLink>
              ) : null}
            </Stack>

            <Box sx={{ flexGrow: 1 }} />

            {currentUser ? (
              <>
                <Button
                  color="inherit"
                  id="account-menu-button"
                  aria-label={`Open account menu for ${currentUser.profile.displayName}`}
                  aria-controls={accountMenuOpen ? 'account-menu' : undefined}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen ? 'true' : undefined}
                  onClick={(event) => setAccountMenuAnchor(event.currentTarget)}
                  startIcon={
                    <UserAvatar
                      displayName={currentUser.profile.displayName}
                      avatarUrl={currentUser.profile.avatarUrl}
                      size={32}
                    />
                  }
                  sx={{
                    minWidth: 0,
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: { xs: 'none', md: 'block' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {currentUser.profile.displayName}
                  </Box>
                </Button>
                <Menu
                  id="account-menu"
                  anchorEl={accountMenuAnchor}
                  open={accountMenuOpen}
                  onClose={closeAccountMenu}
                  slotProps={{
                    list: {
                      'aria-labelledby': 'account-menu-button',
                    },
                  }}
                >
                  <MenuItem
                    component={RouterLink}
                    to={routePaths.profileSettings}
                    onClick={closeAccountMenu}
                  >
                    <ListItemText primary={t('nav.profileSettings', 'Profile settings')} />
                  </MenuItem>
                  <MenuItem
                    onClick={() => void changePreferredLanguage()}
                    disabled={updateProfileMutation.isPending}
                  >
                    <ListItemText
                      primary={t('nav.languageSettings', 'Language settings')}
                      secondary={t('nav.languageCurrent', `Current: ${currentUser.profile.preferredLanguage.toUpperCase()} · Switch to ${currentUser.profile.preferredLanguage === 'en' ? 'VI' : 'EN'}`, {
                        current: currentUser.profile.preferredLanguage.toUpperCase(),
                        target: currentUser.profile.preferredLanguage === 'en' ? 'VI' : 'EN',
                      })}
                    />
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    onClick={logout}
                    disabled={logoutMutation.isPending}
                  >
                    <ListItemText
                      primary={
                        logoutMutation.isPending
                          ? t('nav.signingOut', 'Signing out…')
                          : t('nav.signOut', 'Sign out')
                      }
                    />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                component={RouterLink}
                to={routePaths.login}
                variant="outlined"
                disabled={isInitializing}
              >
                {t('nav.signIn', 'Sign In')}
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
        sx={{
          pt: { xs: 1.5, md: 2 },
          pb: { xs: 4, md: 6 },
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </Container>

      <Snackbar
        open={languageNotice !== null}
        autoHideDuration={4_000}
        onClose={() => setLanguageNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={updateProfileMutation.isError ? 'error' : 'success'}
          variant="filled"
          onClose={() => setLanguageNotice(null)}
          sx={{ width: '100%' }}
        >
          {languageNotice}
        </Alert>
      </Snackbar>
    </Box>
  )
}

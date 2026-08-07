import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Stack from '@mui/material/Stack'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useState } from 'react'
import {
  Link as RouterLink,
  NavLink,
  Outlet,
} from 'react-router-dom'
import { routePaths } from '@/utils/paths'
import { AdminHeader } from '@/components/Admin/AdminHeader'

const drawerWidth = 272

const adminNavigation = [
  { label: 'Dashboard', shortLabel: 'DB', to: routePaths.admin, end: true },
  { label: 'Users', shortLabel: 'US', to: routePaths.adminUsers },
  {
    label: 'Categories',
    shortLabel: 'CA',
    to: routePaths.adminCategories,
  },
  { label: 'Articles', shortLabel: 'AR', to: routePaths.adminArticles },
  { label: 'News import', shortLabel: 'NI', to: routePaths.adminNews },
  { label: 'Quizzes', shortLabel: 'QZ', to: routePaths.adminQuizzes },
  { label: 'Analytics', shortLabel: 'AN', to: routePaths.adminAnalytics },
] as const

interface AdminNavigationProps {
  onNavigate?: () => void
}

function AdminNavigation({ onNavigate }: AdminNavigationProps) {
  return (
    <Stack sx={{ height: '100%' }}>
      <Toolbar
        sx={{
          minHeight: '76px !important',
          px: 2.5,
          alignItems: 'center',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 38,
            height: 38,
            mr: 1.5,
            borderRadius: 2,
            color: 'primary.contrastText',
            bgcolor: 'primary.main',
            fontFamily: '"Merriweather", serif',
            fontSize: 21,
            fontWeight: 700,
          }}
        >
          V
        </Box>
        <Box>
          <Typography
            sx={{
              color: 'text.primary',
              fontFamily: '"Merriweather", serif',
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            Vocab Mate
          </Typography>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
            }}
          >
            Admin workspace
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        {onNavigate ? (
          <IconButton
            aria-label="Close admin navigation"
            onClick={onNavigate}
            size="small"
          >
            <Typography
              component="span"
              aria-hidden="true"
              sx={{ fontSize: 24, lineHeight: 1 }}
            >
              ×
            </Typography>
          </IconButton>
        ) : null}
      </Toolbar>

      <Divider />

      <List
        component="nav"
        aria-label="Admin navigation"
        sx={{ flex: 1, px: 1.5, py: 2 }}
      >
        {adminNavigation.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={'end' in item ? item.end : false}
            onClick={onNavigate}
            sx={{
              minHeight: 48,
              mb: 0.5,
              borderRadius: 2.5,
              color: 'text.secondary',
              '&.active': {
                color: 'primary.dark',
                bgcolor: 'primary.light',
              },
              '&.active:hover': {
                bgcolor: 'primary.light',
              },
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 28,
                height: 28,
                mr: 1.5,
                border: 1,
                borderColor: 'currentColor',
                borderRadius: 1.25,
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.04em',
              }}
            >
              {item.shortLabel}
            </Box>
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: 15,
                    fontWeight: 700,
                  },
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider />
      <Button
        component={RouterLink}
        to={routePaths.home}
        color="inherit"
        sx={{ justifyContent: 'flex-start', m: 1.5, px: 2 }}
      >
        Back to learning
      </Button>
    </Stack>
  )
}

export function AdminLayout() {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] =
    useState(false)

  const closeMobileNavigation = () => {
    setIsMobileNavigationOpen(false)
  }

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default' }}>
      <Box
        component="a"
        href="#admin-main-content"
        sx={{
          position: 'fixed',
          top: 8,
          left: 8,
          zIndex: 1400,
          px: 2,
          py: 1,
          borderRadius: 1,
          color: 'primary.dark',
          bgcolor: 'background.paper',
          transform: 'translateY(-150%)',
          transition: 'transform 120ms ease',
          '&:focus-visible': {
            transform: 'translateY(0)',
          },
        }}
      >
        Skip to main content
      </Box>

      <AdminHeader
        drawerWidth={drawerWidth}
        onOpenNavigation={() => setIsMobileNavigationOpen(true)}
      />

      <Box component="aside" aria-label="Admin sidebar">
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || isMobileNavigationOpen}
          onClose={closeMobileNavigation}
          ModalProps={{ keepMounted: true }}
          slotProps={{
            paper: {
              sx: {
                width: drawerWidth,
                boxSizing: 'border-box',
                borderRightColor: 'divider',
                bgcolor: 'background.paper',
              },
            },
          }}
        >
          <AdminNavigation
            onNavigate={isDesktop ? undefined : closeMobileNavigation}
          />
        </Drawer>
      </Box>

      <Box
        id="admin-main-content"
        component="main"
        tabIndex={-1}
        sx={{
          minHeight: '100svh',
          ml: { md: `${drawerWidth}px` },
          pt: '76px',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', p: { xs: 2.5, sm: 4, lg: 5 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { routePaths } from '@/utils/paths'

export function SettingsNavigation() {
  const { t } = useTranslation('profile')
  const { pathname } = useLocation()

  const value =
    pathname === routePaths.securitySettings
      ? routePaths.securitySettings
      : routePaths.profileSettings

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 0.5, md: 1 },
        width: '100%',
      }}
    >
      <Tabs
        value={value}
        aria-label={t('navigation.ariaLabel', 'Settings sections')}
        variant="fullWidth"
        sx={{
          '& .MuiTabs-flexContainer': {
            gap: 0.5,
          },
          '& .MuiTab-root': {
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            minWidth: 0,
            borderRadius: 1,
            px: 2,
            py: 1,
            textAlign: 'center',
            fontWeight: 600,
            flex: 1,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          },
          '& .MuiTabs-indicator': {
            height: 3,
            borderRadius: '3px 3px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
      >
        <Tab
          component={RouterLink}
          to={routePaths.profileSettings}
          value={routePaths.profileSettings}
          label={t('navigation.profile', 'Profile')}
        />
        <Tab
          component={RouterLink}
          to={routePaths.securitySettings}
          value={routePaths.securitySettings}
          label={t('navigation.security', 'Security')}
        />
      </Tabs>
    </Paper>
  )
}

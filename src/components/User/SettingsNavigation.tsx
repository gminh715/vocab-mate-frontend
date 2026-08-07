import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { routePaths } from '@/utils/paths'

export function SettingsNavigation() {
  const { t } = useTranslation('profile')
  const { pathname } = useLocation()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'))

  const value =
    pathname === routePaths.securitySettings
      ? routePaths.securitySettings
      : routePaths.profileSettings

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 0.5, md: 1 },
        width: { xs: '100%', md: 220 },
        flexShrink: 0,
        alignSelf: 'flex-start',
      }}
    >
      <Tabs
        value={value}
        aria-label={t('navigation.ariaLabel', 'Settings sections')}
        orientation={isDesktop ? 'vertical' : 'horizontal'}
        variant={isDesktop ? 'scrollable' : 'fullWidth'}
        scrollButtons="auto"
        sx={{
          '& .MuiTabs-flexContainer': {
            gap: 0.5,
          },
          '& .MuiTab-root': {
            alignItems: 'center',
            justifyContent: isDesktop ? 'flex-start' : 'center',
            minHeight: 44,
            borderRadius: 1,
            px: 2,
            py: 1,
            textAlign: isDesktop ? 'left' : 'center',
            fontWeight: 600,
            flex: isDesktop ? 'initial' : 1,
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

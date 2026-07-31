import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { routePaths } from '@/utils/paths'

export function SettingsNavigation() {
  const { pathname } = useLocation()
  const value =
    pathname === routePaths.securitySettings
      ? routePaths.securitySettings
      : routePaths.profileSettings

  return (
    <Paper variant="outlined">
      <Tabs
        value={value}
        aria-label="Settings sections"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab
          component={RouterLink}
          to={routePaths.profileSettings}
          value={routePaths.profileSettings}
          label="Profile"
        />
        <Tab
          component={RouterLink}
          to={routePaths.securitySettings}
          value={routePaths.securitySettings}
          label="Security"
        />
      </Tabs>
    </Paper>
  )
}

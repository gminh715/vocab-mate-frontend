import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

interface RouteStatePageProps {
  eyebrow: string
  title: string
  description: string
  action: ReactNode
}

function RouteStatePage({
  eyebrow,
  title,
  description,
  action,
}: RouteStatePageProps) {
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
        component="section"
        variant="outlined"
        aria-labelledby="route-state-title"
        sx={{ width: '100%', maxWidth: 560, p: { xs: 3, sm: 5 } }}
      >
        <Typography color="success.dark" fontWeight={800}>
          {eyebrow}
        </Typography>
        <Typography
          id="route-state-title"
          component="h1"
          variant="h4"
          sx={{ mt: 1.5, textWrap: 'balance' }}
        >
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          {description}
        </Typography>
        <Box sx={{ mt: 3 }}>{action}</Box>
      </Paper>
    </Box>
  )
}

export default RouteStatePage

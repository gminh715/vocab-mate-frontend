import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface AuthPageLayoutProps {
  title: string
  description: string
  asideWord: string
  asideDefinition: string
  children: ReactNode
  footer?: ReactNode
}

function AuthPageLayout({
  title,
  description,
  asideWord,
  asideDefinition,
  children,
  footer,
}: AuthPageLayoutProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 5 },
        bgcolor: 'background.default',
        backgroundImage: (theme) =>
          `radial-gradient(circle at 12% 12%, ${theme.palette.success.light}24, transparent 34%)`,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 920,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 0.8fr) 1.2fr' },
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          borderRadius: { xs: 3, sm: 4 },
          boxShadow: (theme) => theme.shadows[8],
        }}
      >
        <Box
          component="aside"
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 5,
            color: 'success.contrastText',
            bgcolor: 'success.dark',
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Vocab Mate
          </Typography>
          <Box>
            <Typography
              component="p"
              sx={{ mb: 1, fontSize: 13, opacity: 0.72 }}
            >
              Today’s word
            </Typography>
            <Typography
              component="p"
              sx={{ fontSize: 40, fontWeight: 750, letterSpacing: '-0.04em' }}
            >
              {asideWord}
            </Typography>
            <Typography sx={{ mt: 1.5, lineHeight: 1.7, opacity: 0.84 }}>
              {asideDefinition}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 3, sm: 5, md: 6 } }}>
          <Stack spacing={1}>
            <Typography
              sx={{
                color: 'success.dark',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Vocab Mate
            </Typography>
            <Typography
              component="h1"
              variant="h3"
              sx={{
                fontSize: { xs: 34, sm: 42 },
                fontWeight: 750,
                letterSpacing: '-0.035em',
                textWrap: 'balance',
              }}
            >
              {title}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {description}
            </Typography>
          </Stack>

          {children}

          {footer ? (
            <Box sx={{ mt: 3, textAlign: 'center' }}>{footer}</Box>
          ) : null}
        </Box>
      </Paper>
    </Box>
  )
}

export default AuthPageLayout

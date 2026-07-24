import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { PropsWithChildren } from 'react'
import { Link as RouterLink } from 'react-router-dom'

interface AuthPageLayoutProps extends PropsWithChildren {
  alternateAction: string
  alternateHref: string
  alternatePrompt: string
  description: string
  title: string
}

export function AuthPageLayout({
  alternateAction,
  alternateHref,
  alternatePrompt,
  children,
  description,
  title,
}: AuthPageLayoutProps) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100svh',
        display: 'grid',
        alignItems: 'center',
        py: { xs: 3, md: 6 },
        background:
          'radial-gradient(circle at 12% 8%, rgba(116, 190, 151, 0.22), transparent 30%), #F3F7F4',
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 0.9fr) minmax(420px, 1.1fr)' },
            overflow: 'hidden',
            border: 1,
            borderColor: 'divider',
            borderRadius: { xs: 3, md: 4 },
            boxShadow: '0 28px 80px rgba(21, 55, 43, 0.11)',
          }}
        >
          <Stack
            spacing={4}
            sx={{
              justifyContent: 'space-between',
              p: { xs: 3, sm: 5, md: 6 },
              color: 'common.white',
              bgcolor: 'primary.dark',
            }}
          >
            <Box>
              <Typography
                component="p"
                sx={{
                  mb: 2,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'primary.light',
                }}
              >
                Vocab Mate
              </Typography>
              <Typography
                component="p"
                sx={{
                  maxWidth: 430,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: { xs: 30, sm: 38 },
                  lineHeight: 1.15,
                  textWrap: 'balance',
                }}
              >
                Read the news. Notice the words. Make them yours.
              </Typography>
            </Box>

            <Box
              sx={{
                display: { xs: 'none', md: 'block' },
                maxWidth: 360,
                p: 2.5,
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Typography
                component="p"
                sx={{ fontFamily: 'Georgia, serif', fontSize: 26 }}
              >
                curious
              </Typography>
              <Typography sx={{ mt: 0.5, color: 'primary.light', fontSize: 13 }}>
                adjective · B1
              </Typography>
              <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.84)' }}>
                Eager to learn or know something.
              </Typography>
            </Box>
          </Stack>

          <Stack
            id="auth-form"
            spacing={3}
            sx={{
              justifyContent: 'center',
              p: { xs: 3, sm: 5, md: 7 },
            }}
          >
            <Box>
              <Typography variant="h1" sx={{ fontSize: { xs: 36, sm: 44 } }}>
                {title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.25 }}>
                {description}
              </Typography>
            </Box>

            {children}

            <Typography color="text.secondary">
              {alternatePrompt}{' '}
              <Link
                component={RouterLink}
                to={alternateHref}
                sx={{ fontWeight: 750 }}
              >
                {alternateAction}
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}

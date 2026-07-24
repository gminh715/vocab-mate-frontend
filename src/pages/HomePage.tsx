import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { currentUser } = useAuth()

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1" sx={{ fontSize: { xs: 38, md: 52 } }}>
          Welcome back, {currentUser?.profile.displayName}.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 620 }}>
          Your reading workspace will live here. Authentication is ready for
          the article experience.
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{ p: { xs: 3, sm: 4 }, maxWidth: 620, bgcolor: 'background.paper' }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Chip
            label={`CEFR ${currentUser?.profile.currentCefrLevel ?? ''}`}
            color="primary"
          />
          <Typography color="text.secondary">
            Signed in as {currentUser?.email}
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  )
}

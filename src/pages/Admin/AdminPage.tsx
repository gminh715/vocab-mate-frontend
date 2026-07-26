import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { routePaths } from '@/utils/paths'

export function AdminPage() {
  return (
    <Stack spacing={{ xs: 4, md: 5 }}>
      <Stack spacing={1.25} sx={{ maxWidth: 760 }}>
        <Typography
          sx={{
            color: 'primary.main',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          Admin workspace
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: 38, md: 52 } }}>
          Admin Area
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 17 }}>
          Manage the prepared learning content and account records that power
          Vocab Mate.
        </Typography>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          maxWidth: 920,
          overflow: 'hidden',
          borderRadius: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            p: { xs: 3, sm: 4 },
            alignItems: { sm: 'center' },
            borderLeft: 6,
            borderColor: 'primary.main',
          }}
        >
          <Stack spacing={0.75} sx={{ flex: 1 }}>
            <Typography variant="h2" sx={{ fontSize: 26 }}>
              Start with content
            </Typography>
            <Typography color="text.secondary">
              Article and quiz tools are available from the admin navigation.
              Their backend-connected screens will be implemented by their
              owning features.
            </Typography>
          </Stack>
          <Button
            component={RouterLink}
            to={routePaths.adminArticles}
            variant="contained"
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
          >
            Open articles
          </Button>
        </Stack>
      </Paper>
    </Stack>
  )
}

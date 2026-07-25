import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function SessionLoading() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        px: 3,
      }}
    >
      <Stack
        spacing={2}
        role="status"
        aria-live="polite"
        sx={{ alignItems: 'center' }}
      >
        <CircularProgress size={32} aria-hidden="true" />
        <Typography color="text.secondary">Restoring your session…</Typography>
      </Stack>
    </Box>
  )
}

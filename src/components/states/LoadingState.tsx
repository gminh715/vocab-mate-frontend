import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

export interface LoadingStateProps {
  message?: string
}

function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label={message}
      sx={{
        minHeight: { xs: 160, sm: 200 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 2,
        py: 4,
        textAlign: 'center',
      }}
    >
      <CircularProgress aria-hidden="true" size={32} />
      <Typography aria-hidden="true" color="text.secondary">
        {message}
      </Typography>
    </Box>
  )
}

export default LoadingState

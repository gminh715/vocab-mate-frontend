import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

export interface ErrorStateProps {
  message: string
  title?: string
  retryLabel?: string
  onRetry?: () => void
}

function ErrorState({
  message,
  title = 'Something went wrong',
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        maxWidth: 640,
        mx: 'auto',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
      }}
    >
      <Alert severity="error" variant="outlined">
        <AlertTitle component="h2">{title}</AlertTitle>
        {message}
        {onRetry ? (
          <Box sx={{ mt: 2 }}>
            <Button type="button" variant="outlined" onClick={onRetry}>
              {retryLabel}
            </Button>
          </Box>
        ) : null}
      </Alert>
    </Box>
  )
}

export default ErrorState

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export interface EmptyStateProps {
  title?: string
  description?: string
}

function EmptyState({
  title = 'Nothing here yet',
  description,
}: EmptyStateProps) {
  return (
    <Box
      component="section"
      sx={{
        minHeight: { xs: 160, sm: 200 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        px: 2,
        py: 4,
        textAlign: 'center',
      }}
    >
      <Typography component="h2" variant="h6">
        {title}
      </Typography>
      {description ? (
        <Typography
          color="text.secondary"
          sx={{ maxWidth: 480, overflowWrap: 'anywhere' }}
        >
          {description}
        </Typography>
      ) : null}
    </Box>
  )
}

export default EmptyState

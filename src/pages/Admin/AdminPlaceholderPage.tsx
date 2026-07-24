import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface AdminPlaceholderPageProps {
  title: string
}

export function AdminPlaceholderPage({
  title,
}: AdminPlaceholderPageProps) {
  return (
    <Stack spacing={3} sx={{ maxWidth: 760 }}>
      <BoxHeader title={title} />
      <Alert severity="info">
        This route is ready for its feature implementation. No records or
        statistics are shown until the backend-connected screen is added.
      </Alert>
    </Stack>
  )
}

function BoxHeader({ title }: { title: string }) {
  return (
    <Stack spacing={0.75}>
      <Typography
        sx={{
          color: 'primary.main',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Admin
      </Typography>
      <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 48 } }}>
        {title}
      </Typography>
    </Stack>
  )
}

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useDueVocabulariesQuery } from '@/hooks/Vocabulary/useVocabularies'

interface DueVocabularyHeaderProps {
  dueOnly?: boolean
  onToggleDueOnly: (dueOnly: boolean) => void
}

export function DueVocabularyHeader({
  dueOnly,
  onToggleDueOnly,
}: DueVocabularyHeaderProps) {
  const { data: dueData, isLoading } = useDueVocabulariesQuery({ limit: 1 })
  const totalDue = dueData?.meta.total ?? 0

  if (isLoading) return null

  if (dueOnly) {
    return (
      <Alert
        severity="info"
        sx={{
          mb: 3,
          borderRadius: 2.5,
          bgcolor: 'primary.light',
          color: 'primary.dark',
          alignItems: 'center',
          '& .MuiAlert-icon': {
            color: 'primary.dark',
          },
        }}
        action={
          <Button
            color="primary"
            size="small"
            onClick={() => onToggleDueOnly(false)}
            sx={{ fontWeight: 700 }}
          >
            Show All Vocabulary
          </Button>
        }
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Showing Due Vocabulary Items Only
          </Typography>
          <Chip
            label={`${totalDue} Due`}
            size="small"
            color="primary"
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Alert>
    )
  }

  if (totalDue === 0) return null

  return (
    <Box
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'primary.light',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Chip
            label={`${totalDue} Due`}
            color="secondary"
            sx={{ fontWeight: 800, fontSize: 13 }}
          />
          <Typography variant="body1" sx={{ fontWeight: 650, color: 'text.primary' }}>
            You have {totalDue} {totalDue === 1 ? 'word' : 'words'} due for review today.
          </Typography>
        </Stack>

        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={() => onToggleDueOnly(true)}
          sx={{ whiteSpace: 'nowrap' }}
        >
          View Due Items
        </Button>
      </Stack>
    </Box>
  )
}

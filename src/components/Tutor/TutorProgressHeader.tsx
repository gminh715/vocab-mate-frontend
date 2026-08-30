import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

interface TutorProgressHeaderProps {
  currentPosition: number
  totalActivities: number
  isNewWord?: boolean
  onAbandonClick: () => void
  disabled?: boolean
}

export function TutorProgressHeader({
  currentPosition,
  totalActivities,
  isNewWord,
  onAbandonClick,
  disabled = false,
}: TutorProgressHeaderProps) {
  const { t } = useTranslation('tutor')

  const progressPercent =
    totalActivities > 0
      ? Math.min(
          100,
          Math.max(0, Math.round(((currentPosition - 1) / totalActivities) * 100)),
        )
      : 0

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 800, color: 'text.primary' }}
          >
            {t('session.activityProgress', {
              current: currentPosition,
              total: totalActivities,
            })}
          </Typography>
          {isNewWord !== undefined ? (
            <Chip
              size="small"
              label={
                isNewWord
                  ? t('session.newWordBadge')
                  : t('session.reviewBadge')
              }
              color={isNewWord ? 'secondary' : 'default'}
              variant={isNewWord ? 'filled' : 'outlined'}
              sx={{ fontWeight: 700, fontSize: '0.75rem', height: 24 }}
            />
          ) : null}
        </Stack>

        <Button
          size="small"
          color="error"
          variant="text"
          onClick={onAbandonClick}
          disabled={disabled}
          sx={{ fontWeight: 600, fontSize: '0.8125rem' }}
        >
          {t('session.abandonBtn')}
        </Button>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={progressPercent}
        aria-label={`Tiến độ phiên học: ${progressPercent}%`}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            transition: 'transform 0.4s ease-in-out',
          },
        }}
      />
    </Box>
  )
}

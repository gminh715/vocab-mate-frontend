import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { ClockIcon, SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import type { TutorSessionSummary } from '@/types/Tutor/tutor'
import { tutorHistoryDetailPath } from '@/utils/paths'

interface TutorHistoryItemCardProps {
  session: TutorSessionSummary
}

export function TutorHistoryItemCard({ session }: TutorHistoryItemCardProps) {
  const { t } = useTranslation('tutor')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'ACTIVE':
        return 'warning'
      case 'ABANDONED':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return t('history.statusCompleted')
      case 'ACTIVE':
        return t('history.statusActive')
      case 'ABANDONED':
        return t('history.statusAbandoned')
      default:
        return status
    }
  }

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
          borderColor: 'primary.main',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" useFlexGap sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {t('history.sessionDate', { date: session.studyDate })}
            </Typography>

            <Chip
              size="small"
              label={getStatusLabel(session.status)}
              color={getStatusColor(session.status)}
              sx={{ fontWeight: 700, height: 22 }}
            />
          </Stack>

          <Stack direction="row" useFlexGap sx={{ color: 'text.secondary', flexWrap: 'wrap', gap: 2 }}>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <ClockIcon size={15} color="currentColor" />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {session.targetDurationMinutes} phút
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <SparklesIcon size={15} color="currentColor" />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {t('history.questionCount', {
                  count: session.targetActivityCount,
                  defaultValue: `${session.targetActivityCount} câu hỏi`,
                })}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Button
          component={RouterLink}
          to={tutorHistoryDetailPath(session.id)}
          variant="outlined"
          size="medium"
          sx={{ borderRadius: 2, fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          {t('history.viewDetail')}
        </Button>
      </Stack>
    </Card>
  )
}

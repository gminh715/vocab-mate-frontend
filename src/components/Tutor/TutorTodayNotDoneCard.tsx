import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { ClockIcon, SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import { useAuth } from '@/contexts/AuthContext'
import type { TodayStatusData } from '@/types/Tutor/tutor'
import { routePaths } from '@/utils/paths'

interface TutorTodayNotDoneCardProps {
  status: TodayStatusData
}

export function TutorTodayNotDoneCard({ status }: TutorTodayNotDoneCardProps) {
  const { t } = useTranslation('tutor')
  const { currentUser } = useAuth()
  const dailyMinutes = currentUser?.dailyStudyMinutes ?? 10
  const isResumable = status.canResume

  // User has no vocabulary saved yet
  if (
    !status.canStart &&
    !status.canResume &&
    !status.isCompletedToday &&
    !status.isAbandoned
  ) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3.5,
          bgcolor: 'background.paper',
          borderLeftWidth: 4,
          borderLeftColor: 'primary.main',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Stack direction="row" useFlexGap sx={{ alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<SparklesIcon size={14} color="inherit" />}
                size="small"
                label={t('title')}
                color="primary"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                icon={<ClockIcon size={14} color="inherit" />}
                size="small"
                label={t('dashboard.targetTime', { minutes: dailyMinutes })}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
              {t('dashboard.noVocabTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('dashboard.noVocabDesc')}
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to={routePaths.articles}
            variant="contained"
            size="large"
            sx={{
              borderRadius: 2.5,
              px: 3.5,
              py: 1.5,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: 2,
            }}
          >
            {t('dashboard.noVocabCta')}
          </Button>
        </Stack>
      </Paper>
    )
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3.5,
        bgcolor: 'background.paper',
        borderLeftWidth: 4,
        borderLeftColor: isResumable ? 'warning.main' : 'primary.main',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 12px 36px rgba(0,0,0,0.07)',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ maxWidth: 640 }}>
          <Stack
            direction="row"
            useFlexGap
            sx={{ alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}
          >
            <Chip
              icon={<SparklesIcon size={14} color="inherit" />}
              size="small"
              label={isResumable ? t('dashboard.canResume') : t('title')}
              color={isResumable ? 'warning' : 'primary'}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              icon={<ClockIcon size={14} color="inherit" />}
              size="small"
              label={t('dashboard.targetTime', { minutes: dailyMinutes })}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            {isResumable ? t('dashboard.canResume') : t('dashboard.notDoneTitle')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('dashboard.notDoneDesc')}
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to={routePaths.tutorSession}
          variant="contained"
          color={isResumable ? 'warning' : 'primary'}
          size="large"
          startIcon={<SparklesIcon size={20} />}
          sx={{
            borderRadius: 2.5,
            px: 4,
            py: 1.5,
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: 3,
            whiteSpace: 'nowrap',
          }}
        >
          {isResumable ? t('dashboard.resumeCta') : t('dashboard.notDoneCta')}
        </Button>
      </Stack>
    </Paper>
  )
}

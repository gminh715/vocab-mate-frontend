import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { ClockIcon, SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import { useAuth } from '@/contexts/AuthContext'
import { useTodayStatusQuery } from '@/hooks/Tutor/useTutor'
import { routePaths } from '@/utils/paths'

export function TutorDashboardCard() {
  const { t } = useTranslation('tutor')
  const { currentUser } = useAuth()
  const { data: status, isPending, isError, refetch } = useTodayStatusQuery()

  const dailyMinutes = currentUser?.dailyStudyMinutes ?? 10

  if (isPending) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          borderColor: 'divider',
        }}
      >
        <Stack spacing={2}>
          <Skeleton width="40%" height={28} />
          <Skeleton width="70%" height={20} />
          <Skeleton width="30%" height={40} sx={{ borderRadius: 2 }} />
        </Stack>
      </Paper>
    )
  }

  if (isError || !status) {
    return (
      <Alert
        severity="info"
        action={
          <Button color="inherit" size="small" onClick={() => void refetch()}>
            Thử lại
          </Button>
        }
      >
        {t('errors.loadFailed')}
      </Alert>
    )
  }

  // 1. User has no vocabulary saved
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
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          bgcolor: 'background.paper',
          borderLeftWidth: 4,
          borderLeftColor: 'primary.main',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Box sx={{ maxWidth: 640 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
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
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
              {t('dashboard.noVocabTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.noVocabDesc')}
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to={routePaths.articles}
            variant="contained"
            size="large"
            sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            {t('dashboard.noVocabCta')}
          </Button>
        </Stack>
      </Paper>
    )
  }

  // 2. Completed today
  if (status.isCompletedToday) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          bgcolor: 'success.light',
          borderColor: 'success.main',
          borderLeftWidth: 4,
          borderLeftColor: 'success.main',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Chip
                size="small"
                label={t('dashboard.completedToday')}
                color="success"
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
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.dark', mb: 0.5 }}>
              {t('dashboard.completedToday')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.completedDesc')}
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to={routePaths.tutorHistory}
            variant="outlined"
            color="success"
            sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            {t('summary.viewHistory')}
          </Button>
        </Stack>
      </Paper>
    )
  }

  // 3. Abandoned today
  if (status.isAbandoned) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          bgcolor: 'warning.light',
          borderColor: 'warning.main',
          borderLeftWidth: 4,
          borderLeftColor: 'warning.main',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Chip
                size="small"
                label={t('dashboard.abandonedToday')}
                color="warning"
                sx={{ fontWeight: 700 }}
              />
            </Stack>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'warning.dark', mb: 0.5 }}>
              {t('dashboard.abandonedToday')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('dashboard.abandonedDesc')}
            </Typography>
          </Box>

          <Button
            component={RouterLink}
            to={routePaths.tutorHistory}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            {t('summary.viewHistory')}
          </Button>
        </Stack>
      </Paper>
    )
  }

  // 4. Can Start or Can Resume
  const isResumable = status.canResume

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: 3,
        bgcolor: 'background.paper',
        borderLeftWidth: 4,
        borderLeftColor: isResumable ? 'warning.main' : 'primary.main',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ maxWidth: 640 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
            <Chip
              icon={<SparklesIcon size={14} color="inherit" />}
              size="small"
              label={t('title')}
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
            {status.dueCount > 0 ? (
              <Chip
                size="small"
                label={t('dashboard.dueCount', { count: status.dueCount })}
                color="secondary"
                sx={{ fontWeight: 700 }}
              />
            ) : (
              <Chip
                size="small"
                label={t('dashboard.noDue')}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Stack>

          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            {t('dashboard.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('dashboard.subtitle')}
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          to={routePaths.tutorSession}
          variant="contained"
          color={isResumable ? 'warning' : 'primary'}
          size="large"
          startIcon={<SparklesIcon size={18} />}
          sx={{
            borderRadius: 2,
            px: 3.5,
            py: 1.25,
            fontWeight: 800,
            boxShadow: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {isResumable ? t('dashboard.canResume') : t('dashboard.canStart')}
        </Button>
      </Stack>
    </Paper>
  )
}

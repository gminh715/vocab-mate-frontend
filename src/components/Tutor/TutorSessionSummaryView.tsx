import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import type { TutorSessionStatus, TutorSessionSummaryStats } from '@/types/Tutor/tutor'
import { routePaths } from '@/utils/paths'

interface TutorSessionSummaryViewProps {
  status: TutorSessionStatus
  summary: TutorSessionSummaryStats
}

export function TutorSessionSummaryView({
  status,
  summary,
}: TutorSessionSummaryViewProps) {
  const { t } = useTranslation('tutor')
  const isCompleted = status === 'COMPLETED'

  const accuracyPercent =
    summary.completedActivities > 0
      ? Math.round((summary.correctCount / summary.completedActivities) * 100)
      : 0

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins > 0 ? `${mins}m ` : ''}${secs}s`
  }

  return (
    <Box sx={{ maxWidth: 680, mx: 'auto', py: { xs: 2, sm: 4 } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3.5,
          borderColor: isCompleted ? 'primary.main' : 'warning.main',
          bgcolor: 'background.paper',
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            mx: 'auto',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isCompleted ? 'primary.light' : 'warning.light',
            color: isCompleted ? 'primary.main' : 'warning.dark',
          }}
        >
          <SparklesIcon size={32} />
        </Box>

        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 1 }}
        >
          {isCompleted
            ? t('summary.completedTitle')
            : t('summary.abandonedTitle')}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('summary.subtitle')}
        </Typography>

        {/* 4 Primary Stats Cards Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          <Card
            variant="outlined"
            sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default' }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {t('summary.accuracy')}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: accuracyPercent >= 70 ? 'success.main' : 'text.primary',
                mt: 0.5,
              }}
            >
              {accuracyPercent}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {summary.correctCount}/{summary.completedActivities} đúng
            </Typography>
          </Card>

          <Card
            variant="outlined"
            sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default' }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {t('summary.duration')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>
              {formatDuration(summary.durationSeconds)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              thời gian thực tế
            </Typography>
          </Card>

          <Card
            variant="outlined"
            sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default' }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {t('summary.newWords')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'secondary.main', mt: 0.5 }}>
              {summary.newWordsStudied}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              từ mới
            </Typography>
          </Card>

          <Card
            variant="outlined"
            sx={{ p: 2, borderRadius: 2.5, bgcolor: 'background.default' }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {t('summary.reviewWords')}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
              {summary.reviewWordsStudied}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              từ ôn tập
            </Typography>
          </Card>
        </Box>

        {/* Rating Breakdown Section */}
        <Paper
          variant="outlined"
          sx={{ p: 2.5, borderRadius: 2.5, mb: 3, textAlign: 'left' }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}
          >
            {t('summary.ratingDistribution')}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: 1.5,
            }}
          >
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.light', color: 'error.dark' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                Again (Ôn lại)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {summary.ratingDistribution.again}
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.dark' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                Hard (Khó)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {summary.ratingDistribution.hard}
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.light', color: 'info.dark' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                Good (Tốt)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {summary.ratingDistribution.good}
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.light', color: 'success.dark' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                Easy (Dễ)
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {summary.ratingDistribution.easy}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Relearning Words List (if any) */}
        {summary.relearningWords.length > 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              mb: 3,
              textAlign: 'left',
              borderColor: 'error.main',
              bgcolor: 'error.light',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1.5, color: 'error.dark' }}
            >
              {t('summary.relearningWords')} ({summary.relearningWords.length})
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {summary.relearningWords.map((word, idx) => (
                <Chip
                  key={idx}
                  label={word}
                  color="error"
                  variant="filled"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              ))}
            </Stack>
          </Paper>
        ) : null}

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'center' }}
        >
          <Button
            component={RouterLink}
            to={routePaths.home}
            variant="contained"
            size="large"
            sx={{ px: 4, py: 1.25, borderRadius: 2, fontWeight: 700 }}
          >
            {t('summary.backToHome')}
          </Button>

          <Button
            component={RouterLink}
            to={routePaths.tutorHistory}
            variant="outlined"
            size="large"
            sx={{ px: 3, py: 1.25, borderRadius: 2, fontWeight: 700 }}
          >
            {t('summary.viewHistory')}
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}

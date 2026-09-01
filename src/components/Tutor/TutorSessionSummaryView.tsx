import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import { TutorHistoryItemCard } from '@/components/Tutor/TutorHistoryItemCard'
import { useTutorHistoryQuery } from '@/hooks/Tutor/useTutor'
import type {
  TutorSessionStatus,
  TutorSessionSummary,
  TutorSessionSummaryStats,
} from '@/types/Tutor/tutor'
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

  // History query & pagination
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [accumulatedItems, setAccumulatedItems] = useState<TutorSessionSummary[]>([])

  const { data: historyData, isPending: isHistoryPending, isError: isHistoryError, refetch: refetchHistory, isFetching: isHistoryFetching } =
    useTutorHistoryQuery(
      { cursor, limit: 10 },
      true,
    )

  const historyItems = historyData?.items ?? []
  const allHistoryItems = cursor ? [...accumulatedItems, ...historyItems] : historyItems
  const hasMore = historyData?.hasMore ?? false
  const nextCursor = historyData?.nextCursor

  const handleLoadMore = () => {
    if (nextCursor && !isHistoryFetching) {
      setAccumulatedItems(allHistoryItems)
      setCursor(nextCursor)
    }
  }

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
    <Box sx={{ maxWidth: 800, mx: 'auto', py: { xs: 2, sm: 4 } }}>
      {/* 1. Today's Completed Session Summary Card */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3.5,
          borderColor: isCompleted ? 'primary.main' : 'warning.main',
          bgcolor: 'background.paper',
          boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
          textAlign: 'center',
          mb: 5,
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
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, mt: 0.5 }}
            >
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
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#991B1B' }}>
                {t('summary.ratingAgain', 'Chưa nhớ')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#DC2626' }}>
                {summary.ratingDistribution.again}
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#92400E' }}>
                {t('summary.ratingHard', 'Khó nhớ')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#D97706' }}>
                {summary.ratingDistribution.hard}
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#1E40AF' }}>
                {t('summary.ratingGood', 'Nhớ tốt')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#2563EB' }}>
                {summary.ratingDistribution.good}
              </Typography>
            </Box>

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#166534' }}>
                {t('summary.ratingEasy', 'Nhớ sâu')}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#16A34A' }}>
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
              borderColor: '#FECACA',
              bgcolor: '#FEF2F2',
              borderWidth: 1.5,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 1.5, color: '#991B1B' }}
            >
              {t('summary.relearningWords')} ({summary.relearningWords.length})
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {summary.relearningWords.map((word, idx) => (
                <Chip
                  key={idx}
                  label={word}
                  sx={{
                    fontWeight: 700,
                    bgcolor: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid #FCA5A5',
                  }}
                  size="small"
                />
              ))}
            </Stack>
          </Paper>
        ) : null}

        {/* Action button */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
          <Button
            component={RouterLink}
            to={routePaths.home}
            variant="contained"
            size="large"
            sx={{ px: 4, py: 1.25, borderRadius: 2, fontWeight: 700 }}
          >
            {t('summary.backToHome')}
          </Button>
        </Stack>
      </Paper>

      {/* 2. Practice History Section */}
      <Box sx={{ mt: 4 }}>
        <Stack spacing={0.5} sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            {t('history.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('history.subtitle')}
          </Typography>
        </Stack>

        {isHistoryPending && !cursor ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '30vh',
              py: 6,
              gap: 2,
            }}
          >
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary">
              {t('history.loading')}
            </Typography>
          </Box>
        ) : isHistoryError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void refetchHistory()}>
                Thử lại
              </Button>
            }
          >
            {t('errors.loadFailed')}
          </Alert>
        ) : allHistoryItems.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {t('history.emptyDesc')}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {allHistoryItems.map((sessionItem) => (
              <TutorHistoryItemCard key={sessionItem.id} session={sessionItem} />
            ))}

            {hasMore ? (
              <Box sx={{ textAlign: 'center', pt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={isHistoryFetching}
                  size="large"
                  sx={{ borderRadius: 2, px: 4, fontWeight: 700 }}
                >
                  {isHistoryFetching ? (
                    <CircularProgress size={24} />
                  ) : (
                    t('history.loadMore')
                  )}
                </Button>
              </Box>
            ) : null}
          </Stack>
        )}
      </Box>
    </Box>
  )
}

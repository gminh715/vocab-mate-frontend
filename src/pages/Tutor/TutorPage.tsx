import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SparklesIcon } from '@/components/Dashboard/DashboardIcons'
import { LoadingState } from '@/components/Shared/LoadingState'
import { TutorHistoryItemCard } from '@/components/Tutor/TutorHistoryItemCard'
import { TutorTodayNotDoneCard } from '@/components/Tutor/TutorTodayNotDoneCard'
import { TutorTodayResultCard } from '@/components/Tutor/TutorTodayResultCard'
import { useTodayStatusQuery, useTutorHistoryQuery } from '@/hooks/Tutor/useTutor'
import type { TutorSessionSummary } from '@/types/Tutor/tutor'

export function TutorPage() {
  const { t } = useTranslation('tutor')

  // 1. Today's Status Query
  const {
    data: todayStatus,
    isPending: isTodayPending,
    isError: isTodayError,
    refetch: refetchToday,
  } = useTodayStatusQuery()

  // 2. History Query & Pagination
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [accumulatedItems, setAccumulatedItems] = useState<
    TutorSessionSummary[]
  >([])

  const {
    data: historyData,
    isPending: isHistoryPending,
    isError: isHistoryError,
    refetch: refetchHistory,
    isFetching: isHistoryFetching,
  } = useTutorHistoryQuery({ cursor, limit: 10 }, true)

  const historyItems = historyData?.items ?? []
  const allHistoryItems = cursor
    ? [...accumulatedItems, ...historyItems]
    : historyItems
  const hasMore = historyData?.hasMore ?? false
  const nextCursor = historyData?.nextCursor

  const handleLoadMore = () => {
    if (nextCursor && !isHistoryFetching) {
      setAccumulatedItems(allHistoryItems)
      setCursor(nextCursor)
    }
  }

  return (
    <Box sx={{ maxWidth: 840, mx: 'auto', py: { xs: 2, sm: 4 } }}>
      {/* TOP SECTION: Today's Test Result OR CTA Card */}
      <Box sx={{ mb: 6 }}>
        {isTodayPending ? (
          <LoadingState minHeight={200} paper={false} />
        ) : isTodayError || !todayStatus ? (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => void refetchToday()}>
                Thử lại
              </Button>
            }
          >
            {t('errors.loadFailed')}
          </Alert>
        ) : (todayStatus.isCompletedToday || todayStatus.isAbandoned) &&
          todayStatus.session ? (
          <TutorTodayResultCard session={todayStatus.session} />
        ) : (
          <TutorTodayNotDoneCard status={todayStatus} />
        )}
      </Box>

      {/* BOTTOM SECTION: Practice History */}
      <Box>
        <Stack spacing={0.5} sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            {t('history.title', 'Lịch sử luyện tập')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              'history.subtitle',
              'Xem lại các phiên học và sự tiến bộ trong vốn từ vựng của bạn theo thời gian.',
            )}
          </Typography>
        </Stack>

        {isHistoryPending && !cursor ? (
          <LoadingState minHeight={240} paper={false} />
        ) : isHistoryError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void refetchHistory()}
              >
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
              p: 5,
              borderRadius: 3,
              textAlign: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                mx: 'auto',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.light',
                color: 'primary.main',
              }}
            >
              <SparklesIcon size={28} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {t('history.emptyTitle')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ maxWidth: 460, mx: 'auto' }}
            >
              {t('history.emptyDesc')}
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {allHistoryItems.map((session) => (
              <TutorHistoryItemCard key={session.id} session={session} />
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

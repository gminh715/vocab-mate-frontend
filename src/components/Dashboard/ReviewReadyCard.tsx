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
import { normalizeApiError } from '@/config/apiClient'
import {
  useActiveReviewSessionQuery,
  useTodayReviewsQuery,
} from '@/hooks/Review/useReviews'
import {
  reviewSessionPath,
  reviewStartPath,
} from '@/utils/paths'
import { ArrowRightIcon, ClockIcon, FlameIcon, SparklesIcon } from './DashboardIcons'

const numberFormatter = new Intl.NumberFormat()
const SECONDS_PER_WORD_ESTIMATE = 20

const estimatedMinutes = (count: number): number =>
  count === 0
    ? 0
    : Math.max(1, Math.ceil((count * SECONDS_PER_WORD_ESTIMATE) / 60))

export function ReviewReadyCard() {
  const { t } = useTranslation('home')
  const todayQuery = useTodayReviewsQuery()
  const activeQuery = useActiveReviewSessionQuery()
  const activeSession = activeQuery.data
  const dueCount = todayQuery.data?.dueVocabularyCount ?? 0
  const hasExpectedMissingActiveSession =
    activeQuery.isError && normalizeApiError(activeQuery.error).status === 404
  const activeRemaining = activeSession?.progress.remainingCount
  const durationCount = activeRemaining ?? dueCount
  const destination = activeSession
    ? reviewSessionPath(activeSession.session.id)
    : reviewStartPath({ sessionType: 'DAILY_REVIEW' })
  const canStart = Boolean(activeSession) || dueCount > 0

  return (
    <Paper
      component="section"
      aria-labelledby="review-ready-title"
      variant="outlined"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderColor: 'primary.main',
        borderRadius: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.light}15 100%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 6,
          bgcolor: activeSession ? 'warning.main' : 'primary.main',
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr auto' },
          gap: { xs: 2.5, md: 3 },
          alignItems: 'center',
          p: { xs: 2.5, sm: 3 },
          pl: { xs: 3.5, sm: 4 },
        }}
      >
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: activeSession ? 'warning.light' : 'primary.light',
                color: activeSession ? 'warning.dark' : 'primary.dark',
              }}
            >
              {activeSession ? <FlameIcon size={16} /> : <SparklesIcon size={16} />}
            </Box>
            <Typography
              sx={{
                color: activeSession ? 'warning.dark' : 'primary.dark',
                fontSize: 12,
                fontWeight: 850,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {activeSession ? t('review.sessionInProgress') : t('review.dailyReview')}
            </Typography>
            {dueCount > 0 && !activeSession ? (
              <Chip
                size="small"
                label={t('review.readyChip')}
                color="secondary"
                sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
              />
            ) : null}
          </Stack>

          <Typography
            id="review-ready-title"
            component="h2"
            variant="h2"
            sx={{ fontSize: { xs: 24, sm: 28 }, fontWeight: 700 }}
          >
            {activeSession ? t('review.pickUpTitle') : t('review.keepWordsTitle')}
          </Typography>
        </Box>

        {todayQuery.isPending ? (
          <Stack role="status" aria-label={t('review.loadingLabel')} spacing={0.75}>
            <Skeleton width={120} height={20} />
            <Skeleton width={180} height={36} />
          </Stack>
        ) : todayQuery.isError && !hasExpectedMissingActiveSession ? (
          <Alert severity="warning" sx={{ py: 0.5 }}>
            {t('review.errorMessage')}
          </Alert>
        ) : (
          <Stack
            direction="row"
            spacing={{ xs: 2.5, sm: 4 }}
            sx={{
              p: 1.5,
              px: 2.5,
              borderRadius: 2,
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              width: 'fit-content',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Merriweather", serif',
                  fontSize: { xs: 26, sm: 30 },
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  color: 'primary.main',
                }}
              >
                {numberFormatter.format(dueCount)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('review.wordReady', { count: dueCount })}
              </Typography>
            </Box>

            <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: { xs: 2.5, sm: 4 } }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <ClockIcon size={16} />
                <Typography
                  sx={{
                    fontFamily: '"Merriweather", serif',
                    fontSize: { xs: 26, sm: 30 },
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  ~{estimatedMinutes(durationCount)} min
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t('review.estTime')}
              </Typography>
            </Box>
          </Stack>
        )}

        <Button
          component={RouterLink}
          to={destination}
          variant="contained"
          size="large"
          endIcon={<ArrowRightIcon size={18} />}
          disabled={
            !activeSession &&
            (todayQuery.isPending ||
              todayQuery.isError ||
              (!canStart &&
                todayQuery.data !== undefined &&
                dueCount === 0))
          }
          sx={{
            py: 1.5,
            px: 3,
            borderRadius: 2,
            boxShadow: 2,
            whiteSpace: 'nowrap',
          }}
        >
          {activeSession ? t('review.resumeReview') : dueCount > 0 ? t('review.startReview') : t('review.noReviewsDue')}
        </Button>
      </Box>
    </Paper>
  )
}

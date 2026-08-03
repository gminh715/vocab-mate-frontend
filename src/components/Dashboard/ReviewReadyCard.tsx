import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
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

const numberFormatter = new Intl.NumberFormat()
const SECONDS_PER_WORD_ESTIMATE = 20

const estimatedMinutes = (count: number): number =>
  count === 0
    ? 0
    : Math.max(1, Math.ceil((count * SECONDS_PER_WORD_ESTIMATE) / 60))

export function ReviewReadyCard() {
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
        bgcolor: 'background.paper',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          width: 7,
          bgcolor: 'secondary.main',
        },
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.25fr 1fr auto' },
          gap: { xs: 2.5, md: 4 },
          alignItems: 'center',
          p: { xs: 2.5, sm: 3 },
          pl: { xs: 3.5, sm: 4 },
        }}
      >
        <Box>
          <Typography
            sx={{
              color: 'secondary.dark',
              fontSize: 12,
              fontWeight: 850,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {activeSession ? 'Ready when you are' : 'Today’s review'}
          </Typography>
          <Typography
            id="review-ready-title"
            component="h2"
            variant="h2"
            sx={{ mt: 0.75, fontSize: { xs: 28, sm: 34 }, textWrap: 'balance' }}
          >
            {activeSession ? 'Pick up where you left off' : 'Keep familiar words close'}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 560 }}>
            One short question at a time. Your next review is arranged for you.
          </Typography>
        </Box>

        {todayQuery.isPending ? (
          <Stack role="status" aria-label="Loading today’s review" spacing={0.75}>
            <Skeleton width={150} />
            <Skeleton width={210} height={42} />
          </Stack>
        ) : todayQuery.isError ? (
          <Alert severity="warning" sx={{ py: 0.5 }}>
            Review details could not be loaded. Try again shortly.
          </Alert>
        ) : (
          <Stack direction="row" spacing={{ xs: 3, sm: 5 }}>
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 34,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {numberFormatter.format(dueCount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {dueCount === 1 ? 'word ready' : 'words ready'}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 34,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                ~{estimatedMinutes(durationCount)} min
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                estimated time
              </Typography>
            </Box>
          </Stack>
        )}

        <Button
          component={RouterLink}
          to={destination}
          variant="contained"
          size="large"
          disabled={
            !activeSession &&
            (todayQuery.isPending ||
              todayQuery.isError ||
              (!canStart &&
                (activeQuery.isSuccess || hasExpectedMissingActiveSession)))
          }
          sx={{ minWidth: { sm: 156 }, whiteSpace: 'nowrap' }}
        >
          {activeSession ? 'Resume Review' : 'Start Review'}
        </Button>
      </Box>
    </Paper>
  )
}

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom'
import { normalizeApiError } from '@/config/apiClient'
import { SkillBreakdown } from '@/components/Review/SkillBreakdown'
import { useReviewSummaryQuery } from '@/hooks/Review/useReviews'
import type { ReviewResult } from '@/types/Review/review'
import { reviewStartPath, routePaths } from '@/utils/paths'
import { useTranslation } from 'react-i18next'

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 0,
})
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const resultFromLocationState = (state: unknown): ReviewResult | null => {
  if (typeof state !== 'object' || state === null || !('result' in state)) {
    return null
  }
  const result = state.result
  if (
    typeof result !== 'object' ||
    result === null ||
    !('accuracy' in result) ||
    typeof result.accuracy !== 'number' ||
    !('correctCount' in result) ||
    typeof result.correctCount !== 'number' ||
    !('completedAt' in result) ||
    typeof result.completedAt !== 'string'
  ) {
    return null
  }
  if (
    !('score' in result) ||
    typeof result.score !== 'number' ||
    !('totalPoints' in result) ||
    typeof result.totalPoints !== 'number'
  ) {
    return null
  }
  return {
    score: result.score,
    totalPoints: result.totalPoints,
    accuracy: result.accuracy,
    correctCount: result.correctCount,
    completedAt: result.completedAt,
  }
}

export function ReviewSummaryPage() {
  const { t } = useTranslation('review')
  const { sessionId = '' } = useParams()
  const location = useLocation()
  const navigationResult = resultFromLocationState(location.state)
  const summaryQuery = useReviewSummaryQuery(sessionId)
  const result = summaryQuery.data?.result ?? navigationResult
  const incorrectAnswers = summaryQuery.data?.answers.filter((answer) => !answer.isCorrect) ?? []
  const skillBreakdown = summaryQuery.data?.skillBreakdown ?? []
  const wordsToRevisit = summaryQuery.data?.wordsToRevisit ?? []

  if (!result && summaryQuery.isPending) {
    return (
      <Box component="main" sx={{ minHeight: '100svh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', p: 2 }}>
        <Stack role="status" spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress size={38} />
          <Typography color="text.secondary">{t('summary.loading')}</Typography>
        </Stack>
      </Box>
    )
  }

  if (!result && summaryQuery.isError) {
    const error = normalizeApiError(summaryQuery.error)
    return (
      <Box component="main" sx={{ minHeight: '100svh', bgcolor: 'background.default', p: { xs: 2, sm: 4 } }}>
        <Alert
          severity="error"
          sx={{ maxWidth: 760, mx: 'auto' }}
          action={
            <Button color="inherit" onClick={() => void summaryQuery.refetch()}>
              {t('summary.tryAgain')}
            </Button>
          }
        >
          {error.status === 409
            ? t('summary.errors.inProgress')
            : t('summary.errors.load')}
        </Alert>
      </Box>
    )
  }

  if (!result) return null

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100svh',
        bgcolor: 'background.default',
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 6 },
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 760, mx: 'auto' }}>
        {!summaryQuery.data && navigationResult && summaryQuery.isPending ? (
          <Alert severity="info" role="status">
            {t('summary.temporary')}
          </Alert>
        ) : null}
        {!summaryQuery.data && navigationResult && summaryQuery.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void summaryQuery.refetch()}>
                {t('summary.retry')}
              </Button>
            }
          >
            {t('summary.errors.temporary')}
          </Alert>
        ) : null}
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center', borderTop: 6, borderTopColor: 'primary.main' }}>
          <Typography component="h1" variant="h1" sx={{ fontSize: { xs: 38, sm: 52 } }}>
            {t('summary.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.25 }}>
            {t('summary.finished', {
              date: dateFormatter.format(new Date(result.completedAt)),
            })}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 1.5,
              mt: 3.5,
            }}
          >
            {[
              { label: t('summary.remembered'), value: result.correctCount.toString() },
              { label: t('summary.accuracy'), value: percentFormatter.format(result.accuracy) },
            ].map((metric) => (
              <Box key={metric.label} sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                <Typography sx={{ fontFamily: '"Merriweather", serif', fontSize: { xs: 30, sm: 36 }, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {metric.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
              </Box>
            ))}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3.5, justifyContent: 'center' }}>
            <Button component={RouterLink} to={routePaths.home} variant="contained">
              {t('summary.backHome')}
            </Button>
            <Button component={RouterLink} to={reviewStartPath()} variant="outlined">
              {t('summary.startAnother')}
            </Button>
            <Button component={RouterLink} to={routePaths.reviewHistory} color="inherit">
              {t('summary.viewHistory')}
            </Button>
          </Stack>
        </Paper>

        {skillBreakdown.length > 0 ? (
          <Paper
            component="section"
            aria-labelledby="skill-breakdown-title"
            variant="outlined"
            sx={{ p: { xs: 2.5, sm: 3 }, borderLeft: 6, borderLeftColor: 'primary.main' }}
          >
            <Typography id="skill-breakdown-title" component="h2" variant="h2" sx={{ fontSize: 27 }}>
              {t('summary.skillsTitle')}
            </Typography>
            <SkillBreakdown items={skillBreakdown} labelledBy="skill-breakdown-title" />
          </Paper>
        ) : null}

        {wordsToRevisit.length > 0 || incorrectAnswers.length > 0 ? (
          <Paper component="section" aria-labelledby="review-notes-title" variant="outlined" sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography id="review-notes-title" component="h2" variant="h2" sx={{ fontSize: 27 }}>
              {t('summary.wordsTitle')}
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              {(wordsToRevisit.length > 0
                ? wordsToRevisit
                : incorrectAnswers.map((answer) => ({
                    userVocabularyId: null,
                    wordOrPhrase: answer.correctAnswer,
                    meaningVi: null,
                    skillDimension: null,
                    errorType: null,
                    explanation: answer.explanation,
                    recoveredInSession: false,
                  }))).map((word, index) => (
                <Box key={word.userVocabularyId ?? `${word.wordOrPhrase}-${index}`} sx={{ p: 2, borderLeft: 4, borderColor: 'secondary.main', bgcolor: 'secondary.light' }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 850, overflowWrap: 'anywhere' }}>{word.wordOrPhrase}</Typography>
                    {word.recoveredInSession ? (
                      <Chip size="small" color="success" label={t('summary.recovered')} />
                    ) : null}
                  </Stack>
                  {word.meaningVi ? (
                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, overflowWrap: 'anywhere' }}>
                      {word.meaningVi}
                    </Typography>
                  ) : null}
                  {word.explanation ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
                      {word.explanation}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Box>
  )
}

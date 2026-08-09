import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Link as RouterLink,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { normalizeApiError } from '@/config/apiClient'
import { AgentFeedbackCard } from '@/components/Review/AgentFeedbackCard'
import { ConfirmationDialog } from '@/components/Shared/ConfirmationDialog'
import {
  useAbandonReviewSessionMutation,
  useActiveReviewSessionQuery,
  useReviewSessionQuery,
  useSkipReviewItemMutation,
  useStartReviewSessionMutation,
  useSubmitReviewAnswerMutation,
} from '@/hooks/Review/useReviews'
import type {
  ReviewQuestion,
  ReviewSessionItem,
  ReviewResult,
  SkippedReviewItem,
  StartReviewSessionRequest,
  SubmittedReviewAnswer,
} from '@/types/Review/review'
import {
  REVIEW_GOALS,
  REVIEW_TARGET_DURATIONS,
} from '@/types/Review/review'
import {
  reviewSessionPath,
  reviewSummaryPath,
  routePaths,
} from '@/utils/paths'

const CORRECT_FEEDBACK_DELAY_MS = 900
const COACHING_WAIT_LIMIT_MS = 5_000
const MAX_RESPONSE_TIME_MS = 2_147_483_647
const ACTIVE_SESSION_RECOVERY_INTERVAL_MS = 1_000

interface ReviewSummaryNavigationState {
  result: ReviewResult
}

type ReviewTransition = SubmittedReviewAnswer | SkippedReviewItem

const questionHints = (question: ReviewQuestion): string[] => {
  switch (question.questionType) {
    case 'FILL_BLANK':
      return [
        'Read the whole sentence and notice what kind of word the blank needs.',
        'Check the words beside the blank for clues about tense, form, or number.',
      ]
    case 'SELECT_MEANING':
      return [
        'Recall how the word was used in its original sentence.',
        'Choose the most specific meaning that fits that context.',
      ]
    case 'SELECT_WORD':
      return [
        'Say the meaning in your own words before looking at the choices again.',
        'Look for the word whose form and tone best match the meaning.',
      ]
    case 'SELECT_CORRECT_CONTEXT':
      return [
        'Look for the sentence where the word carries the meaning you learned.',
        'Read each choice with the target word and remove contexts that feel unrelated.',
      ]
  }
}

const startRequestFromSearch = (
  searchParams: URLSearchParams,
): StartReviewSessionRequest | null => {
  const sessionType = searchParams.get('sessionType') ?? 'DAILY_REVIEW'
  const quizId = searchParams.get('quizId')
  const articleId = searchParams.get('articleId')
  const collectionId = searchParams.get('collectionId')
  const durationParam = searchParams.get('targetDurationMinutes')
  const goalParam = searchParams.get('reviewGoal')

  if (sessionType === 'DAILY_REVIEW') {
    const targetDurationMinutes =
      REVIEW_TARGET_DURATIONS.find(
        (duration) => String(duration) === durationParam,
      ) ?? (durationParam === null ? 10 : null)
    const reviewGoal =
      REVIEW_GOALS.find((goal) => goal === goalParam) ??
      (goalParam === null ? 'BALANCED' : null)
    return quizId || articleId || collectionId
      ? null
      : targetDurationMinutes && reviewGoal
        ? { sessionType, targetDurationMinutes, reviewGoal }
        : null
  }
  if (durationParam || goalParam) return null
  if (sessionType === 'ARTICLE_REVIEW' && articleId && !quizId && !collectionId) {
    return { sessionType, articleId, limit: 20 }
  }
  if (
    sessionType === 'COLLECTION_REVIEW' &&
    collectionId &&
    !quizId &&
    !articleId
  ) {
    return { sessionType, collectionId, limit: 20 }
  }
  if (sessionType === 'QUIZ' && quizId && !articleId && !collectionId) {
    return { sessionType, quizId, limit: 20 }
  }
  return null
}

function ReviewShell({
  children,
  actions,
}: {
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  const { t } = useTranslation('review')

  return (
    <Box
      sx={{
        minHeight: '100svh',
        bgcolor: 'background.default',
        px: { xs: 2, sm: 3 },
        pt: 'max(18px, env(safe-area-inset-top))',
        pb: 'max(24px, env(safe-area-inset-bottom))',
      }}
    >
      <Button
        component="a"
        href="#review-main"
        size="small"
        variant="contained"
        sx={{
          position: 'fixed',
          zIndex: (theme) => theme.zIndex.tooltip + 1,
          top: 'max(12px, env(safe-area-inset-top))',
          left: 12,
          transform: 'translateY(calc(-100% - 24px))',
          '&:focus-visible': { transform: 'translateY(0)' },
        }}
      >
        {t('session.skipToReview')}
      </Button>
      <Stack
        component="header"
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          maxWidth: 860,
          mx: 'auto',
          minHeight: 52,
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography
          component={RouterLink}
          to={routePaths.home}
          translate="no"
          sx={{
            color: 'primary.dark',
            fontFamily: '"Merriweather", serif',
            fontSize: 22,
            fontWeight: 700,
            textDecoration: 'none',
            alignSelf: 'flex-start',
            '&:focus-visible': {
              outline: '3px solid rgba(23, 107, 75, 0.28)',
              outlineOffset: 3,
            },
          }}
        >
          Vocab Mate
        </Typography>
        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {actions ?? (
            <Button component={RouterLink} to={routePaths.home} color="inherit">
              Exit
            </Button>
          )}
        </Box>
      </Stack>
      <Box
        id="review-main"
        component="main"
        tabIndex={-1}
        sx={{ maxWidth: 860, mx: 'auto', mt: { xs: 2, sm: 4 } }}
      >
        {children}
      </Box>
    </Box>
  )
}

function ReviewStarter() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const mutation = useStartReviewSessionMutation()
  const activeSessionQuery = useActiveReviewSessionQuery(
    mutation.isPending ? ACTIVE_SESSION_RECOVERY_INTERVAL_MS : false,
  )
  const startedRef = useRef(false)
  const searchString = searchParams.toString()
  const request = useMemo(
    () => startRequestFromSearch(new URLSearchParams(searchString)),
    [searchString],
  )

  const start = useCallback(() => {
    if (!request || mutation.isPending) return
    startedRef.current = true
    mutation.mutate(request, {
      onSuccess: (state) => {
        navigate(reviewSessionPath(state.session.id), { replace: true })
      },
    })
  }, [mutation, navigate, request])

  useEffect(() => {
    if (!startedRef.current) start()
  }, [start])

  const recoveredSessionId =
    activeSessionQuery.data?.session.status === 'IN_PROGRESS'
      ? activeSessionQuery.data.session.id
      : null

  useEffect(() => {
    if (recoveredSessionId) {
      navigate(reviewSessionPath(recoveredSessionId), { replace: true })
    }
  }, [navigate, recoveredSessionId])

  if (!request) {
    return (
      <ReviewShell>
        <Alert severity="error">
          This review link is not valid. Return home and choose a review again.
        </Alert>
      </ReviewShell>
    )
  }

  if (mutation.isError) {
    const error = normalizeApiError(mutation.error)
    const noEligibleVocabulary = error.status === 404

    return (
      <ReviewShell>
        <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Typography component="h1" variant="h1" sx={{ fontSize: { xs: 34, sm: 44 } }}>
            {noEligibleVocabulary ? 'Nothing is ready here yet' : 'Review could not start'}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 560, mx: 'auto' }}>
            {noEligibleVocabulary
              ? 'There are no saved words ready for this review. Keep reading or choose another collection.'
              : 'Your saved words are safe. Check your connection and try again.'}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ mt: 3, justifyContent: 'center' }}
          >
            {!noEligibleVocabulary ? (
              <Button
                variant="contained"
                onClick={() => {
                  startedRef.current = false
                  mutation.reset()
                  start()
                }}
              >
                Try Again
              </Button>
            ) : null}
            <Button component={RouterLink} to={routePaths.home} variant="outlined">
              Back Home
            </Button>
          </Stack>
        </Paper>
      </ReviewShell>
    )
  }

  return (
    <ReviewShell>
      <Stack role="status" spacing={2} sx={{ minHeight: 360, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={38} />
        <Typography color="text.secondary">Preparing your review…</Typography>
      </Stack>
    </ReviewShell>
  )
}

function ReviewSessionExperience({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation('review')
  const navigate = useNavigate()
  const sessionQuery = useReviewSessionQuery(sessionId)
  const answerMutation = useSubmitReviewAnswerMutation(sessionId)
  const skipMutation = useSkipReviewItemMutation(sessionId)
  const abandonMutation = useAbandonReviewSessionMutation(sessionId)
  const [transitionItem, setTransitionItem] = useState<ReviewSessionItem | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [feedback, setFeedback] = useState<SubmittedReviewAnswer | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [hasStaleConflict, setHasStaleConflict] = useState(false)
  const [staleRecoveryReady, setStaleRecoveryReady] = useState(false)
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [endSessionError, setEndSessionError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [coachingWaitExpired, setCoachingWaitExpired] = useState(false)
  const questionStartedAtRef = useRef(0)
  const submissionLockRef = useRef(false)
  const activeSubmissionRef = useRef(0)
  const questionHeadingRef = useRef<HTMLHeadingElement>(null)
  const displayItem = transitionItem ?? sessionQuery.data?.nextItem ?? null
  const displayItemId = displayItem?.id
  const displayQuestionId = displayItem?.question.id

  const resetQuestion = useCallback((nextItem: ReviewSessionItem) => {
    setTransitionItem(nextItem)
    setSelectedOptionId(null)
    setAnswerText('')
    setHintsUsed(0)
    setFeedback(null)
    setActionError(null)
    setHasStaleConflict(false)
    setStaleRecoveryReady(false)
    setCoachingWaitExpired(false)
    questionStartedAtRef.current = Date.now()
    submissionLockRef.current = false
    setIsLocked(false)
  }, [])

  const finishOrAdvance = useCallback(
    (transition: ReviewTransition) => {
      if (transition.sessionCompleted && transition.completionSummary) {
        const state: ReviewSummaryNavigationState = {
          result: transition.completionSummary,
        }
        navigate(reviewSummaryPath(sessionId), { replace: true, state })
        return
      }
      if (transition.nextQuestion) {
        resetQuestion(transition.nextQuestion)
        return
      }
      submissionLockRef.current = false
      setIsLocked(false)
      setActionError('The next question is not available. Reload this review to continue.')
    },
    [navigate, resetQuestion, sessionId],
  )

  useEffect(() => {
    const state = sessionQuery.data
    if (!state) return
    if (state.session.status === 'COMPLETED') {
      navigate(reviewSummaryPath(sessionId), { replace: true })
    }
  }, [navigate, sessionId, sessionQuery.data])

  useEffect(() => {
    if (!displayItemId) return
    questionStartedAtRef.current = Date.now()
    questionHeadingRef.current?.focus()
  }, [displayItemId, displayQuestionId])

  useEffect(() => {
    if (!answerMutation.isPending) return
    const timer = window.setTimeout(
      () => setCoachingWaitExpired(true),
      COACHING_WAIT_LIMIT_MS,
    )
    return () => window.clearTimeout(timer)
  }, [answerMutation.isPending])

  useEffect(() => {
    if (!feedback?.isCorrect) return
    const timer = window.setTimeout(
      () => finishOrAdvance(feedback),
      CORRECT_FEEDBACK_DELAY_MS,
    )
    return () => window.clearTimeout(timer)
  }, [feedback, finishOrAdvance])

  const progress = feedback?.progress ?? sessionQuery.data?.progress
  const persistedPlanSummary = sessionQuery.data?.session.planSummary?.trim()
  const visibleAgentFeedback =
    feedback?.agentFeedback ?? sessionQuery.data?.agentFeedback
  const question = displayItem?.question
  const hints = question ? questionHints(question) : []
  const isFillBlank = question?.questionType === 'FILL_BLANK'
  const canSubmit = Boolean(
    displayItem &&
      !feedback &&
      (isFillBlank ? answerText.trim() : selectedOptionId),
  )
  const isBusy =
    isLocked ||
    hasStaleConflict ||
    answerMutation.isPending ||
    skipMutation.isPending ||
    abandonMutation.isPending

  const refreshAfterStaleConflict = async () => {
    const refreshed = await sessionQuery.refetch()
    const canRecover = Boolean(
      !refreshed.isError &&
        (refreshed.data?.nextItem ||
          refreshed.data?.session.status === 'COMPLETED'),
    )
    setStaleRecoveryReady(canRecover)
    setActionError(
      canRecover
        ? 'This question changed in another request. The latest review state is ready.'
        : 'The latest review state could not be loaded. Try refreshing again.',
    )
  }

  const recoverFromStaleConflict = () => {
    const latestState = sessionQuery.data
    if (latestState?.session.status === 'COMPLETED') {
      navigate(reviewSummaryPath(sessionId), { replace: true })
      return
    }
    if (!latestState?.nextItem) {
      void refreshAfterStaleConflict()
      return
    }
    resetQuestion(latestState.nextItem)
  }

  const continueFromSavedProgress = async () => {
    setActionError(null)
    const refreshed = await sessionQuery.refetch()
    if (refreshed.data?.session.status === 'COMPLETED') {
      activeSubmissionRef.current += 1
      navigate(reviewSummaryPath(sessionId), { replace: true })
      return
    }
    const latestItem = refreshed.data?.nextItem
    if (
      latestItem &&
      (latestItem.id !== displayItemId ||
        latestItem.question.id !== displayQuestionId)
    ) {
      activeSubmissionRef.current += 1
      resetQuestion(latestItem)
      return
    }
    setActionError(t('coaching.notReady'))
  }

  const submitAnswer = async () => {
    if (
      !displayItem ||
      !question ||
      !canSubmit ||
      submissionLockRef.current ||
      answerMutation.isPending ||
      skipMutation.isPending
    ) return
    submissionLockRef.current = true
    const submissionId = activeSubmissionRef.current + 1
    activeSubmissionRef.current = submissionId
    setIsLocked(true)
    setCoachingWaitExpired(false)
    setActionError(null)
    setTransitionItem(displayItem)

    try {
      const elapsed = Math.min(
        Math.max(Date.now() - questionStartedAtRef.current, 0),
        MAX_RESPONSE_TIME_MS,
      )
      const result = await answerMutation.mutateAsync({
        reviewSessionItemId: displayItem.id,
        quizQuestionId: question.id,
        ...(isFillBlank
          ? { userAnswerText: answerText.trim() }
          : selectedOptionId
            ? { selectedOptionId }
            : {}),
        responseTimeMs: elapsed,
        hintsUsed,
      })
      if (submissionId !== activeSubmissionRef.current) return
      setCoachingWaitExpired(false)
      setFeedback(result)
    } catch (error: unknown) {
      if (submissionId !== activeSubmissionRef.current) return
      submissionLockRef.current = false
      setIsLocked(false)
      setCoachingWaitExpired(false)
      const apiError = normalizeApiError(error)
      if (apiError.status === 409) {
        setHasStaleConflict(true)
        setStaleRecoveryReady(false)
        setActionError('This question changed. Loading the latest review state…')
        await refreshAfterStaleConflict()
      } else {
        setActionError(
          'Your answer could not be saved. Check your connection and try again.',
        )
      }
    }
  }

  const skipQuestion = async () => {
    if (
      !displayItem ||
      !question ||
      feedback ||
      submissionLockRef.current ||
      answerMutation.isPending ||
      skipMutation.isPending
    ) return
    submissionLockRef.current = true
    setIsLocked(true)
    setActionError(null)

    try {
      const result = await skipMutation.mutateAsync({
        reviewSessionItemId: displayItem.id,
        quizQuestionId: question.id,
      })
      finishOrAdvance(result)
    } catch (error: unknown) {
      submissionLockRef.current = false
      setIsLocked(false)
      const apiError = normalizeApiError(error)
      if (apiError.status === 409) {
        setHasStaleConflict(true)
        setStaleRecoveryReady(false)
        setActionError('This question changed. Loading the latest review state…')
        await refreshAfterStaleConflict()
      } else {
        setActionError(
          'This word could not be skipped. Check your connection and try again.',
        )
      }
    }
  }

  const endSession = async () => {
    setEndSessionError(null)
    try {
      await abandonMutation.mutateAsync()
      navigate(routePaths.home, { replace: true })
    } catch (error: unknown) {
      const apiError = normalizeApiError(error)
      setEndSessionError(
        apiError.status === 409
          ? 'This session changed before it could be ended. Close this dialog and refresh the review.'
          : 'The session could not be ended. Check your connection and try again.',
      )
    }
  }

  if (sessionQuery.isError) {
    const error = normalizeApiError(sessionQuery.error)
    return (
      <ReviewShell>
        <Alert
          severity="error"
          action={
            error.status !== 404 ? (
              <Button color="inherit" onClick={() => void sessionQuery.refetch()}>
                Try Again
              </Button>
            ) : undefined
          }
        >
          {error.status === 404
            ? 'This review session is not available.'
            : 'Your review could not be restored. Try again.'}
        </Alert>
      </ReviewShell>
    )
  }

  if (sessionQuery.data?.session.status === 'ABANDONED') {
    return (
      <ReviewShell>
        <Alert
          severity="info"
          action={
            <Button component={RouterLink} to={routePaths.home} color="inherit">
              {t('session.backHome')}
            </Button>
          }
        >
          {t('session.ended')}
        </Alert>
      </ReviewShell>
    )
  }

  if (sessionQuery.isPending || !progress || !displayItem || !question) {
    return (
      <ReviewShell>
        <Stack role="status" spacing={2} sx={{ minHeight: 360, alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={38} />
          <Typography color="text.secondary">Restoring your review…</Typography>
        </Stack>
      </ReviewShell>
    )
  }

  return (
    <ReviewShell
      actions={
        <Stack
          direction="row"
          spacing={0.5}
          useFlexGap
          sx={{
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            '& .MuiButton-root': {
              flex: { xs: '1 1 132px', sm: '0 0 auto' },
            },
          }}
        >
          <Button
            component={RouterLink}
            to={routePaths.home}
            color="inherit"
            disabled={
              isBusy && !(answerMutation.isPending && coachingWaitExpired)
            }
          >
            Save and exit
          </Button>
          <Button
            color="error"
            disabled={isBusy}
            onClick={() => {
              setEndSessionError(null)
              abandonMutation.reset()
              setEndDialogOpen(true)
            }}
          >
            End session
          </Button>
        </Stack>
      }
    >
      <Stack spacing={{ xs: 2.5, sm: 3.5 }}>
        <Paper
          component="section"
          aria-labelledby="review-plan-heading"
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            bgcolor: 'primary.light',
            borderColor: 'primary.main',
          }}
        >
          <Typography
            sx={{
              color: 'primary.dark',
              fontSize: 12,
              fontWeight: 850,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {t('plan.eyebrow')}
          </Typography>
          <Typography
            id="review-plan-heading"
            component="h1"
            variant="h5"
            sx={{ mt: 0.5, fontWeight: 850, textWrap: 'balance' }}
          >
            {t('plan.title')}
          </Typography>
          <Typography sx={{ mt: 0.75, overflowWrap: 'anywhere' }}>
            {persistedPlanSummary ||
              t('plan.summary', {
                sessionType: t(
                  `plan.sessionTypes.${sessionQuery.data.session.sessionType}`,
                ),
                count: progress.totalQuestions,
              })}
          </Typography>
          {sessionQuery.data.session.targetDurationMinutes &&
          sessionQuery.data.session.reviewGoal ? (
            <Typography
              variant="body2"
              sx={{ mt: 1, color: 'primary.dark', fontWeight: 750 }}
            >
              {t('plan.details', {
                minutes: sessionQuery.data.session.targetDurationMinutes,
                count:
                  sessionQuery.data.session.plannedItemCount ??
                  progress.totalQuestions,
                goal: t(
                  `plan.goals.${sessionQuery.data.session.reviewGoal}`,
                ),
              })}
            </Typography>
          ) : null}
        </Paper>

        <Box>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography sx={{ fontWeight: 800 }}>
              Question {Math.min(progress.answeredCount + 1, progress.totalQuestions)} of {progress.totalQuestions}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {progress.remainingCount} remaining
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progress.progressPercent))}
            aria-label="Review progress"
            sx={{ mt: 1, height: 8, borderRadius: 99, bgcolor: 'primary.light' }}
          />
        </Box>

        {visibleAgentFeedback ? (
          <AgentFeedbackCard feedback={visibleAgentFeedback} />
        ) : null}

        <Paper
          component="section"
          aria-labelledby="review-question"
          variant="outlined"
          sx={{ p: { xs: 2.5, sm: 4.5 }, borderTop: 5, borderTopColor: 'primary.main' }}
        >
          <Typography
            sx={{ color: 'primary.main', fontSize: 12, fontWeight: 850, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            {isFillBlank ? 'Complete the sentence' : 'Choose one answer'}
          </Typography>
          <Typography
            id="review-question"
            ref={questionHeadingRef}
            tabIndex={-1}
            component="h2"
            variant="h1"
            sx={{
              mt: 1.25,
              fontSize: { xs: 30, sm: 40 },
              textWrap: 'balance',
              overflowWrap: 'anywhere',
              '&:focus-visible': {
                outline: '3px solid rgba(23, 107, 75, 0.28)',
                outlineOffset: 4,
              },
            }}
          >
            {question.prompt}
          </Typography>

          {question.blankSentence ? (
            <Box
              sx={{ mt: 2.5, p: 2, borderLeft: 4, borderColor: 'secondary.main', bgcolor: 'secondary.light' }}
            >
              <Typography sx={{ fontSize: { xs: 17, sm: 19 }, lineHeight: 1.7 }}>
                {question.blankSentence}
              </Typography>
            </Box>
          ) : null}

          <Box component="form" onSubmit={(event) => { event.preventDefault(); void submitAnswer() }} sx={{ mt: 3 }}>
            {isFillBlank ? (
              <TextField
                label="Your answer"
                name="reviewAnswer"
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                disabled={Boolean(feedback) || isBusy}
                autoComplete="off"
                slotProps={{ htmlInput: { maxLength: 2_000 } }}
              />
            ) : (
              <Stack spacing={1.25} role="group" aria-label="Answer choices">
                {question.options.map((option) => {
                  const selected = selectedOptionId === option.id
                  return (
                    <Button
                      key={option.id}
                      type="button"
                      variant={selected ? 'contained' : 'outlined'}
                      color={feedback && selected ? (feedback.isCorrect ? 'success' : 'error') : 'primary'}
                      aria-pressed={selected}
                      disabled={Boolean(feedback) || isBusy}
                      onClick={() => setSelectedOptionId(option.id)}
                      sx={{
                        minHeight: 54,
                        justifyContent: 'flex-start',
                        px: 2,
                        textAlign: 'left',
                        whiteSpace: 'normal',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {option.text}
                    </Button>
                  )
                })}
              </Stack>
            )}

            {hintsUsed > 0 && !feedback ? (
              <Alert severity="info" aria-live="polite" sx={{ mt: 2 }}>
                {hints[hintsUsed - 1]}
              </Alert>
            ) : null}

            {feedback ? (
              feedback.isCorrect ? (
                <Alert severity="success" role="status" sx={{ mt: 2.5 }}>
                  <Typography sx={{ fontWeight: 800 }}>Nice work.</Typography>
                  <Typography variant="body2">Moving to the next word…</Typography>
                </Alert>
              ) : (
                <Alert severity="error" role="alert" sx={{ mt: 2.5 }}>
                  <Typography sx={{ fontWeight: 850 }}>Correct answer: {feedback.correctAnswer}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {feedback.explanation}
                  </Typography>
                  {feedback.willReturnLater &&
                  !feedback.agentFeedback?.retestAfterItems ? (
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 750 }}>
                      You’ll see this word again near the end with a different question.
                    </Typography>
                  ) : null}
                </Alert>
              )
            ) : null}

            {answerMutation.isPending ? (
              <Alert
                severity="info"
                role="status"
                aria-live="polite"
                sx={{ mt: 2 }}
                action={
                  coachingWaitExpired ? (
                    <Button
                      color="inherit"
                      disabled={sessionQuery.isFetching}
                      onClick={() => void continueFromSavedProgress()}
                    >
                      {t('coaching.continue')}
                    </Button>
                  ) : undefined
                }
              >
                {t(
                  coachingWaitExpired
                    ? 'coaching.delayed'
                    : 'coaching.loading',
                )}
              </Alert>
            ) : null}

            {actionError ? (
              <Alert
                severity="error"
                sx={{ mt: 2 }}
                action={
                  hasStaleConflict ? (
                    <Button
                      color="inherit"
                      disabled={sessionQuery.isFetching}
                      onClick={recoverFromStaleConflict}
                    >
                      {staleRecoveryReady ? 'Use latest question' : 'Refresh'}
                    </Button>
                  ) : undefined
                }
              >
                {actionError}
              </Alert>
            ) : null}

            <Stack
              direction={{ xs: 'column-reverse', sm: 'row' }}
              spacing={1.5}
              sx={{ mt: 3, justifyContent: 'space-between', alignItems: { sm: 'center' } }}
            >
              {!feedback ? (
                <Stack direction="row" spacing={1}>
                  <Button
                    type="button"
                    color="inherit"
                    disabled={isBusy || hintsUsed >= hints.length}
                    onClick={() => setHintsUsed((count) => Math.min(count + 1, hints.length))}
                  >
                    {hintsUsed === 0 ? 'Hint' : 'Another Hint'}
                  </Button>
                  <Button type="button" color="inherit" disabled={isBusy} onClick={() => void skipQuestion()}>
                    {skipMutation.isPending ? 'Skipping…' : 'Skip'}
                  </Button>
                </Stack>
              ) : <Box />}

              {feedback && !feedback.isCorrect ? (
                <Button type="button" variant="contained" onClick={() => finishOrAdvance(feedback)}>
                  Continue
                </Button>
              ) : !feedback ? (
                <Button type="submit" variant="contained" disabled={!canSubmit || isBusy}>
                  {answerMutation.isPending ? 'Checking…' : 'Check Answer'}
                </Button>
              ) : null}
            </Stack>
          </Box>
        </Paper>
      </Stack>
      <ConfirmationDialog
        open={endDialogOpen}
        title="End this review session?"
        description="This closes the current session, so it will no longer be available to resume. Choose Save and exit instead if you want to continue later."
        confirmLabel="End session"
        pendingLabel="Ending…"
        isPending={abandonMutation.isPending}
        errorMessage={endSessionError}
        onCancel={() => {
          if (abandonMutation.isPending) return
          setEndDialogOpen(false)
          setEndSessionError(null)
          abandonMutation.reset()
        }}
        onConfirm={() => void endSession()}
      />
    </ReviewShell>
  )
}

export function ReviewPage() {
  const { sessionId } = useParams()
  return sessionId ? (
    <ReviewSessionExperience sessionId={sessionId} />
  ) : (
    <ReviewStarter />
  )
}

export type { ReviewSummaryNavigationState }

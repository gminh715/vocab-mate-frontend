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
  useRevealReviewHintMutation,
  useReviewSessionQuery,
  useReviewPreparationQuery,
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
  reviewSessionPath,
  reviewSummaryPath,
  routePaths,
} from '@/utils/paths'

const CORRECT_FEEDBACK_DELAY_MS = 900
const COACHING_WAIT_LIMIT_MS = 5_000
const MAX_RESPONSE_TIME_MS = 2_147_483_647
const ACTIVE_SESSION_RECOVERY_INTERVAL_MS = 1_000
const BLANK_MARKER_PATTERN = /_{3,}/u

interface ReviewSummaryNavigationState {
  result: ReviewResult
}

type ReviewTransition = SubmittedReviewAnswer | SkippedReviewItem

interface FillBlankSentenceProps {
  sentence: string
  wordLengths: number[]
  revealedCharacters: Record<string, string>
  slotLabel: string
}

const hintCharacterKey = (wordIndex: number, characterIndex: number): string =>
  `${wordIndex}:${characterIndex}`

function FillBlankSentence({
  sentence,
  wordLengths,
  revealedCharacters,
  slotLabel,
}: FillBlankSentenceProps) {
  const marker = sentence.match(BLANK_MARKER_PATTERN)
  if (!marker || marker.index === undefined) {
    return (
      <Typography sx={{ fontSize: { xs: 17, sm: 19 }, lineHeight: 1.7 }}>
        {sentence}
      </Typography>
    )
  }

  const beforeBlank = sentence.slice(0, marker.index)
  const afterBlank = sentence.slice(marker.index + marker[0].length)

  return (
    <Typography sx={{ fontSize: { xs: 17, sm: 19 }, lineHeight: 1.9 }}>
      {beforeBlank}
      <Box
        component="span"
        role="status"
        aria-live="polite"
        aria-label={slotLabel}
        sx={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          gap: 0.75,
          mx: 0.5,
          verticalAlign: 'baseline',
        }}
      >
        {wordLengths.map((wordLength, wordIndex) => (
          <Box
            key={wordIndex}
            component="span"
            aria-hidden="true"
            sx={{ display: 'inline-flex', gap: 0.3 }}
          >
            {Array.from({ length: wordLength }, (_, characterIndex) => {
              const revealedCharacter =
                revealedCharacters[
                  hintCharacterKey(wordIndex, characterIndex)
                ]
              return (
                <Box
                  key={characterIndex}
                  component="span"
                  sx={{
                    display: 'inline-block',
                    minWidth: '0.8ch',
                    px: revealedCharacter ? 0.25 : 0,
                    color: revealedCharacter ? 'primary.dark' : 'text.primary',
                    bgcolor: revealedCharacter
                      ? 'rgba(23, 107, 75, 0.1)'
                      : 'transparent',
                    borderRadius: 0.5,
                    fontWeight: 850,
                    lineHeight: 1.45,
                    textAlign: 'center',
                  }}
                >
                  {revealedCharacter || '_'}
                </Box>
              )
            })}
          </Box>
        ))}
      </Box>
      {afterBlank}
    </Typography>
  )
}

const questionHintKeys = (question: ReviewQuestion): string[] => {
  switch (question.questionType) {
    case 'FILL_BLANK':
      return [
        'question.hints.fillBlank.context',
        'question.hints.fillBlank.grammar',
      ]
    case 'SELECT_MEANING':
      return [
        'question.hints.selectMeaning.context',
        'question.hints.selectMeaning.specific',
      ]
    case 'SELECT_WORD':
      return [
        'question.hints.selectWord.rephrase',
        'question.hints.selectWord.form',
      ]
    case 'SELECT_CORRECT_CONTEXT':
      return [
        'question.hints.selectContext.meaning',
        'question.hints.selectContext.eliminate',
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

  if (sessionType === 'DAILY_REVIEW') {
    return quizId || articleId || collectionId ? null : { sessionType }
  }
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
              {t('session.exit')}
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
  const { t } = useTranslation('review')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const mutation = useStartReviewSessionMutation()
  const [preparationId] = useState(() => crypto.randomUUID())
  const activeSessionQuery = useActiveReviewSessionQuery(
    mutation.isPending ? ACTIVE_SESSION_RECOVERY_INTERVAL_MS : false,
  )
  const preparationQuery = useReviewPreparationQuery(
    preparationId,
    mutation.isPending,
  )
  const startedRef = useRef(false)
  const searchString = searchParams.toString()
  const request = useMemo(() => {
    const parsed = startRequestFromSearch(new URLSearchParams(searchString))
    return parsed ? { ...parsed, preparationId } : null
  }, [preparationId, searchString])
  const preparation = preparationQuery.data
  const preparationPercent = preparation?.progressPercent
  const preparationStage = preparation?.stage ?? 'SELECTING_VOCABULARY'

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
          {t('starter.invalidLink')}
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
            {noEligibleVocabulary
              ? t('starter.emptyTitle')
              : t('starter.errorTitle')}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5, maxWidth: 560, mx: 'auto' }}>
            {noEligibleVocabulary
              ? t('starter.emptyDescription')
              : t('starter.errorDescription')}
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
                {t('starter.tryAgain')}
              </Button>
            ) : null}
            <Button component={RouterLink} to={routePaths.home} variant="outlined">
              {t('session.backHome')}
            </Button>
          </Stack>
        </Paper>
      </ReviewShell>
    )
  }

  return (
    <ReviewShell>
      <Paper
        role="status"
        aria-live="polite"
        variant="outlined"
        sx={{
          maxWidth: 640,
          mx: 'auto',
          mt: { xs: 5, sm: 9 },
          p: { xs: 3, sm: 4.5 },
          borderColor: 'primary.light',
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(236,247,241,0.9))',
        }}
      >
        <Typography
          sx={{
            color: 'primary.dark',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {t('preparation.eyebrow')}
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          sx={{ mt: 1.25, alignItems: 'baseline', justifyContent: 'space-between' }}
        >
          <Typography component="h1" variant="h1" sx={{ fontSize: { xs: 30, sm: 38 } }}>
            {t('preparation.title')}
          </Typography>
          {preparationPercent !== undefined ? (
            <Typography
              aria-label={t('preparation.percentLabel', {
                percent: preparationPercent,
              })}
              sx={{
                color: 'primary.dark',
                fontSize: { xs: 28, sm: 34 },
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {preparationPercent}%
            </Typography>
          ) : null}
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {t(`preparation.stages.${preparationStage}`)}
        </Typography>
        <LinearProgress
          aria-label={t('preparation.progressLabel')}
          variant={preparationPercent === undefined ? 'indeterminate' : 'determinate'}
          value={preparationPercent}
          sx={{
            mt: 2.5,
            height: 10,
            borderRadius: 999,
            bgcolor: 'rgba(23, 107, 75, 0.12)',
            '& .MuiLinearProgress-bar': { borderRadius: 999 },
          }}
        />
        {preparation && preparation.totalItems > 0 ? (
          <Typography sx={{ mt: 1.5, fontWeight: 700 }}>
            {t('preparation.itemProgress', {
              completed: preparation.completedItems,
              total: preparation.totalItems,
            })}
          </Typography>
        ) : null}
        <Typography color="text.secondary" variant="body2" sx={{ mt: 1.5 }}>
          {t('preparation.note')}
        </Typography>
      </Paper>
    </ReviewShell>
  )
}

function ReviewSessionExperience({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation('review')
  const navigate = useNavigate()
  const sessionQuery = useReviewSessionQuery(sessionId)
  const answerMutation = useSubmitReviewAnswerMutation(sessionId)
  const hintMutation = useRevealReviewHintMutation(sessionId)
  const skipMutation = useSkipReviewItemMutation(sessionId)
  const abandonMutation = useAbandonReviewSessionMutation(sessionId)
  const [transitionItem, setTransitionItem] = useState<ReviewSessionItem | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [revealedHintCharacters, setRevealedHintCharacters] = useState<
    Record<string, string>
  >({})
  const [hintError, setHintError] = useState<string | null>(null)
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
  const hintRequestLockRef = useRef(false)
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
    setRevealedHintCharacters({})
    setHintError(null)
    setFeedback(null)
    setActionError(null)
    setHasStaleConflict(false)
    setStaleRecoveryReady(false)
    setCoachingWaitExpired(false)
    questionStartedAtRef.current = Date.now()
    submissionLockRef.current = false
    hintRequestLockRef.current = false
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
      setActionError(t('errors.nextQuestionUnavailable'))
    },
    [navigate, resetQuestion, sessionId, t],
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
  const hints = question
    ? questionHintKeys(question).map((key) => t(key))
    : []
  const isFillBlank = question?.questionType === 'FILL_BLANK'
  const fillBlankWordLengths = question?.answerWordLengths?.length
    ? question.answerWordLengths
    : [1]
  const fillBlankCharacterCount = fillBlankWordLengths.reduce(
    (total, length) => total + length,
    0,
  )
  const revealedHintCharacterCount = Object.keys(revealedHintCharacters).length
  const hasMoreHints = isFillBlank
    ? hintsUsed < fillBlankCharacterCount
    : hintsUsed < hints.length
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
    abandonMutation.isPending ||
    hintMutation.isPending

  const revealNextHint = async () => {
    if (
      !displayItem ||
      !question ||
      feedback ||
      isBusy ||
      !hasMoreHints ||
      hintRequestLockRef.current
    ) return
    setHintError(null)

    if (!isFillBlank) {
      setHintsUsed((count) => Math.min(count + 1, hints.length))
      return
    }

    hintRequestLockRef.current = true
    try {
      const hint = await hintMutation.mutateAsync({
        reviewSessionItemId: displayItem.id,
        hintIndex: hintsUsed,
      })
      setRevealedHintCharacters((current) => ({
        ...current,
        [hintCharacterKey(hint.wordIndex, hint.characterIndex)]:
          hint.revealedCharacter,
      }))
      setHintsUsed((count) => count + 1)
    } catch (error: unknown) {
      const apiError = normalizeApiError(error)
      setHintError(
        apiError.status === 409
          ? t('fillBlank.hintStale')
          : t('fillBlank.hintError'),
      )
    } finally {
      hintRequestLockRef.current = false
    }
  }

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
        ? t('errors.staleReady')
        : t('errors.staleLoadFailed'),
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
        setActionError(t('errors.staleLoading'))
        await refreshAfterStaleConflict()
      } else {
        setActionError(
          t('errors.answerSave'),
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
        setActionError(t('errors.staleLoading'))
        await refreshAfterStaleConflict()
      } else {
        setActionError(
          t('errors.skip'),
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
          ? t('errors.endConflict')
          : t('errors.end'),
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
                {t('starter.tryAgain')}
              </Button>
            ) : undefined
          }
        >
          {error.status === 404
            ? t('errors.sessionUnavailable')
            : t('errors.restore')}
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
          <Typography color="text.secondary">{t('session.restoring')}</Typography>
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
            {t('actions.saveExit')}
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
            {t('actions.endSession')}
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
        </Paper>

        <Box>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography sx={{ fontWeight: 800 }}>
              {t('progress.question', {
                current: Math.min(
                  progress.answeredCount + 1,
                  progress.totalQuestions,
                ),
                total: progress.totalQuestions,
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
              {t('progress.remaining', { count: progress.remainingCount })}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progress.progressPercent))}
            aria-label={t('progress.ariaLabel')}
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
            {isFillBlank
              ? t('question.types.fillBlank')
              : t('question.types.chooseAnswer')}
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
              {isFillBlank ? (
                <FillBlankSentence
                  sentence={question.blankSentence}
                  wordLengths={fillBlankWordLengths}
                  revealedCharacters={revealedHintCharacters}
                  slotLabel={t('fillBlank.slotLabel', {
                    wordCount: fillBlankWordLengths.length,
                    characterCount: fillBlankCharacterCount,
                    revealed: revealedHintCharacterCount,
                  })}
                />
              ) : (
                <Typography sx={{ fontSize: { xs: 17, sm: 19 }, lineHeight: 1.7 }}>
                  {question.blankSentence}
                </Typography>
              )}
            </Box>
          ) : null}

          <Box component="form" onSubmit={(event) => { event.preventDefault(); void submitAnswer() }} sx={{ mt: 3 }}>
            {isFillBlank ? (
              <TextField
                label={t('question.answerLabel')}
                name="reviewAnswer"
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                disabled={Boolean(feedback) || isBusy}
                autoComplete="off"
                slotProps={{ htmlInput: { maxLength: 2_000 } }}
              />
            ) : (
              <Stack
                spacing={1.25}
                role="group"
                aria-label={t('question.answerChoices')}
              >
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

            {!isFillBlank && hintsUsed > 0 && !feedback ? (
              <Alert severity="info" aria-live="polite" sx={{ mt: 2 }}>
                {hints[hintsUsed - 1]}
              </Alert>
            ) : null}

            {hintError ? (
              <Alert severity="error" aria-live="polite" sx={{ mt: 2 }}>
                {hintError}
              </Alert>
            ) : null}

            {feedback ? (
              feedback.isCorrect ? (
                <Alert severity="success" role="status" sx={{ mt: 2.5 }}>
                  <Typography sx={{ fontWeight: 800 }}>
                    {t('feedback.correctTitle')}
                  </Typography>
                  <Typography variant="body2">
                    {t('feedback.movingNext')}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="error" role="alert" sx={{ mt: 2.5 }}>
                  <Typography sx={{ fontWeight: 850 }}>
                    {t('feedback.correctAnswer', {
                      answer: feedback.correctAnswer,
                    })}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {feedback.explanation}
                  </Typography>
                  {feedback.willReturnLater &&
                  !feedback.agentFeedback?.retestAfterItems ? (
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 750 }}>
                      {t('feedback.returnLater')}
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
                      {staleRecoveryReady
                        ? t('actions.useLatestQuestion')
                        : t('actions.refresh')}
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
                    disabled={isBusy || !hasMoreHints}
                    onClick={() => void revealNextHint()}
                  >
                    {isFillBlank
                      ? hintMutation.isPending
                        ? t('fillBlank.hintLoading')
                        : !hasMoreHints
                          ? t('fillBlank.hintComplete')
                          : hintsUsed === 0
                            ? t('fillBlank.hintFirst')
                            : t('fillBlank.hintNext')
                      : hintsUsed === 0
                        ? t('actions.hint')
                        : t('actions.anotherHint')}
                  </Button>
                  <Button type="button" color="inherit" disabled={isBusy} onClick={() => void skipQuestion()}>
                    {skipMutation.isPending
                      ? t('actions.skipping')
                      : t('actions.skip')}
                  </Button>
                </Stack>
              ) : <Box />}

              {feedback && !feedback.isCorrect ? (
                <Button type="button" variant="contained" onClick={() => finishOrAdvance(feedback)}>
                  {t('actions.continue')}
                </Button>
              ) : !feedback ? (
                <Button type="submit" variant="contained" disabled={!canSubmit || isBusy}>
                  {answerMutation.isPending
                    ? t('actions.checking')
                    : t('actions.checkAnswer')}
                </Button>
              ) : null}
            </Stack>
          </Box>
        </Paper>
      </Stack>
      <ConfirmationDialog
        open={endDialogOpen}
        title={t('endDialog.title')}
        description={t('endDialog.description')}
        confirmLabel={t('actions.endSession')}
        pendingLabel={t('endDialog.pending')}
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

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import { AbandonConfirmDialog } from '@/components/Tutor/AbandonConfirmDialog'
import { ContextualClozeQuestion } from '@/components/Tutor/ContextualClozeQuestion'
import { MicroLessonRetestQuestion } from '@/components/Tutor/MicroLessonRetestQuestion'
import { MultipleChoiceQuestion } from '@/components/Tutor/MultipleChoiceQuestion'
import { TutorFeedbackCard } from '@/components/Tutor/TutorFeedbackCard'
import { TutorHintBox } from '@/components/Tutor/TutorHintBox'
import { TutorProgressHeader } from '@/components/Tutor/TutorProgressHeader'
import { TutorSessionSummaryView } from '@/components/Tutor/TutorSessionSummaryView'
import { TutorWarmupFactsView } from '@/components/Tutor/TutorWarmupFactsView'
import { TypedRecallQuestion } from '@/components/Tutor/TypedRecallQuestion'
import {
  tutorQueryKeys,
  useAbandonSessionMutation,
  useActiveTutorSessionQuery,
  useSubmitAnswerMutation,
} from '@/hooks/Tutor/useTutor'
import type {
  ContextualClozePayload,
  MicroLessonRetestPayload,
  MultipleChoicePayload,
  TutorSessionAnsweredItem,
  TypedRecallPayload,
} from '@/types/Tutor/tutor'
import { routePaths } from '@/utils/paths'

export function TutorSessionPage() {
  const { t } = useTranslation('tutor')
  const queryClient = useQueryClient()

  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false)
  const [warmupAcknowledged, setWarmupAcknowledged] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [isLoadingNext, setIsLoadingNext] = useState(false)
  const [submittedAnswerItem, setSubmittedAnswerItem] =
    useState<TutorSessionAnsweredItem | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const renderStartTimeRef = useRef<number>(0)

  // Query for the active session (automatically starts or resumes)
  const sessionQuery = useActiveTutorSessionQuery()

  const sessionData = sessionQuery.data
  const currentItem = sessionData?.currentItem
  const session = sessionData?.session
  const summary = sessionData?.summary

  // Track render start time for current item
  useEffect(() => {
    renderStartTimeRef.current = Date.now()
  }, [currentItem?.id])

  const submitAnswerMutation = useSubmitAnswerMutation()
  const abandonMutation = useAbandonSessionMutation(session?.id ?? '')

  // Handlers
  const handleHintReveal = () => {
    setHintUsed(true)
  }

  const handleAnswerSubmit = async (answer: unknown) => {
    if (!session?.id || !currentItem?.id || submitAnswerMutation.isPending) return
    setErrorMessage(null)

    const responseTimeMs = Math.max(
      100,
      Date.now() - renderStartTimeRef.current,
    )

    try {
      const result = await submitAnswerMutation.mutateAsync({
        sessionId: session.id,
        itemId: currentItem.id,
        request: {
          answer,
          hintUsed,
          responseTimeMs,
        },
      })
      setSubmittedAnswerItem(result.item)
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } }
      setErrorMessage(
        errObj?.response?.data?.message ?? t('errors.submitFailed'),
      )
    }
  }

  const handleNextItem = async () => {
    setIsLoadingNext(true)
    try {
      await queryClient.refetchQueries({
        queryKey: tutorQueryKeys.activeSession(),
      })
      setSubmittedAnswerItem(null)
      setHintUsed(false)
      setErrorMessage(null)
      renderStartTimeRef.current = Date.now()
    } finally {
      setIsLoadingNext(false)
    }
  }

  const handleConfirmAbandon = async () => {
    if (!session?.id) return
    try {
      await abandonMutation.mutateAsync()
      setAbandonDialogOpen(false)
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } } }
      setErrorMessage(
        errObj?.response?.data?.message ?? t('errors.abandonFailed'),
      )
    }
  }

  // 1. Loading State
  if (sessionQuery.isPending && !sessionData) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          {t('history.loading')}
        </Typography>
      </Box>
    )
  }

  // 2. Error State
  if (sessionQuery.isError && !sessionData) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', py: 6 }}>
        <Alert
          severity="warning"
          action={
            <Button
              component={RouterLink}
              to={routePaths.articles}
              color="inherit"
              size="small"
            >
              {t('dashboard.noVocabCta')}
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {errorMessage ?? t('errors.loadFailed')}
        </Alert>
      </Box>
    )
  }

  // 3. Session Completed or Abandoned -> Render Summary
  if (
    summary &&
    (session?.status === 'COMPLETED' || session?.status === 'ABANDONED')
  ) {
    return (
      <TutorSessionSummaryView
        status={session.status}
        summary={summary}
      />
    )
  }

  // 4. Warmup Facts Phase (Show all facts upfront before testing)
  const warmupFacts = session?.warmupFacts
  const hasWarmupFacts = Array.isArray(warmupFacts) && warmupFacts.length > 0
  const isSessionUnstarted = currentItem?.position === 1 && !submittedAnswerItem

  if (
    hasWarmupFacts &&
    !warmupAcknowledged &&
    isSessionUnstarted &&
    session?.status === 'ACTIVE'
  ) {
    return (
      <TutorWarmupFactsView
        facts={warmupFacts}
        targetCount={session.targetActivityCount}
        onStartTest={() => setWarmupAcknowledged(true)}
      />
    )
  }

  // 5. No current pending item or fetching next question while session is active
  if (
    (!currentItem || (sessionQuery.isFetching && !submittedAnswerItem)) &&
    session?.status === 'ACTIVE'
  ) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          {t('history.loading')}
        </Typography>
      </Box>
    )
  }

  if (!currentItem || !session) {
    return null
  }

  const payload = currentItem.questionPayload as Record<string, unknown>
  const meaningVi = (payload?.meaningVi as string) || undefined
  const isAnsweredState = Boolean(submittedAnswerItem)
  const isLastItem = currentItem.position >= session.targetActivityCount

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', py: { xs: 2, sm: 4 } }}>
      {/* Progress & Abandon Header */}
      <TutorProgressHeader
        currentPosition={currentItem.position}
        totalActivities={session.targetActivityCount}
        isNewWord={currentItem.isNewWord}
        onAbandonClick={() => setAbandonDialogOpen(true)}
        disabled={submitAnswerMutation.isPending || isAnsweredState}
      />

      {errorMessage ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      ) : null}

      {/* Main Question Card Container */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: 3.5,
          bgcolor: 'background.paper',
          boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
          position: 'relative',
        }}
      >
        {/* Hint Box */}
        <TutorHintBox
          meaningVi={meaningVi}
          hintUsed={hintUsed}
          onHintReveal={handleHintReveal}
          disabled={isAnsweredState || submitAnswerMutation.isPending}
        />

        {/* Dynamic Question Component based on questionType */}
        {currentItem.questionType === 'MULTIPLE_CHOICE' && (
          <MultipleChoiceQuestion
            key={currentItem.id}
            payload={payload as unknown as MultipleChoicePayload}
            onSubmit={handleAnswerSubmit}
            disabled={isAnsweredState}
            isSubmitting={submitAnswerMutation.isPending}
          />
        )}

        {currentItem.questionType === 'CONTEXTUAL_CLOZE' && (
          <ContextualClozeQuestion
            key={currentItem.id}
            payload={payload as unknown as ContextualClozePayload}
            onSubmit={handleAnswerSubmit}
            disabled={isAnsweredState}
            isSubmitting={submitAnswerMutation.isPending}
          />
        )}

        {currentItem.questionType === 'TYPED_RECALL' && (
          <TypedRecallQuestion
            key={currentItem.id}
            payload={payload as unknown as TypedRecallPayload}
            onSubmit={handleAnswerSubmit}
            disabled={isAnsweredState}
            isSubmitting={submitAnswerMutation.isPending}
          />
        )}

        {currentItem.questionType === 'MICRO_LESSON_RETEST' && (
          <MicroLessonRetestQuestion
            key={currentItem.id}
            payload={payload as unknown as MicroLessonRetestPayload}
            onSubmit={handleAnswerSubmit}
            disabled={isAnsweredState}
            isSubmitting={submitAnswerMutation.isPending}
          />
        )}

        {/* Feedback Card (Answered State) */}
        {isAnsweredState && submittedAnswerItem && (
          <TutorFeedbackCard
            isCorrect={submittedAnswerItem.isCorrect}
            userAnswer={submittedAnswerItem.userAnswer}
            correctAnswer={submittedAnswerItem.correctAnswer}
            explanationVi={submittedAnswerItem.explanationVi}
            feedbackVi={submittedAnswerItem.feedbackVi}
            fsrsRating={submittedAnswerItem.fsrsRating}
            onNext={handleNextItem}
            isLastItem={isLastItem}
            isLoadingNext={sessionQuery.isFetching || isLoadingNext}
          />
        )}
      </Paper>

      {/* Abandon Confirmation Dialog */}
      <AbandonConfirmDialog
        open={abandonDialogOpen}
        onClose={() => setAbandonDialogOpen(false)}
        onConfirm={handleConfirmAbandon}
        isSubmitting={abandonMutation.isPending}
      />
    </Box>
  )
}

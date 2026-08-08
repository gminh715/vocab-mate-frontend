import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { reviewsApi } from '@/api/Review/ReviewsApi'
import { analyticsQueryKeys } from '@/hooks/Analytics/useAnalytics'
import { vocabularyQueryKeys } from '@/hooks/Vocabulary/useVocabularies'
import type {
  ReviewSessionState,
  SkipReviewItemRequest,
  SkippedReviewItem,
  StartReviewSessionRequest,
  SubmitReviewAnswerRequest,
  SubmittedReviewAnswer,
} from '@/types/Review/review'

type ReviewTransition = SubmittedReviewAnswer | SkippedReviewItem

export const reviewQueryKeys = {
  all: ['reviews'] as const,
  today: () => [...reviewQueryKeys.all, 'today'] as const,
  active: () => [...reviewQueryKeys.all, 'active'] as const,
  sessions: () => [...reviewQueryKeys.all, 'session'] as const,
  session: (sessionId: string) =>
    [...reviewQueryKeys.sessions(), sessionId] as const,
  summaries: () => [...reviewQueryKeys.all, 'summary'] as const,
  summary: (sessionId: string) =>
    [...reviewQueryKeys.summaries(), sessionId] as const,
}

export const useTodayReviewsQuery = () =>
  useQuery({
    queryKey: reviewQueryKeys.today(),
    queryFn: () => reviewsApi.today(),
    retry: false,
    staleTime: 60_000,
  })

export const useActiveReviewSessionQuery = (
  refetchInterval: number | false = false,
) =>
  useQuery({
    queryKey: reviewQueryKeys.active(),
    queryFn: reviewsApi.active,
    retry: false,
    staleTime: 30_000,
    refetchInterval,
  })

export const useReviewSessionQuery = (sessionId: string) =>
  useQuery({
    queryKey: reviewQueryKeys.session(sessionId),
    queryFn: () => reviewsApi.session(sessionId),
    enabled: Boolean(sessionId),
    retry: false,
  })

export const useReviewSummaryQuery = (
  sessionId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: reviewQueryKeys.summary(sessionId),
    queryFn: () => reviewsApi.summary(sessionId),
    enabled: Boolean(sessionId) && enabled,
    retry: false,
  })

export const useStartReviewSessionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: StartReviewSessionRequest) =>
      reviewsApi.start(request),
    onSuccess: (state) => {
      queryClient.setQueryData(
        reviewQueryKeys.session(state.session.id),
        state,
      )
      queryClient.setQueryData(reviewQueryKeys.active(), state)
    },
    retry: false,
  })
}

const stateFromTransition = (
  current: ReviewSessionState,
  transition: ReviewTransition,
): ReviewSessionState => {
  if (transition.progress.answeredCount < current.progress.answeredCount) {
    return current
  }

  const transitionFeedback =
    'agentFeedback' in transition ? transition.agentFeedback : undefined

  return {
    session: transition.sessionCompleted
      ? {
          ...current.session,
          status: 'COMPLETED',
          completedAt:
            transition.completionSummary?.completedAt ??
            current.session.completedAt,
        }
      : current.session,
    progress: transition.progress,
    ...(transition.nextQuestion ? { nextItem: transition.nextQuestion } : {}),
    ...(transitionFeedback
      ? { agentFeedback: transitionFeedback }
      : current.agentFeedback
        ? { agentFeedback: current.agentFeedback }
        : {}),
  }
}

const applyTransitionToCache = (
  queryClient: QueryClient,
  sessionId: string,
  transition: ReviewTransition,
) => {
  const sessionKey = reviewQueryKeys.session(sessionId)
  const activeKey = reviewQueryKeys.active()
  const cachedSession = queryClient.getQueryData<ReviewSessionState>(sessionKey)
  const cachedActive = queryClient.getQueryData<ReviewSessionState>(activeKey)
  const current =
    cachedSession ??
    (cachedActive?.session.id === sessionId ? cachedActive : undefined)

  if (current) {
    const nextState = stateFromTransition(current, transition)
    queryClient.setQueryData(sessionKey, nextState)
    if (!transition.sessionCompleted && cachedActive?.session.id === sessionId) {
      queryClient.setQueryData(activeKey, nextState)
    }
    if (
      !transition.sessionCompleted &&
      current.agentFeedback &&
      !('agentFeedback' in transition && transition.agentFeedback)
    ) {
      void queryClient.invalidateQueries({ queryKey: sessionKey, exact: true })
    }
  }

  if (transition.sessionCompleted) {
    queryClient.removeQueries({ queryKey: activeKey, exact: true })
    queryClient.removeQueries({
      queryKey: reviewQueryKeys.summary(sessionId),
      exact: true,
    })
  }
}

const cancelTransitionQueries = (
  queryClient: QueryClient,
  sessionId: string,
) =>
  Promise.all([
    queryClient.cancelQueries({
      queryKey: reviewQueryKeys.session(sessionId),
      exact: true,
    }),
    queryClient.cancelQueries({
      queryKey: reviewQueryKeys.active(),
      exact: true,
    }),
  ])

const invalidateReviewProgress = (
  queryClient: QueryClient,
  sessionCompleted: boolean,
) => {
  void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.today() })
  void queryClient.invalidateQueries({ queryKey: vocabularyQueryKeys.all })
  void queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.all })
  if (sessionCompleted) {
    void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.active() })
  }
}

export const useSubmitReviewAnswerMutation = (sessionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SubmitReviewAnswerRequest) =>
      reviewsApi.answer(sessionId, request),
    onMutate: () => cancelTransitionQueries(queryClient, sessionId),
    onSuccess: (transition) => {
      applyTransitionToCache(queryClient, sessionId, transition)
      invalidateReviewProgress(queryClient, transition.sessionCompleted)
    },
    retry: false,
  })
}

export const useSkipReviewItemMutation = (sessionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: SkipReviewItemRequest) =>
      reviewsApi.skip(sessionId, request),
    onMutate: () => cancelTransitionQueries(queryClient, sessionId),
    onSuccess: (transition) => {
      applyTransitionToCache(queryClient, sessionId, transition)
      invalidateReviewProgress(queryClient, transition.sessionCompleted)
    },
    retry: false,
  })
}

export const useAbandonReviewSessionMutation = (sessionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => reviewsApi.abandon(sessionId),
    onMutate: () => cancelTransitionQueries(queryClient, sessionId),
    onSuccess: (abandoned) => {
      queryClient.setQueryData<ReviewSessionState>(
        reviewQueryKeys.session(sessionId),
        (current) =>
          current
            ? {
                ...current,
                session: {
                  ...current.session,
                  status: abandoned.status,
                },
                nextItem: undefined,
              }
            : current,
      )
      queryClient.removeQueries({
        queryKey: reviewQueryKeys.active(),
        exact: true,
      })
      void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.active() })
      void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.today() })
    },
    retry: false,
  })
}

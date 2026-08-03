import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reviewsApi } from '@/api/Review/ReviewsApi'
import { analyticsQueryKeys } from '@/hooks/Analytics/useAnalytics'
import { vocabularyQueryKeys } from '@/hooks/Vocabulary/useVocabularies'
import type {
  SkipReviewItemRequest,
  StartReviewSessionRequest,
  SubmitReviewAnswerRequest,
} from '@/types/Review/review'

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

export const useActiveReviewSessionQuery = () =>
  useQuery({
    queryKey: reviewQueryKeys.active(),
    queryFn: reviewsApi.active,
    retry: false,
    staleTime: 30_000,
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

const useReviewProgressInvalidation = () => {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.today() })
    void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.active() })
    void queryClient.invalidateQueries({ queryKey: vocabularyQueryKeys.all })
    void queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.all })
  }
}

export const useSubmitReviewAnswerMutation = (sessionId: string) => {
  const invalidate = useReviewProgressInvalidation()

  return useMutation({
    mutationFn: (request: SubmitReviewAnswerRequest) =>
      reviewsApi.answer(sessionId, request),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useSkipReviewItemMutation = (sessionId: string) => {
  const invalidate = useReviewProgressInvalidation()

  return useMutation({
    mutationFn: (request: SkipReviewItemRequest) =>
      reviewsApi.skip(sessionId, request),
    onSuccess: invalidate,
    retry: false,
  })
}

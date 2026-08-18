import { apiClient } from '@/config/apiClient'
import type {
  AbandonedReviewSession,
  CompletedReviewResult,
  DueReviews,
  ReviewHistory,
  ReviewHistoryParams,
  ReviewPreparationProgress,
  RevealedReviewHint,
  RevealReviewHintRequest,
  ReviewSessionState,
  SkipReviewItemRequest,
  SkippedReviewItem,
  StartReviewSessionRequest,
  SubmitReviewAnswerRequest,
  SubmittedReviewAnswer,
} from '@/types/Review/review'

const reviewSessionsPath = '/review-sessions'

export const reviewsApi = {
  today: (limit = 10): Promise<DueReviews> =>
    apiClient.get<DueReviews>('/reviews/today', { params: { limit } }),

  active: (): Promise<ReviewSessionState> =>
    apiClient.get<ReviewSessionState>(`${reviewSessionsPath}/active`),

  history: (params: ReviewHistoryParams = {}): Promise<ReviewHistory> =>
    apiClient.get<ReviewHistory>('/reviews/history', { params }),

  session: (sessionId: string): Promise<ReviewSessionState> =>
    apiClient.get<ReviewSessionState>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}`,
    ),

  start: (request: StartReviewSessionRequest): Promise<ReviewSessionState> =>
    apiClient.post<ReviewSessionState>(reviewSessionsPath, request),

  preparation: (
    preparationId: string,
  ): Promise<ReviewPreparationProgress> =>
    apiClient.get<ReviewPreparationProgress>(
      `${reviewSessionsPath}/preparations/${encodeURIComponent(preparationId)}`,
    ),

  answer: (
    sessionId: string,
    request: SubmitReviewAnswerRequest,
  ): Promise<SubmittedReviewAnswer> =>
    apiClient.post<SubmittedReviewAnswer>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}/answers`,
      request,
    ),

  revealHint: (
    sessionId: string,
    request: RevealReviewHintRequest,
  ): Promise<RevealedReviewHint> =>
    apiClient.post<RevealedReviewHint>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}/items/${encodeURIComponent(request.reviewSessionItemId)}/hints`,
      { hintIndex: request.hintIndex },
    ),

  skip: (
    sessionId: string,
    request: SkipReviewItemRequest,
  ): Promise<SkippedReviewItem> =>
    apiClient.post<SkippedReviewItem>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}/skip`,
      request,
    ),

  abandon: (sessionId: string): Promise<AbandonedReviewSession> =>
    apiClient.post<AbandonedReviewSession>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}/abandon`,
    ),

  summary: (sessionId: string): Promise<CompletedReviewResult> =>
    apiClient.get<CompletedReviewResult>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}/summary`,
    ),
}

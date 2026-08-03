import { apiClient } from '@/config/apiClient'
import type {
  CompletedReviewResult,
  DueReviews,
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

  session: (sessionId: string): Promise<ReviewSessionState> =>
    apiClient.get<ReviewSessionState>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}`,
    ),

  start: (request: StartReviewSessionRequest): Promise<ReviewSessionState> =>
    apiClient.post<ReviewSessionState>(reviewSessionsPath, request),

  answer: (
    sessionId: string,
    request: SubmitReviewAnswerRequest,
  ): Promise<SubmittedReviewAnswer> =>
    apiClient.post<SubmittedReviewAnswer>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}/answers`,
      request,
    ),

  skip: (
    sessionId: string,
    request: SkipReviewItemRequest,
  ): Promise<SkippedReviewItem> =>
    apiClient.post<SkippedReviewItem>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}/skip`,
      request,
    ),

  summary: (sessionId: string): Promise<CompletedReviewResult> =>
    apiClient.get<CompletedReviewResult>(
      `${reviewSessionsPath}/${encodeURIComponent(sessionId)}/summary`,
    ),
}

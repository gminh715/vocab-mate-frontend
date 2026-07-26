import { apiClient } from '@/config/apiClient'
import type {
  AnalyticsOverview,
  AnalyticsOverviewParams,
  QuizAnalytics,
  QuizAnalyticsParams,
  ReadingAnalytics,
  VocabularyAnalytics,
  VocabularyAnalyticsParams,
} from '@/types/Analytics/analytics'

const analyticsPath = '/analytics/me'

export const analyticsApi = {
  overview: (
    params: AnalyticsOverviewParams = {},
  ): Promise<AnalyticsOverview> =>
    apiClient.get<AnalyticsOverview>(`${analyticsPath}/overview`, { params }),

  vocabulary: (
    params: VocabularyAnalyticsParams,
  ): Promise<VocabularyAnalytics> =>
    apiClient.get<VocabularyAnalytics>(`${analyticsPath}/vocabulary`, {
      params,
    }),

  reading: (
    params: AnalyticsOverviewParams,
  ): Promise<ReadingAnalytics> =>
    apiClient.get<ReadingAnalytics>(`${analyticsPath}/reading`, { params }),

  quizzes: (params: QuizAnalyticsParams): Promise<QuizAnalytics> =>
    apiClient.get<QuizAnalytics>(`${analyticsPath}/quizzes`, { params }),
}

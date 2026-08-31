import { apiClient } from '@/config/apiClient'
import type {
  AnalyticsOverview,
  AnalyticsOverviewParams,
  ReviewAnalyticsData,
} from '@/types/Analytics/analytics'

export const analyticsApi = {
  overview: (
    params: AnalyticsOverviewParams = {},
  ): Promise<AnalyticsOverview> =>
    apiClient.get<AnalyticsOverview>('/analytics/me/overview', { params }),

  review: (): Promise<ReviewAnalyticsData> =>
    apiClient.get<ReviewAnalyticsData>('/analytics/me/review'),
}


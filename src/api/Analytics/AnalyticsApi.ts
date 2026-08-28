import { apiClient } from '@/config/apiClient'
import type {
  AnalyticsOverview,
  AnalyticsOverviewParams,
} from '@/types/Analytics/analytics'

export const analyticsApi = {
  overview: (
    params: AnalyticsOverviewParams = {},
  ): Promise<AnalyticsOverview> =>
    apiClient.get<AnalyticsOverview>('/analytics/me/overview', { params }),
}

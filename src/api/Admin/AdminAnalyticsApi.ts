import { apiClient } from '@/config/apiClient'
import type {
  AdminAnalyticsOverview,
  AdminContentAnalytics,
  AdminUserAnalytics,
  AnalyticsRequestParams,
  ContentAnalyticsRequestParams,
  UserAnalyticsRequestParams,
} from '@/types/Admin/adminAnalytics'

const analyticsPath = '/admin/analytics'

export const adminAnalyticsApi = {
  overview: (
    params: AnalyticsRequestParams,
  ): Promise<AdminAnalyticsOverview> =>
    apiClient.get<AdminAnalyticsOverview>(`${analyticsPath}/overview`, {
      params,
    }),
  content: (
    params: ContentAnalyticsRequestParams,
  ): Promise<AdminContentAnalytics> =>
    apiClient.get<AdminContentAnalytics>(`${analyticsPath}/content`, {
      params,
    }),
  users: (
    params: UserAnalyticsRequestParams,
  ): Promise<AdminUserAnalytics> =>
    apiClient.get<AdminUserAnalytics>(`${analyticsPath}/users`, {
      params,
    }),
}

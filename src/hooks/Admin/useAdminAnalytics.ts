import { useQuery } from '@tanstack/react-query'
import { adminAnalyticsApi } from '@/api/Admin/AdminAnalyticsApi'
import type {
  AnalyticsRequestParams,
  ContentAnalyticsRequestParams,
  UserAnalyticsRequestParams,
} from '@/types/Admin/adminAnalytics'

export const adminAnalyticsQueryKeys = {
  all: ['/adminAnalytics'] as const,
  overview: (params: AnalyticsRequestParams) =>
    [...adminAnalyticsQueryKeys.all, 'overview', params] as const,
  content: (params: ContentAnalyticsRequestParams) =>
    [...adminAnalyticsQueryKeys.all, 'content', params] as const,
  users: (params: UserAnalyticsRequestParams) =>
    [...adminAnalyticsQueryKeys.all, 'users', params] as const,
}

export const useAdminAnalyticsOverviewQuery = (
  params: AnalyticsRequestParams,
  enabled = true,
) =>
  useQuery({
    queryKey: adminAnalyticsQueryKeys.overview(params),
    queryFn: () => adminAnalyticsApi.overview(params),
    enabled,
    retry: false,
  })

export const useAdminContentAnalyticsQuery = (
  params: ContentAnalyticsRequestParams,
  enabled = true,
) =>
  useQuery({
    queryKey: adminAnalyticsQueryKeys.content(params),
    queryFn: () => adminAnalyticsApi.content(params),
    enabled,
    retry: false,
  })

export const useAdminUserAnalyticsQuery = (
  params: UserAnalyticsRequestParams,
  enabled = true,
) =>
  useQuery({
    queryKey: adminAnalyticsQueryKeys.users(params),
    queryFn: () => adminAnalyticsApi.users(params),
    enabled,
    retry: false,
  })

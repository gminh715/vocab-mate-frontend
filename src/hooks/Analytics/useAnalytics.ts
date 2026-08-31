import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/Analytics/AnalyticsApi'
import type { AnalyticsOverviewParams } from '@/types/Analytics/analytics'

export const analyticsQueryKeys = {
  all: ['analytics', 'me'] as const,
  overview: (params: AnalyticsOverviewParams) =>
    [...analyticsQueryKeys.all, 'overview', params] as const,
  review: () => [...analyticsQueryKeys.all, 'review'] as const,
}

export const useAnalyticsOverviewQuery = (
  params: AnalyticsOverviewParams,
  enabled = true,
) =>
  useQuery({
    queryKey: analyticsQueryKeys.overview(params),
    queryFn: () => analyticsApi.overview(params),
    enabled,
    retry: false,
    staleTime: 2 * 60 * 1_000,
  })

export const useReviewAnalyticsQuery = (enabled = true) =>
  useQuery({
    queryKey: analyticsQueryKeys.review(),
    queryFn: () => analyticsApi.review(),
    enabled,
    retry: false,
    staleTime: 60 * 1_000,
  })


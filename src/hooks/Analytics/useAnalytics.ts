import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/Analytics/AnalyticsApi'
import type {
  AnalyticsOverviewParams,
  VocabularyAnalyticsParams,
} from '@/types/Analytics/analytics'

export const analyticsQueryKeys = {
  all: ['analytics', 'me'] as const,
  overview: (params: AnalyticsOverviewParams) =>
    [...analyticsQueryKeys.all, 'overview', params] as const,
  vocabulary: (params: VocabularyAnalyticsParams) =>
    [...analyticsQueryKeys.all, 'vocabulary', params] as const,
  reading: (params: AnalyticsOverviewParams) =>
    [...analyticsQueryKeys.all, 'reading', params] as const,
  reviews: (params: AnalyticsOverviewParams) =>
    [...analyticsQueryKeys.all, 'reviews', params] as const,
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

export const useVocabularyAnalyticsQuery = (
  params: VocabularyAnalyticsParams,
  enabled = true,
) =>
  useQuery({
    queryKey: analyticsQueryKeys.vocabulary(params),
    queryFn: () => analyticsApi.vocabulary(params),
    enabled,
    retry: false,
    staleTime: 2 * 60 * 1_000,
  })

export const useReadingAnalyticsQuery = (
  params: AnalyticsOverviewParams,
  enabled = true,
) =>
  useQuery({
    queryKey: analyticsQueryKeys.reading(params),
    queryFn: () => analyticsApi.reading(params),
    enabled,
    retry: false,
    staleTime: 2 * 60 * 1_000,
  })

export const useReviewAnalyticsQuery = (
  params: AnalyticsOverviewParams,
  enabled = true,
) =>
  useQuery({
    queryKey: analyticsQueryKeys.reviews(params),
    queryFn: () => analyticsApi.reviews(params),
    enabled,
    retry: false,
    staleTime: 2 * 60 * 1_000,
  })

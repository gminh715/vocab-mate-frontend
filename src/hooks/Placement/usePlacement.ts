import { useQuery } from '@tanstack/react-query'
import { placementApi } from '@/api/Placement/PlacementApi'

export const placementQueryKeys = {
  vocabulary: () => ['placement', 'vocabulary'] as const,
}

export const usePlacementVocabularyQuery = () =>
  useQuery({
    queryKey: placementQueryKeys.vocabulary(),
    queryFn: placementApi.vocabulary,
    staleTime: Number.POSITIVE_INFINITY,
    retry: 1,
  })

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collectionsApi,
  type CreateCollectionRequest,
} from '@/api/Vocabulary/CollectionsApi'
import type { GetCollectionsQueryParams } from '@/types/Vocabulary/vocabulary'
import { vocabularyQueryKeys } from '@/hooks/Vocabulary/useVocabularies'

export const collectionQueryKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionQueryKeys.all, 'list'] as const,
  list: (params?: GetCollectionsQueryParams) =>
    [...collectionQueryKeys.lists(), params ?? {}] as const,
}

export const useCollectionsQuery = (params?: GetCollectionsQueryParams) =>
  useQuery({
    queryKey: collectionQueryKeys.list(params),
    queryFn: () => collectionsApi.findAll(params),
  })

export const useCreateCollectionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateCollectionRequest) =>
      collectionsApi.create(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.all,
      })
    },
  })
}

export const useDeleteCollectionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (collectionId: string) => collectionsApi.remove(collectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.all,
      })
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
    },
  })
}

export const useAddCollectionItemsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      collectionId,
      userVocabularyIds,
    }: {
      collectionId: string
      userVocabularyIds: string[]
    }) => collectionsApi.addItems(collectionId, userVocabularyIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.all,
      })
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
    },
  })
}

export const useRemoveCollectionItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      collectionId,
      userVocabularyId,
    }: {
      collectionId: string
      userVocabularyId: string
    }) => collectionsApi.removeItem(collectionId, userVocabularyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.all,
      })
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
    },
  })
}

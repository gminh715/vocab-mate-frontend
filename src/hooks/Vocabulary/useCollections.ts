import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collectionsApi,
  type CreateCollectionRequest,
  type UpdateCollectionRequest,
} from '@/api/Vocabulary/CollectionsApi'
import type {
  GetCollectionItemsQueryParams,
  GetCollectionsQueryParams,
} from '@/types/Vocabulary/vocabulary'
import { vocabularyQueryKeys } from '@/hooks/Vocabulary/useVocabularies'

export const collectionQueryKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionQueryKeys.all, 'list'] as const,
  list: (params?: GetCollectionsQueryParams) =>
    [...collectionQueryKeys.lists(), params ?? {}] as const,
  details: () => [...collectionQueryKeys.all, 'detail'] as const,
  detail: (collectionId: string) =>
    [...collectionQueryKeys.details(), collectionId] as const,
  itemLists: () => [...collectionQueryKeys.all, 'items'] as const,
  items: (collectionId: string, params: GetCollectionItemsQueryParams) =>
    [...collectionQueryKeys.itemLists(), collectionId, params] as const,
}

export const useCollectionsQuery = (params?: GetCollectionsQueryParams) =>
  useQuery({
    queryKey: collectionQueryKeys.list(params),
    queryFn: () => collectionsApi.findAll(params),
  })

export const useCollectionDetailQuery = (collectionId: string) =>
  useQuery({
    queryKey: collectionQueryKeys.detail(collectionId),
    queryFn: () => collectionsApi.findOne(collectionId),
    enabled: Boolean(collectionId),
  })

export const useCollectionItemsQuery = (
  collectionId: string,
  params: GetCollectionItemsQueryParams,
) =>
  useQuery({
    queryKey: collectionQueryKeys.items(collectionId, params),
    queryFn: () => collectionsApi.findItems(collectionId, params),
    enabled: Boolean(collectionId),
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

export const useUpdateCollectionMutation = (collectionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateCollectionRequest) =>
      collectionsApi.update(collectionId, request),
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

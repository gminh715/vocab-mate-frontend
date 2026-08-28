import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vocabulariesApi } from '@/api/Vocabulary/VocabulariesApi'
import { normalizeApiError } from '@/config/apiClient'
import type { ContextualTermLookupData } from '@/types/Reading/reading'
import type {
  GetVocabulariesQueryParams,
  SaveVocabularyRequest,
} from '@/types/Vocabulary/vocabulary'
import { readingQueryKeys } from '@/hooks/Reading/useReading'

export const vocabularyQueryKeys = {
  all: ['vocabularies'] as const,
  lists: () => [...vocabularyQueryKeys.all, 'list'] as const,
  list: (params: GetVocabulariesQueryParams) =>
    [...vocabularyQueryKeys.lists(), params] as const,
  details: () => [...vocabularyQueryKeys.all, 'detail'] as const,
  detail: (userVocabularyId: string) =>
    [...vocabularyQueryKeys.details(), userVocabularyId] as const,
}

const collectionQueryRoot = ['collections'] as const

export const useVocabulariesQuery = (
  params: GetVocabulariesQueryParams,
  enabled = true,
) =>
  useQuery({
    queryKey: vocabularyQueryKeys.list(params),
    queryFn: () => vocabulariesApi.findAll(params),
    enabled,
  })

export const useVocabularyDetailQuery = (userVocabularyId: string) =>
  useQuery({
    queryKey: vocabularyQueryKeys.detail(userVocabularyId),
    queryFn: () => vocabulariesApi.findOne(userVocabularyId),
    enabled: Boolean(userVocabularyId),
  })

export const useDeleteVocabularyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userVocabularyId: string) =>
      vocabulariesApi.remove(userVocabularyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
      void queryClient.invalidateQueries({ queryKey: collectionQueryRoot })
    },
  })
}

export const useDeleteVocabulariesMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userVocabularyIds: readonly string[]) => {
      const results = await Promise.allSettled(
        userVocabularyIds.map((userVocabularyId) =>
          vocabulariesApi.remove(userVocabularyId),
        ),
      )
      if (results.some((result) => result.status === 'rejected')) {
        throw new Error('One or more vocabulary deletions failed')
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
      void queryClient.invalidateQueries({ queryKey: collectionQueryRoot })
    },
    retry: false,
  })
}

export const useSaveVocabularyMutation = (
  articleId: string,
  termId: string,
) => {
  const queryClient = useQueryClient()
  const lookupKey = readingQueryKeys.term(articleId, termId)

  return useMutation({
    mutationFn: (request: SaveVocabularyRequest) =>
      vocabulariesApi.save(request),
    onSuccess: (data) => {
      queryClient.setQueryData<ContextualTermLookupData>(
        lookupKey,
        (current) =>
          current
            ? {
                ...current,
                saveState: {
                  isSaved: true,
                  userVocabularyId: data.vocabulary.id,
                },
              }
            : current,
      )
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
      void queryClient.invalidateQueries({ queryKey: collectionQueryRoot })
    },
    onError: (error) => {
      if (normalizeApiError(error).status !== 409) return

      void queryClient.invalidateQueries({
        queryKey: lookupKey,
        exact: true,
      })
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
      void queryClient.invalidateQueries({ queryKey: collectionQueryRoot })
    },
    retry: false,
  })
}


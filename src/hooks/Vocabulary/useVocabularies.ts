import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vocabulariesApi } from '@/api/Vocabulary/VocabulariesApi'
import { normalizeApiError } from '@/config/apiClient'
import type { ContextualTermLookupData } from '@/types/Reading/reading'
import type {
  GetVocabulariesQueryParams,
  LearningStatus,
  SaveVocabularyRequest,
} from '@/types/Vocabulary/vocabulary'
import { readingQueryKeys } from '@/hooks/Reading/useReading'

export const vocabularyQueryKeys = {
  all: ['vocabularies'] as const,
  lists: () => [...vocabularyQueryKeys.all, 'list'] as const,
  list: (params: GetVocabulariesQueryParams) =>
    [...vocabularyQueryKeys.lists(), params] as const,
  due: (params?: { limit?: number; collectionId?: string }) =>
    [...vocabularyQueryKeys.all, 'due', params ?? {}] as const,
  details: () => [...vocabularyQueryKeys.all, 'detail'] as const,
  detail: (userVocabularyId: string) =>
    [...vocabularyQueryKeys.details(), userVocabularyId] as const,
}

export const useVocabulariesQuery = (params: GetVocabulariesQueryParams) =>
  useQuery({
    queryKey: vocabularyQueryKeys.list(params),
    queryFn: () => vocabulariesApi.findAll(params),
  })

export const useDueVocabulariesQuery = (params?: {
  limit?: number
  collectionId?: string
}) =>
  useQuery({
    queryKey: vocabularyQueryKeys.due(params),
    queryFn: () => vocabulariesApi.getDue(params),
  })

export const useVocabularyDetailQuery = (userVocabularyId: string) =>
  useQuery({
    queryKey: vocabularyQueryKeys.detail(userVocabularyId),
    queryFn: () => vocabulariesApi.findOne(userVocabularyId),
    enabled: Boolean(userVocabularyId),
  })

export const useUpdateVocabularyNoteMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userVocabularyId,
      personalNote,
    }: {
      userVocabularyId: string
      personalNote: string | null
    }) => vocabulariesApi.updateNote(userVocabularyId, personalNote),
    onSuccess: (data) => {
      queryClient.setQueryData(
        vocabularyQueryKeys.detail(data.vocabulary.id),
        data,
      )
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
    },
  })
}

export const useUpdateVocabularyStatusMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userVocabularyId,
      learningStatus,
    }: {
      userVocabularyId: string
      learningStatus: LearningStatus
    }) => vocabulariesApi.updateStatus(userVocabularyId, learningStatus),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
    },
  })
}

export const useDeleteVocabularyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userVocabularyId: string) =>
      vocabulariesApi.remove(userVocabularyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
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
                  learningStatus: data.vocabulary.learningStatus,
                },
              }
            : current,
      )
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKeys.all,
      })
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
    },
    retry: false,
  })
}


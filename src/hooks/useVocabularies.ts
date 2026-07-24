import { useMutation, useQueryClient } from '@tanstack/react-query'
import { vocabulariesApi } from '../api/VocabulariesApi'
import { normalizeApiError } from '../config/apiClient'
import type { ContextualTermLookupData } from '../types/reading'
import type { SaveVocabularyRequest } from '../types/vocabulary'
import { readingQueryKeys } from './useReading'

export const vocabularyQueryKeys = {
  all: ['vocabularies'] as const,
  lists: () => [...vocabularyQueryKeys.all, 'list'] as const,
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

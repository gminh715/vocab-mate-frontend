import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { readingApi } from '@/api/Reading/ReadingApi'
import { normalizeApiError } from '@/config/apiClient'
import type {
  ReaderProgress,
  ReadingHistoryParams,
} from '@/types/Reading/reading'

export const readingQueryKeys = {
  all: ['reading'] as const,
  articles: () => [...readingQueryKeys.all, 'article'] as const,
  article: (slug: string) =>
    [...readingQueryKeys.articles(), slug] as const,
  terms: () => [...readingQueryKeys.all, 'term'] as const,
  term: (articleId: string, termId: string) =>
    [...readingQueryKeys.terms(), articleId, termId] as const,
  histories: () => [...readingQueryKeys.all, 'history'] as const,
  history: (params: ReadingHistoryParams) =>
    [...readingQueryKeys.histories(), params] as const,
}

export const readerArticleQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: readingQueryKeys.article(slug),
    queryFn: () => readingApi.article(slug),
    enabled: Boolean(slug),
    retry: false,
  })

export const useReaderArticleQuery = (slug: string) =>
  useQuery(readerArticleQueryOptions(slug))

export const contextualTermQueryOptions = (
  articleId: string,
  termId: string,
) =>
  queryOptions({
    queryKey: readingQueryKeys.term(articleId, termId),
    queryFn: ({ signal }) =>
      readingApi.term(articleId, termId, signal),
    enabled: Boolean(articleId && termId),
    staleTime: 5 * 60 * 1_000,
    retry: false,
  })

export const useContextualTermQuery = (
  articleId: string,
  termId: string,
  enabled: boolean,
) =>
  useQuery({
    ...contextualTermQueryOptions(articleId, termId),
    enabled: enabled && Boolean(articleId && termId),
  })

export const useReadingHistoryQuery = (
  params: ReadingHistoryParams,
) =>
  useQuery({
    queryKey: readingQueryKeys.history(params),
    queryFn: () => readingApi.history(params),
    placeholderData: keepPreviousData,
    retry: false,
  })

const updateReaderProgress = (
  data: unknown,
  progress: ReaderProgress,
): unknown => {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('progress' in data)
  ) {
    return data
  }

  return { ...data, progress }
}

export const useCompleteReadingMutation = (slug: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (articleId: string) => readingApi.complete(articleId),
    retry: false,
    onSuccess: ({ progress }) => {
      queryClient.setQueryData(
        readingQueryKeys.article(slug),
        (current: unknown) => updateReaderProgress(current, progress),
      )
      void queryClient.invalidateQueries({
        queryKey: readingQueryKeys.histories(),
      })
    },
  })
}

export const useResetReadingMutation = (slug?: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (articleId: string) => {
      try {
        await readingApi.reset(articleId)
      } catch (error: unknown) {
        if (normalizeApiError(error).status !== 404) throw error
      }
    },
    retry: false,
    onSuccess: (_, articleId) => {
      if (slug) {
        queryClient.setQueryData(
          readingQueryKeys.article(slug),
          (current: unknown) =>
            updateReaderProgress(current, {
              articleId,
              status: 'READING',
              progressPercent: 0,
              lastBlockKey: null,
              completedAt: null,
            }),
        )
      }
      void queryClient.invalidateQueries({
        queryKey: readingQueryKeys.histories(),
      })
    },
  })
}

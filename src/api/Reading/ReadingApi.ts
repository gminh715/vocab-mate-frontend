import { apiClient } from '@/config/apiClient'
import type {
  ContextualTermLookupData,
  ReaderArticleData,
  ReadingHistoryData,
  ReadingHistoryParams,
  ReadingProgressData,
  UpdateReadingProgressInput,
} from '@/types/Reading/reading'

const readerArticlesPath = '/reading/articles'
const readingProgressPath = '/reading/progress'

const historySearchParams = ({
  page,
  limit,
  status,
  sort,
}: ReadingHistoryParams): string => {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
  })

  if (status) searchParams.set('status', status)

  return searchParams.toString()
}

export const readingApi = {
  article: (slug: string): Promise<ReaderArticleData> =>
    apiClient.get<ReaderArticleData>(
      `${readerArticlesPath}/${encodeURIComponent(slug)}`,
    ),

  term: (
    articleId: string,
    termId: string,
    signal?: AbortSignal,
  ): Promise<ContextualTermLookupData> =>
    apiClient.get<ContextualTermLookupData>(
      `${readerArticlesPath}/${encodeURIComponent(
        articleId,
      )}/terms/${encodeURIComponent(termId)}`,
      { signal },
    ),

  progress: (articleId: string): Promise<ReadingProgressData> =>
    apiClient.get<ReadingProgressData>(
      `${readingProgressPath}/${encodeURIComponent(articleId)}`,
    ),

  updateProgress: (
    articleId: string,
    input: UpdateReadingProgressInput,
  ): Promise<ReadingProgressData> =>
    apiClient.put<ReadingProgressData>(
      `${readingProgressPath}/${encodeURIComponent(articleId)}`,
      input,
    ),

  complete: (articleId: string): Promise<ReadingProgressData> =>
    apiClient.post<ReadingProgressData>(
      `${readingProgressPath}/${encodeURIComponent(articleId)}/complete`,
    ),

  reset: (articleId: string): Promise<void> =>
    apiClient.deleteNoContent(
      `${readingProgressPath}/${encodeURIComponent(articleId)}`,
    ),

  history: (params: ReadingHistoryParams): Promise<ReadingHistoryData> =>
    apiClient.get<ReadingHistoryData>(
      `/reading/history?${historySearchParams(params)}`,
    ),
}

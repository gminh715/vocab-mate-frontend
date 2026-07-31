import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { adminArticleContentApi } from '@/api/Admin/AdminArticleContentApi'
import type {
  ArticleSentenceListParams,
  ArticleTermListParams,
  CreateArticleTermRequest,
  ParseArticleContentRequest,
  UpdateArticleSentenceRequest,
  UpdateArticleTermRequest,
} from '@/types/Admin/adminArticleContent'
import type { CefrLevel } from '@/types/Auth/auth'
import { adminArticleQueryKeys } from '@/hooks/Admin/useAdminArticles'

export const adminArticleContentQueryKeys = {
  all: ['/adminArticleContent'] as const,
  article: (articleId: string) =>
    [...adminArticleContentQueryKeys.all, articleId] as const,
  sentences: (articleId: string) =>
    [...adminArticleContentQueryKeys.article(articleId), 'sentences'] as const,
  sentenceList: (
    articleId: string,
    params: ArticleSentenceListParams,
  ) => [...adminArticleContentQueryKeys.sentences(articleId), params] as const,
  sentenceDetails: (articleId: string) =>
    [
      ...adminArticleContentQueryKeys.article(articleId),
      'sentence-detail',
    ] as const,
  sentenceDetail: (articleId: string, sentenceId: string) =>
    [
      ...adminArticleContentQueryKeys.sentenceDetails(articleId),
      sentenceId,
    ] as const,
  terms: (articleId: string) =>
    [...adminArticleContentQueryKeys.article(articleId), 'terms'] as const,
  termList: (articleId: string, params: ArticleTermListParams) =>
    [...adminArticleContentQueryKeys.terms(articleId), params] as const,
  termDetails: (articleId: string) =>
    [
      ...adminArticleContentQueryKeys.article(articleId),
      'term-detail',
    ] as const,
  termDetail: (articleId: string, termId: string) =>
    [
      ...adminArticleContentQueryKeys.termDetails(articleId),
      termId,
    ] as const,
  previews: (articleId: string) =>
    [...adminArticleContentQueryKeys.article(articleId), 'preview'] as const,
  preview: (articleId: string, cefrLevel?: CefrLevel) =>
    [
      ...adminArticleContentQueryKeys.previews(articleId),
      cefrLevel ?? 'article-default',
    ] as const,
}

export const adminArticleSentenceListQueryOptions = (
  articleId: string,
  params: ArticleSentenceListParams,
) =>
  queryOptions({
    queryKey: adminArticleContentQueryKeys.sentenceList(articleId, params),
    queryFn: () => adminArticleContentApi.listSentences(articleId, params),
    enabled: Boolean(articleId),
    placeholderData: keepPreviousData,
    retry: false,
  })

export const adminArticleSentenceDetailQueryOptions = (
  articleId: string,
  sentenceId: string,
) =>
  queryOptions({
    queryKey: adminArticleContentQueryKeys.sentenceDetail(
      articleId,
      sentenceId,
    ),
    queryFn: () =>
      adminArticleContentApi.sentenceDetail(articleId, sentenceId),
    enabled: Boolean(articleId && sentenceId),
    retry: false,
  })

export const adminArticleTermListQueryOptions = (
  articleId: string,
  params: ArticleTermListParams,
) =>
  queryOptions({
    queryKey: adminArticleContentQueryKeys.termList(articleId, params),
    queryFn: () => adminArticleContentApi.listTerms(articleId, params),
    enabled: Boolean(articleId),
    placeholderData: keepPreviousData,
    retry: false,
  })

export const adminArticleTermDetailQueryOptions = (
  articleId: string,
  termId: string,
) =>
  queryOptions({
    queryKey: adminArticleContentQueryKeys.termDetail(articleId, termId),
    queryFn: () => adminArticleContentApi.termDetail(articleId, termId),
    enabled: Boolean(articleId && termId),
    retry: false,
  })

export const adminArticlePreviewQueryOptions = (
  articleId: string,
  cefrLevel?: CefrLevel,
) =>
  queryOptions({
    queryKey: adminArticleContentQueryKeys.preview(articleId, cefrLevel),
    queryFn: () => adminArticleContentApi.preview(articleId, cefrLevel),
    enabled: Boolean(articleId),
    retry: false,
  })

export const useAdminArticleSentenceListQuery = (
  articleId: string,
  params: ArticleSentenceListParams,
) => useQuery(adminArticleSentenceListQueryOptions(articleId, params))

export const useAdminArticleSentenceDetailQuery = (
  articleId: string,
  sentenceId: string,
) => useQuery(adminArticleSentenceDetailQueryOptions(articleId, sentenceId))

export const useAdminArticleTermListQuery = (
  articleId: string,
  params: ArticleTermListParams,
) => useQuery(adminArticleTermListQueryOptions(articleId, params))

export const useAdminArticleTermDetailQuery = (
  articleId: string,
  termId: string,
) => useQuery(adminArticleTermDetailQueryOptions(articleId, termId))

export const useAdminArticlePreviewQuery = (
  articleId: string,
  cefrLevel?: CefrLevel,
) => useQuery(adminArticlePreviewQueryOptions(articleId, cefrLevel))

const useInvalidateArticleContent = (articleId: string) => {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({
      queryKey: adminArticleContentQueryKeys.article(articleId),
    })
    void queryClient.invalidateQueries({
      queryKey: adminArticleQueryKeys.detail(articleId),
    })
    void queryClient.invalidateQueries({
      queryKey: adminArticleQueryKeys.lists(),
    })
  }
}

export const useParseAdminArticleContentMutation = (articleId: string) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: (request: ParseArticleContentRequest) =>
      adminArticleContentApi.parse(articleId, request),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useAnalyzeAdminArticleMutation = (articleId: string) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: () => adminArticleContentApi.analyze(articleId),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useUpdateAdminArticleSentenceMutation = (
  articleId: string,
  sentenceId: string,
) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: (request: UpdateArticleSentenceRequest) =>
      adminArticleContentApi.updateSentence(
        articleId,
        sentenceId,
        request,
      ),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useCreateAdminArticleTermMutation = (
  articleId: string,
  sentenceId: string,
) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: (request: CreateArticleTermRequest) =>
      adminArticleContentApi.createTerm(
        articleId,
        sentenceId,
        request,
      ),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useUpdateAdminArticleTermMutation = (
  articleId: string,
  termId: string,
) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: (request: UpdateArticleTermRequest) =>
      adminArticleContentApi.updateTerm(articleId, termId, request),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useDeleteAdminArticleTermMutation = (articleId: string) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: (termId: string) =>
      adminArticleContentApi.deleteTerm(articleId, termId),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useApproveAdminArticleTermMutation = (articleId: string) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: (termId: string) =>
      adminArticleContentApi.approveTerm(articleId, termId),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useRejectAdminArticleTermMutation = (articleId: string) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: (termId: string) =>
      adminArticleContentApi.rejectTerm(articleId, termId),
    onSuccess: invalidate,
    retry: false,
  })
}

export const usePublishAdminArticleMutation = (articleId: string) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: () => adminArticleContentApi.publish(articleId),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useArchiveAdminArticleMutation = (articleId: string) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: () => adminArticleContentApi.archive(articleId),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useRestoreAdminArticleDraftMutation = (articleId: string) => {
  const invalidate = useInvalidateArticleContent(articleId)

  return useMutation({
    mutationFn: () => adminArticleContentApi.restoreDraft(articleId),
    onSuccess: invalidate,
    retry: false,
  })
}

import { apiClient } from '../config/apiClient'
import type {
  ArticleArchiveData,
  ArticlePreviewData,
  ArticlePublishData,
  ArticleRestoreDraftData,
  ArticleSentenceDetail,
  ArticleSentenceListData,
  ArticleSentenceListParams,
  ArticleSentenceMutationData,
  ArticleTermCreateData,
  ArticleTermDetail,
  ArticleTermListData,
  ArticleTermListParams,
  ArticleTermUpdateData,
  CreateArticleTermRequest,
  ParseArticleContentData,
  ParseArticleContentRequest,
  UpdateArticleSentenceRequest,
  UpdateArticleTermRequest,
} from '../types/admin-article-content'
import type { CefrLevel } from '../types/auth'

const articlePath = (articleId: string) =>
  `/admin/articles/${encodeURIComponent(articleId)}`

const sentencePath = (articleId: string, sentenceId?: string) =>
  `${articlePath(articleId)}/sentences${
    sentenceId ? `/${encodeURIComponent(sentenceId)}` : ''
  }`

const termPath = (articleId: string, termId?: string) =>
  `${articlePath(articleId)}/terms${
    termId ? `/${encodeURIComponent(termId)}` : ''
  }`

export const sentenceListRequestParams = (
  params: ArticleSentenceListParams,
) => ({
  page: params.page,
  limit: params.limit,
  ...(params.isActive === undefined
    ? {}
    : { isActive: params.isActive }),
})

export const termListRequestParams = (params: ArticleTermListParams) => ({
  page: params.page,
  limit: params.limit,
  ...(params.sentenceId ? { sentenceId: params.sentenceId } : {}),
  ...(params.cefrLevel ? { cefrLevel: params.cefrLevel } : {}),
  ...(params.unitType ? { unitType: params.unitType } : {}),
  ...(params.isActive === undefined
    ? {}
    : { isActive: params.isActive }),
  ...(params.q ? { q: params.q } : {}),
})

export const adminArticleContentApi = {
  parse: (
    articleId: string,
    request: ParseArticleContentRequest,
  ): Promise<ParseArticleContentData> =>
    apiClient.post<ParseArticleContentData>(
      `${articlePath(articleId)}/parse-content`,
      request,
    ),

  listSentences: (
    articleId: string,
    params: ArticleSentenceListParams,
  ): Promise<ArticleSentenceListData> =>
    apiClient.get<ArticleSentenceListData>(sentencePath(articleId), {
      params: sentenceListRequestParams(params),
    }),

  sentenceDetail: (
    articleId: string,
    sentenceId: string,
  ): Promise<ArticleSentenceDetail> =>
    apiClient.get<ArticleSentenceDetail>(
      sentencePath(articleId, sentenceId),
    ),

  updateSentence: (
    articleId: string,
    sentenceId: string,
    request: UpdateArticleSentenceRequest,
  ): Promise<ArticleSentenceMutationData> =>
    apiClient.patch<ArticleSentenceMutationData>(
      sentencePath(articleId, sentenceId),
      request,
    ),

  createTerm: (
    articleId: string,
    sentenceId: string,
    request: CreateArticleTermRequest,
  ): Promise<ArticleTermCreateData> =>
    apiClient.post<ArticleTermCreateData>(
      `${sentencePath(articleId, sentenceId)}/terms`,
      request,
    ),

  listTerms: (
    articleId: string,
    params: ArticleTermListParams,
  ): Promise<ArticleTermListData> =>
    apiClient.get<ArticleTermListData>(termPath(articleId), {
      params: termListRequestParams(params),
    }),

  termDetail: (
    articleId: string,
    termId: string,
  ): Promise<ArticleTermDetail> =>
    apiClient.get<ArticleTermDetail>(termPath(articleId, termId)),

  updateTerm: (
    articleId: string,
    termId: string,
    request: UpdateArticleTermRequest,
  ): Promise<ArticleTermUpdateData> =>
    apiClient.patch<ArticleTermUpdateData>(
      termPath(articleId, termId),
      request,
    ),

  deleteTerm: (articleId: string, termId: string): Promise<void> =>
    apiClient.deleteNoContent(termPath(articleId, termId)),

  preview: (
    articleId: string,
    cefrLevel?: CefrLevel,
  ): Promise<ArticlePreviewData> =>
    apiClient.get<ArticlePreviewData>(`${articlePath(articleId)}/preview`, {
      params: cefrLevel ? { cefrLevel } : {},
    }),

  publish: (articleId: string): Promise<ArticlePublishData> =>
    apiClient.post<ArticlePublishData>(
      `${articlePath(articleId)}/publish`,
    ),

  archive: (articleId: string): Promise<ArticleArchiveData> =>
    apiClient.post<ArticleArchiveData>(
      `${articlePath(articleId)}/archive`,
    ),

  restoreDraft: (articleId: string): Promise<ArticleRestoreDraftData> =>
    apiClient.post<ArticleRestoreDraftData>(
      `${articlePath(articleId)}/restore-draft`,
    ),
}

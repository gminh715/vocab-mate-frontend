import { apiClient } from '../config/apiClient'
import type {
  AdminArticleDetail,
  AdminArticleListData,
  AdminArticleListParams,
  ArticleMutationData,
  ArticleUpdateData,
  CreateArticleRequest,
  UpdateArticleRequest,
} from '../types/admin-articles'

const adminArticlesPath = '/admin/articles'

export const articleListRequestParams = (
  params: AdminArticleListParams,
) => ({
  page: params.page,
  limit: params.limit,
  ...(params.q ? { q: params.q } : {}),
  ...(params.categoryId ? { categoryId: params.categoryId } : {}),
  ...(params.cefrLevel ? { cefrLevel: params.cefrLevel } : {}),
  ...(params.status ? { status: params.status } : {}),
  sort: params.sort,
})

export const adminArticlesApi = {
  list: (params: AdminArticleListParams): Promise<AdminArticleListData> =>
    apiClient.get<AdminArticleListData>(adminArticlesPath, {
      params: articleListRequestParams(params),
    }),

  detail: (articleId: string): Promise<AdminArticleDetail> =>
    apiClient.get<AdminArticleDetail>(
      `${adminArticlesPath}/${encodeURIComponent(articleId)}`,
    ),

  create: (request: CreateArticleRequest): Promise<ArticleMutationData> =>
    apiClient.post<ArticleMutationData>(adminArticlesPath, request),

  update: (
    articleId: string,
    request: UpdateArticleRequest,
  ): Promise<ArticleUpdateData> =>
    apiClient.patch<ArticleUpdateData>(
      `${adminArticlesPath}/${encodeURIComponent(articleId)}`,
      request,
    ),

  delete: (articleId: string): Promise<void> =>
    apiClient.deleteNoContent(
      `${adminArticlesPath}/${encodeURIComponent(articleId)}`,
    ),
}

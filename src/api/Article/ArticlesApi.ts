import { apiClient } from '@/config/apiClient'
import type {
  ArticleDetailData,
  ArticleListData,
  ArticleListParams,
} from '@/types/Article/articles'

const articlesPath = '/articles'

export const articleListRequestParams = (params: ArticleListParams) => ({
  page: params.page,
  limit: params.limit,
  sort: params.sort,
  ...(params.q ? { q: params.q } : {}),
  ...(params.categorySlug
    ? { categorySlug: params.categorySlug }
    : {}),
  ...(params.cefrLevel ? { cefrLevel: params.cefrLevel } : {}),
})

export const articlesApi = {
  list: (params: ArticleListParams): Promise<ArticleListData> =>
    apiClient.get<ArticleListData>(articlesPath, {
      params: articleListRequestParams(params),
    }),

  detail: (slug: string): Promise<ArticleDetailData> =>
    apiClient.get<ArticleDetailData>(
      `${articlesPath}/${encodeURIComponent(slug)}`,
    ),
}

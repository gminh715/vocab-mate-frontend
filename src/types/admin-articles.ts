import type { PublicCategory } from './admin-categories'
import type { PaginationMeta } from './admin-users'
import type { CefrLevel } from './auth'

export const ARTICLE_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
] as const

export const ADMIN_ARTICLE_SORTS = ['newest', 'oldest'] as const

export type ArticleStatus = (typeof ARTICLE_STATUSES)[number]
export type AdminArticleSort = (typeof ADMIN_ARTICLE_SORTS)[number]

export interface AdminArticleListParams {
  page: number
  limit: number
  q?: string
  categoryId?: string
  cefrLevel?: CefrLevel
  status?: ArticleStatus
  sort: AdminArticleSort
}

export interface AdminArticleListItem {
  id: string
  categoryId: string
  title: string
  slug: string
  summary: string
  thumbnailUrl: string | null
  cefrLevel: CefrLevel
  status: ArticleStatus
  contentVersion: number
  publishedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  category: PublicCategory
}

export interface AdminArticle extends AdminArticleListItem {
  contentHtml: string
  sourceName: string | null
  sourceUrl: string | null
  authorName: string | null
}

export interface AdminArticleListData {
  items: AdminArticleListItem[]
  meta: PaginationMeta
}

export interface AdminArticleDetail {
  article: AdminArticle
  sentenceCount: number
  termCount: number
  quizCount: number
}

export interface CreateArticleRequest {
  categoryId: string
  title: string
  slug: string
  summary: string
  contentHtml: string
  cefrLevel: CefrLevel
  sourceName?: string
  sourceUrl?: string
  authorName?: string
  thumbnailUrl?: string
}

export type UpdateArticleRequest = Partial<CreateArticleRequest>

export interface ArticleMutationData {
  article: AdminArticle
}

export interface ArticleUpdateData extends ArticleMutationData {
  contentChanged: boolean
}

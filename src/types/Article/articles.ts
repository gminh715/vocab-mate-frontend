import type { PublicCategory } from '@/types/Admin/adminCategories'
import type { PaginationMeta } from '@/types/Admin/adminUsers'
import type { ArticleStatus } from '@/types/Admin/adminArticles'
import type { CefrLevel } from '@/types/Auth/auth'

export const ARTICLE_SORTS = ['newest', 'oldest'] as const

export type ArticleSort = (typeof ARTICLE_SORTS)[number]

export interface ArticleListParams {
  page: number
  limit: number
  q?: string
  categorySlug?: string
  cefrLevel?: CefrLevel
  sort: ArticleSort
}

export interface ArticleListItem {
  id: string
  title: string
  slug: string
  summary: string
  thumbnailUrl: string | null
  cefrLevel: CefrLevel
  publishedAt: string | null
  category: PublicCategory
}

export interface ArticleListData {
  items: ArticleListItem[]
  meta: PaginationMeta
}

export interface PublicArticleMetadata {
  id: string
  title: string
  slug: string
  summary: string
  sourceName: string | null
  sourceUrl: string | null
  authorName: string | null
  thumbnailUrl: string | null
  cefrLevel: CefrLevel
  status: ArticleStatus
  publishedAt: string | null
}

export interface ArticleDetailData {
  article: PublicArticleMetadata
  category: PublicCategory
  quizCount: number
}

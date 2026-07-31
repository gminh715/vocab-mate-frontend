export const GUARDIAN_ORDER_OPTIONS = ['newest', 'oldest', 'relevance'] as const
export type GuardianOrder = (typeof GUARDIAN_ORDER_OPTIONS)[number]

export interface AdminNewsSearchParams {
  q?: string
  section?: string
  fromDate?: string
  toDate?: string
  orderBy: GuardianOrder
  page: number
  pageSize: number
}

export interface GuardianNewsArticle {
  externalId: string
  title: string
  description: string
  url: string
  imageUrl: string | null
  sourceName: string
  publishedAt: string
  authorName: string | null
  sectionId: string | null
  sectionName: string | null
}

export interface AdminNewsSearchData {
  totalArticles: number
  articles: GuardianNewsArticle[]
}

export interface AdminNewsSyncRequest
  extends Omit<AdminNewsSearchParams, 'page'> {
  defaultCategoryId: string
}

export type NewsSyncItemStatus =
  | 'imported'
  | 'skippedDuplicate'
  | 'failed'

export interface NewsSyncItem {
  status: NewsSyncItemStatus
  externalId: string
  title: string
  canonicalUrl: string
  articleId?: string
  errorCode?: string
  errorMessage?: string
}

export interface NewsSyncCounts {
  discovered: number
  imported: number
  skippedDuplicate: number
  failed: number
}

export interface AdminNewsSyncData {
  counts: NewsSyncCounts
  items: NewsSyncItem[]
}

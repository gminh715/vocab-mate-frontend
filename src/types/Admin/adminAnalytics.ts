import type { ArticleStatus } from '@/types/Admin/adminArticles'
import type { CefrLevel, UserStatus } from '@/types/Auth/auth'

export interface AnalyticsDateFilters {
  from?: string
  to?: string
}

export interface AdminAnalyticsFilters extends AnalyticsDateFilters {
  categoryId?: string
  status?: UserStatus
}

export interface AnalyticsRequestParams {
  from?: string
  to?: string
}

export interface ContentAnalyticsRequestParams
  extends AnalyticsRequestParams {
  categoryId?: string
}

export interface UserAnalyticsRequestParams extends AnalyticsRequestParams {
  status?: UserStatus
}

export interface AdminAnalyticsOverview {
  users: number
  activeUsers: number
  articles: number
  publishedArticles: number
  savedVocabulary: number
}

export interface AdminTopArticle {
  articleId: string
  title: string
  slug: string
  status: ArticleStatus
  category: string
  openedCount: number
  completedCount: number
  savedVocabularyCount: number
}

export interface AdminArticleCompletion {
  articleId: string
  title: string
  opened: number
  completed: number
  completionRate: number
}

export interface AdminTermSave {
  articleSentenceTermId: string
  value: string
  lemma: string
  cefrLevel: CefrLevel
  articleId: string
  articleTitle: string
  saveCount: number
}

export interface AdminContentAnalytics {
  topArticles: AdminTopArticle[]
  completionRates: AdminArticleCompletion[]
  termSaveCounts: AdminTermSave[]
}

export interface RegistrationTrendBucket {
  bucket: string
  registrations: number
}

export interface RetentionProxy {
  firstWindowActive: number
  secondWindowActive: number
  retainedUsers: number
  rate: number
}

export interface LearningDistribution {
  inactive: number
  readingOnly: number
  vocabularyOnly: number
  multiActivity: number
}

export interface AdminUserAnalytics {
  registrationsTrend: RegistrationTrendBucket[]
  activeLearners: number
  retentionProxy: RetentionProxy
  learningDistribution: LearningDistribution
}

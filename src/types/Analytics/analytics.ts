import type { QuestionType } from '@/types/Admin/adminQuizzes'
import type { CefrLevel } from '@/types/Auth/auth'
import type { LearningStatus } from '@/types/Vocabulary/vocabulary'

export const ANALYTICS_GROUP_BY_VALUES = ['DAY', 'WEEK', 'MONTH'] as const

export type AnalyticsGroupBy =
  (typeof ANALYTICS_GROUP_BY_VALUES)[number]

export interface AnalyticsDateFilters {
  from?: string
  to?: string
}

export interface AnalyticsFilters extends AnalyticsDateFilters {
  groupBy?: AnalyticsGroupBy
  articleId?: string
}

export interface AnalyticsOverviewParams {
  from?: string
  to?: string
}

export interface AnalyticsOverview {
  savedVocabulary: number
  dueToday: number
  mastered: number
  articlesCompleted: number
  quizAccuracy: number
  sessions: number
}

export interface VocabularyAnalyticsParams
  extends AnalyticsOverviewParams {
  groupBy?: AnalyticsGroupBy
}

export interface QuizAnalyticsParams extends AnalyticsOverviewParams {
  articleId?: string
}

export interface VocabularyAnalyticsTotals {
  total: number
  due: number
  mastered: number
}

export interface VocabularyStatusCount {
  status: LearningStatus
  count: number
}

export interface VocabularyCefrCount {
  cefrLevel: CefrLevel
  count: number
}

export interface VocabularyTrendBucket {
  bucket: string
  count: number
}

export interface VocabularyAnalytics {
  totals: VocabularyAnalyticsTotals
  byStatus: VocabularyStatusCount[]
  byCefr: VocabularyCefrCount[]
  savedTrend: VocabularyTrendBucket[]
}

export interface ReadingCategoryAnalytics {
  categoryId: string
  categoryName: string
  opened: number
  completed: number
  completionRate: number
}

export interface ReadingTrendBucket {
  bucket: string
  opened: number
  completed: number
}

export interface ReadingAnalytics {
  opened: number
  completed: number
  completionRate: number
  byCategory: ReadingCategoryAnalytics[]
  trend: ReadingTrendBucket[]
}

export interface QuestionTypeAnalytics {
  questionType: QuestionType
  answers: number
  correctAnswers: number
  accuracy: number
}

export interface QuizTrendBucket {
  bucket: string
  sessions: number
  accuracy: number
  averageScore: number
}

export interface QuizAnalytics {
  sessions: number
  accuracy: number
  averageScore: number
  byQuestionType: QuestionTypeAnalytics[]
  trend: QuizTrendBucket[]
}

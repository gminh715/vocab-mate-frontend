import type { QuestionType } from '@/types/Admin/adminQuizzes'
import type { CefrLevel } from '@/types/Auth/auth'
import type { LearningStatus } from '@/types/Vocabulary/vocabulary'
import type {
  ReviewDecisionSource,
  ReviewSkillDimension,
} from '@/types/Review/review'

export const ANALYTICS_GROUP_BY_VALUES = ['DAY', 'WEEK', 'MONTH'] as const
export const ANALYTICS_SECTIONS = [
  'vocabulary',
  'reading',
  'quizzes',
  'reviews',
] as const

export type AnalyticsGroupBy =
  (typeof ANALYTICS_GROUP_BY_VALUES)[number]
export type AnalyticsSection = (typeof ANALYTICS_SECTIONS)[number]

export interface AnalyticsDateFilters {
  from?: string
  to?: string
}

export interface AnalyticsFilters extends AnalyticsDateFilters {
  groupBy?: AnalyticsGroupBy
  articleId?: string
  section?: AnalyticsSection
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

export interface ReviewRetestAnalytics {
  attempts: number
  correct: number
  successRate: number
}

export interface ReviewSkillAnalytics {
  skillDimension: ReviewSkillDimension
  attempts: number
  correct: number
  accuracy: number
  averageResponseTimeMs: number | null
  hintsUsed: number
}

export interface ReviewDurationAnalytics {
  targetDurationMinutes: 5 | 10 | 15
  started: number
  completed: number
  completionRate: number
}

export interface ReviewDecisionSourceAnalytics {
  source: ReviewDecisionSource
  interventions: number
  retestAttempts: number
  successfulRetests: number
  retestSuccessRate: number
}

export interface ReviewRetentionWindow {
  followUps: number
  correct: number
  accuracy: number
}

export interface ReviewTrendBucket {
  bucket: string
  answers: number
  correctAnswers: number
  accuracy: number
  averageResponseTimeMs: number | null
  hintsUsed: number
}

export interface ReviewAnalytics {
  sessionsStarted: number
  sessionsCompleted: number
  sessionsAbandoned: number
  completionRate: number
  answers: number
  correctAnswers: number
  accuracy: number
  averageResponseTimeMs: number | null
  hintsUsed: number
  sameSessionRetest: ReviewRetestAnalytics
  bySkill: ReviewSkillAnalytics[]
  byDuration: ReviewDurationAnalytics[]
  byDecisionSource: ReviewDecisionSourceAnalytics[]
  retention: {
    nextDay: ReviewRetentionWindow
    sevenDay: ReviewRetentionWindow
  }
  trend: ReviewTrendBucket[]
}

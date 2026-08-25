import type { QuestionType } from '@/types/Review/review'
import type { CefrLevel } from '@/types/Auth/auth'
import type { LearningStatus } from '@/types/Vocabulary/vocabulary'

const ratioFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
})

const LEARNING_STATUS_LABELS: Record<LearningStatus, string> = {
  NEW: 'New',
  LEARNING: 'Learning',
  REVIEWING: 'Reviewing',
  MASTERED: 'Mastered',
  IGNORED: 'Ignored',
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SELECT_MEANING: 'Select meaning',
  SELECT_WORD: 'Select word',
  SELECT_CORRECT_CONTEXT: 'Select correct context',
  FILL_BLANK: 'Fill in the blank',
}

export const formatAnalyticsRatio = (
  value: number | null | undefined,
): string =>
  ratioFormatter.format(
    typeof value === 'number' && Number.isFinite(value)
      ? Math.min(1, Math.max(0, value))
      : 0,
  )

export const learningStatusLabel = (
  status: LearningStatus,
): string => LEARNING_STATUS_LABELS[status]

export const cefrLevelLabel = (level: CefrLevel): string => `CEFR ${level}`

export const questionTypeLabel = (
  type: QuestionType,
): string => QUESTION_TYPE_LABELS[type]

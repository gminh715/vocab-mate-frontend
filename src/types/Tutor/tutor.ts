export const TUTOR_SESSION_STATUSES = [
  'ACTIVE',
  'COMPLETED',
  'ABANDONED',
] as const
export type TutorSessionStatus = (typeof TUTOR_SESSION_STATUSES)[number]

export const TUTOR_SESSION_ITEM_STATUSES = [
  'PENDING',
  'ANSWERED',
  'SKIPPED',
] as const
export type TutorSessionItemStatus = (typeof TUTOR_SESSION_ITEM_STATUSES)[number]

export const TUTOR_QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'CONTEXTUAL_CLOZE',
  'TYPED_RECALL',
  'MICRO_LESSON_RETEST',
] as const
export type TutorQuestionType = (typeof TUTOR_QUESTION_TYPES)[number]

export const FSRS_CARD_STATES = [
  'NEW',
  'LEARNING',
  'REVIEW',
  'RELEARNING',
] as const
export type FsrsCardState = (typeof FSRS_CARD_STATES)[number]

export interface WarmupFactStory {
  title: string
  factContentVi: string
  targetWords: string[]
}

export interface TutorSessionSummary {
  id: string
  userId: string
  studyDate: string
  status: TutorSessionStatus
  targetDurationMinutes: number
  targetActivityCount: number
  newWordTarget: number
  warmupFacts?: WarmupFactStory[] | null
  startedAt: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export const OPTION_IDS = ['A', 'B', 'C', 'D'] as const
export type OptionId = (typeof OPTION_IDS)[number]

export interface MultipleChoiceOption {
  id: OptionId
  text: string
}

export interface BaseQuestionPayload {
  questionPromptVi: string
  wordDisplay?: string
  meaningVi?: string
}

export interface MultipleChoicePayload extends BaseQuestionPayload {
  options: MultipleChoiceOption[]
}

export interface ContextualClozePayload extends BaseQuestionPayload {
  sentenceWithBlank: string
}

export interface TypedRecallPayload extends BaseQuestionPayload {
  recallPromptVi: string
}

export interface MicroLessonRetestPayload extends BaseQuestionPayload {
  microLessonTitle?: string
  microLessonFactEn?: string
  microLessonFactVi?: string
  microLessonVi: string
  retestType: 'CONTEXTUAL_CLOZE' | 'TYPED_RECALL'
  sentenceWithBlank?: string
  recallPromptVi?: string
}

export type TutorQuestionPayload =
  | MultipleChoicePayload
  | ContextualClozePayload
  | TypedRecallPayload
  | MicroLessonRetestPayload

export interface TutorSessionPendingItem {
  id: string
  sessionId: string
  userVocabularyId: string | null
  position: number
  status: TutorSessionItemStatus
  questionType: TutorQuestionType
  isNewWord: boolean
  questionPayload: TutorQuestionPayload | Record<string, unknown>
  hintUsed: boolean
  generatedAt: string
}

export interface TutorSessionAnsweredItem extends TutorSessionPendingItem {
  userAnswer: unknown
  isCorrect: boolean | null
  responseTimeMs: number | null
  fsrsRating: number | null
  feedbackVi: string | null
  correctAnswer: unknown
  explanationVi: string | null
  answeredAt: string | null
}

export interface RatingDistribution {
  again: number
  hard: number
  good: number
  easy: number
}

export interface TutorSessionSummaryStats {
  durationSeconds: number
  plannedActivities: number
  completedActivities: number
  correctCount: number
  incorrectCount: number
  newWordsStudied: number
  reviewWordsStudied: number
  ratingDistribution: RatingDistribution
  relearningWords: string[]
  nextDueCount: number
}

export interface TodayStatusData {
  canStart: boolean
  canResume: boolean
  isCompletedToday: boolean
  isAbandoned: boolean
  dueCount: number
  session: TutorSessionSummary | null
}

export interface TutorSessionWithItemData {
  session: TutorSessionSummary
  currentItem: TutorSessionPendingItem | null
  summary: TutorSessionSummaryStats | null
}

export interface TutorSessionDetailData {
  session: TutorSessionSummary
  items: TutorSessionAnsweredItem[]
  summary: TutorSessionSummaryStats | null
}

export interface SubmitAnswerResponseData {
  item: TutorSessionAnsweredItem
  sessionStatus: TutorSessionStatus
  isSessionCompleted: boolean
}

export interface TutorHistoryData {
  items: TutorSessionSummary[]
  nextCursor: string | null
  hasMore: boolean
}

export interface SubmitAnswerRequest {
  answer: unknown
  hintUsed: boolean
  responseTimeMs?: number
}

export interface TutorHistoryQuery {
  cursor?: string
  limit?: number
}

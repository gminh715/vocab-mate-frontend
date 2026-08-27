export const QUESTION_TYPES = [
  'SELECT_MEANING',
  'SELECT_WORD',
  'SELECT_CORRECT_CONTEXT',
  'FILL_BLANK',
] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export const REVIEW_TARGET_DURATIONS = [5, 10, 15] as const
export const REVIEW_GOALS = [
  'BALANCED',
  'RECALL',
  'SPELLING',
  'CONTEXT',
] as const
export type ReviewTargetDuration = (typeof REVIEW_TARGET_DURATIONS)[number]
export type ReviewGoal = (typeof REVIEW_GOALS)[number]
export type ReviewSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
export type ReviewPreparationStatus = 'PREPARING' | 'READY' | 'FAILED'
export type ReviewPreparationStage =
  | 'SELECTING_VOCABULARY'
  | 'CHECKING_CACHE'
  | 'GENERATING_QUESTIONS'
  | 'CREATING_SESSION'
  | 'PLANNING_SESSION'
  | 'READY'
  | 'FAILED'
export type ReviewDecisionSource = 'AI'
export type ReviewAgentAction =
  | 'CONTINUE'
  | 'REQUEUE_WITH_NEW_TYPE'
  | 'TEACH_AND_REQUEUE'
  | 'FLAG_FOR_FUTURE_FOCUS'
export type ReviewSkillDimension =
  | 'RECOGNITION'
  | 'RECALL'
  | 'SPELLING'
  | 'CONTEXT'
  | 'PRODUCTION'
export type ReviewErrorType =
  | 'LOW_RECALL'
  | 'MEANING_CONFUSION'
  | 'CONFUSABLE_WORD'
  | 'SPELLING_ERROR'
  | 'WORD_FORM_ERROR'
  | 'COLLOCATION_ERROR'
  | 'CONTEXT_MISUNDERSTANDING'
  | 'CARELESS_ERROR'
  | 'UNKNOWN'

export interface ReviewSession {
  id: string
  targetDurationMinutes: ReviewTargetDuration | null
  reviewGoal: ReviewGoal | null
  plannedItemCount: number | null
  planSummary: string | null
  status: ReviewSessionStatus
  startedAt: string
  completedAt: string | null
}

export interface ReviewQuestionOption {
  id: string
  text: string
  displayOrder: number
}

export interface ReviewQuestion {
  id: string
  questionType: QuestionType
  prompt: string
  blankSentence: string | null
  answerWordLengths: number[] | null
  points: number
  displayOrder: number
  options: ReviewQuestionOption[]
}

export interface ReviewSessionItem {
  id: string
  userVocabularyId: string
  attemptNumber: number
  question: ReviewQuestion
}

export interface ReviewProgress {
  answeredCount: number
  totalQuestions: number
  remainingCount: number
  progressPercent: number
}

export interface ReviewAgentMicroLesson {
  title: string
  explanation: string
  example: string
}

export interface ReviewAgentFeedback {
  source: ReviewDecisionSource
  action: ReviewAgentAction
  skillDimension: ReviewSkillDimension
  errorType: ReviewErrorType
  microLesson?: ReviewAgentMicroLesson
  retestAfterItems?: number
}

export interface ReviewSessionState {
  session: ReviewSession
  progress: ReviewProgress
  nextItem?: ReviewSessionItem
  agentFeedback?: ReviewAgentFeedback
}

export interface StartReviewSessionRequest {
  preparationId?: string
  limit?: number
  targetDurationMinutes?: ReviewTargetDuration
  reviewGoal?: ReviewGoal
}

export interface RevealReviewHintRequest {
  reviewSessionItemId: string
  hintIndex: number
}

export interface RevealedReviewHint {
  revealedCharacter: string
  wordIndex: number
  characterIndex: number
  totalCharacters: number
}

export interface ReviewPreparationProgress {
  preparationId: string
  status: ReviewPreparationStatus
  stage: ReviewPreparationStage
  progressPercent: number
  completedItems: number
  totalItems: number
}

export interface SubmitReviewAnswerRequest {
  reviewSessionItemId: string
  reviewQuestionId: string
  selectedOptionId?: string
  userAnswerText?: string
  responseTimeMs?: number
  hintsUsed?: number
}

export interface SkipReviewItemRequest {
  reviewSessionItemId: string
  reviewQuestionId: string
}

export interface ReviewResult {
  score: number
  totalPoints: number
  accuracy: number
  correctCount: number
  completedAt: string
}

export interface SubmittedReviewAnswer {
  answerId: string
  isCorrect: boolean
  correctAnswer: string
  explanation: string
  earnedPoints: number
  inferredReviewScore: number
  willReturnLater: boolean
  sessionCompleted: boolean
  progress: ReviewProgress
  nextQuestion?: ReviewSessionItem
  agentFeedback?: ReviewAgentFeedback
  completionSummary?: ReviewResult
}

export interface SkippedReviewItem {
  inferredReviewScore: number
  sessionCompleted: boolean
  progress: ReviewProgress
  nextQuestion?: ReviewSessionItem
  completionSummary?: ReviewResult
}

export interface AbandonedReviewSession {
  id: string
  status: 'ABANDONED'
}

export interface CompletedReviewAnswer {
  reviewQuestionId: string
  questionType: QuestionType
  prompt: string
  selectedOption: ReviewQuestionOption | null
  userAnswerText: string | null
  correctAnswer: string
  explanation: string | null
  isCorrect: boolean
  points: number
  earnedPoints: number
  answeredAt: string
}

export interface ReviewSkillBreakdownItem {
  skillDimension: ReviewSkillDimension
  attempts: number
  correct: number
  accuracy: number
}

export interface ReviewWordToRevisit {
  userVocabularyId: string | null
  wordOrPhrase: string
  meaningVi: string | null
  skillDimension: ReviewSkillDimension | null
  errorType: ReviewErrorType | null
  explanation: string | null
  recoveredInSession: boolean
}

export interface CompletedReviewResult {
  result: ReviewResult
  answers: CompletedReviewAnswer[]
  skillBreakdown: ReviewSkillBreakdownItem[]
  wordsToRevisit: ReviewWordToRevisit[]
}

export interface ReviewHistoryParams {
  page?: number
  limit?: number
  status?: ReviewSessionStatus
  from?: string
  to?: string
}

export interface ReviewHistoryAggregate {
  answeredCount: number
  correctCount: number
  score: number
  totalPoints: number
  accuracy: number
}

export interface ReviewHistoryItem {
  session: ReviewSession
  aggregates: ReviewHistoryAggregate
}

export interface ReviewHistory {
  items: ReviewHistoryItem[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DueReviews {
  dueVocabularyCount: number
}

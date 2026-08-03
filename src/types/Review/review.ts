import type { QuestionType } from '@/types/Admin/adminQuizzes'

export const REVIEW_SESSION_TYPES = [
  'QUIZ',
  'DAILY_REVIEW',
  'ARTICLE_REVIEW',
  'COLLECTION_REVIEW',
] as const

export type ReviewSessionType = (typeof REVIEW_SESSION_TYPES)[number]
export type ReviewSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'

export interface ReviewSession {
  id: string
  sessionType: ReviewSessionType
  quizId: string | null
  articleId: string | null
  collectionId: string | null
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

export interface ReviewSessionState {
  session: ReviewSession
  progress: ReviewProgress
  nextItem?: ReviewSessionItem
}

export interface StartReviewSessionRequest {
  sessionType: ReviewSessionType
  quizId?: string | null
  articleId?: string | null
  collectionId?: string | null
  limit?: number
}

export interface SubmitReviewAnswerRequest {
  reviewSessionItemId: string
  quizQuestionId: string
  selectedOptionId?: string
  userAnswerText?: string
  responseTimeMs?: number
  hintsUsed?: number
}

export interface SkipReviewItemRequest {
  reviewSessionItemId: string
  quizQuestionId: string
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
  completionSummary?: ReviewResult
}

export interface SkippedReviewItem {
  inferredReviewScore: number
  sessionCompleted: boolean
  progress: ReviewProgress
  nextQuestion?: ReviewSessionItem
  completionSummary?: ReviewResult
}

export interface CompletedReviewAnswer {
  quizQuestionId: string
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

export interface CompletedReviewResult {
  result: ReviewResult
  answers: CompletedReviewAnswer[]
}

export interface RecommendedReviewQuiz {
  id: string
  title: string
  description: string | null
  publishedAt: string | null
  matchingDueVocabularyCount: number
  activeQuestionCount: number
  totalPoints: number
  article: {
    id: string
    title: string
    slug: string
    thumbnailUrl: string | null
  }
}

export interface DueReviews {
  dueVocabularyCount: number
  recommendedQuizzes: RecommendedReviewQuiz[]
}

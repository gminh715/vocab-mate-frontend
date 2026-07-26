import type { PaginationMeta } from '@/types/Admin/adminUsers'

export const QUIZ_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const
export const QUESTION_TYPES = [
  'SELECT_MEANING',
  'SELECT_WORD',
  'SELECT_CORRECT_CONTEXT',
  'FILL_BLANK',
] as const

export type QuizStatus = (typeof QUIZ_STATUSES)[number]
export type QuestionType = (typeof QUESTION_TYPES)[number]

export interface AdminQuizListParams {
  page: number
  limit: number
  q?: string
  articleId?: string
  status?: QuizStatus
}

export interface AdminQuiz {
  id: string
  articleId: string
  title: string
  description: string | null
  status: QuizStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminQuizListItem extends AdminQuiz {
  questionCount: number
}

export interface AdminQuestionOption {
  id: string
  quizQuestionId: string
  optionText: string
  isCorrect: boolean
  explanation: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface AdminQuizQuestion {
  id: string
  quizId: string
  articleVocabularyId: string
  questionType: QuestionType
  prompt: string
  blankSentence: string | null
  correctAnswerText: string | null
  answerExplanation: string | null
  isCaseSensitive: boolean
  points: number
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  options: AdminQuestionOption[]
}

export interface AdminQuizListData {
  items: AdminQuizListItem[]
  meta: PaginationMeta
}

export interface AdminQuizDetailData {
  quiz: AdminQuiz
  questions: AdminQuizQuestion[]
}

export interface QuizMutationData {
  quiz: AdminQuiz
}

export interface QuestionMutationData {
  question: AdminQuizQuestion
}

export interface QuestionDetailData {
  question: AdminQuizQuestion
  options: AdminQuestionOption[]
}

export interface OptionMutationData {
  option: AdminQuestionOption
}

export interface CreateQuizRequest {
  articleId: string
  title: string
  description?: string
}

export interface UpdateQuizRequest {
  title?: string
  description?: string
}

export interface QuizQuestionRequest {
  articleVocabularyId: string
  questionType: QuestionType
  prompt: string
  blankSentence?: string | null
  correctAnswerText?: string | null
  answerExplanation?: string | null
  isCaseSensitive?: boolean
  points?: number
  displayOrder?: number
  isActive?: boolean
}

export type UpdateQuizQuestionRequest = Partial<QuizQuestionRequest>

export interface QuestionOptionRequest {
  optionText: string
  isCorrect?: boolean
  explanation?: string | null
  displayOrder?: number
}

export type UpdateQuestionOptionRequest = Partial<QuestionOptionRequest>

export interface QuizPublishData {
  id: string
  status: 'PUBLISHED'
  publishedAt: string
}

export interface QuizStatusTransitionData {
  id: string
  status: QuizStatus
}

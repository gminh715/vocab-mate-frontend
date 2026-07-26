import { beforeEach, describe, expect, it, vi } from 'vitest'

const clientMocks = vi.hoisted(() => ({
  deleteNoContent: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/config/apiClient', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@/config/apiClient')>()
  return {
    ...original,
    apiClient: {
      deleteNoContent: clientMocks.deleteNoContent,
      get: clientMocks.get,
      patch: clientMocks.patch,
      post: clientMocks.post,
    },
  }
})

import {
  adminQuizzesApi,
  quizListRequestParams,
} from '@/api/Admin/AdminQuizzesApi'
import { ApiError } from '@/config/apiClient'
import { adminQuizQueryKeys } from '@/hooks/Admin/useAdminQuizzes'
import {
  questionFormSchema,
  toQuestionRequest,
} from '@/schemas/Admin/adminQuiz'
import { adminQuizListParamsFromSearchParams } from '@/utils/Admin/adminQuizListParams'
import { quizOrderingErrorMessage } from '@/utils/Admin/adminQuizErrors'

const baseQuestion = {
  articleVocabularyId: '550e8400-e29b-41d4-a716-446655440001',
  prompt: 'Choose the contextual meaning.',
  answerExplanation: 'This matches the article context.',
  points: 2,
  displayOrder: 3,
  isActive: true,
}

describe('admin quiz DTO mapping', () => {
  it('maps option-based questions without fill-blank answers', () => {
    const values = questionFormSchema.parse({
      ...baseQuestion,
      questionType: 'SELECT_MEANING',
      blankSentence: 'stale blank',
      correctAnswerText: 'stale answer',
      isCaseSensitive: true,
    })

    expect(toQuestionRequest(values)).toEqual({
      ...baseQuestion,
      questionType: 'SELECT_MEANING',
      blankSentence: null,
      correctAnswerText: null,
      isCaseSensitive: false,
    })
  })

  it('maps fill blank answers and never creates an options field', () => {
    const values = questionFormSchema.parse({
      ...baseQuestion,
      questionType: 'FILL_BLANK',
      blankSentence: 'The lesson was ___.',
      correctAnswerText: 'engaging',
      isCaseSensitive: false,
    })
    const request = toQuestionRequest(values)

    expect(request).toMatchObject({
      questionType: 'FILL_BLANK',
      blankSentence: 'The lesson was ___.',
      correctAnswerText: 'engaging',
    })
    expect(request).not.toHaveProperty('options')
  })

  it('requires both fill-blank answer fields', () => {
    const result = questionFormSchema.safeParse({
      ...baseQuestion,
      questionType: 'FILL_BLANK',
      blankSentence: '',
      correctAnswerText: '',
      isCaseSensitive: false,
    })

    expect(result.success).toBe(false)
  })
})

describe('admin quiz filters and isolation', () => {
  it('maps supported list query values and drops invalid status values', () => {
    const params = adminQuizListParamsFromSearchParams(
      new URLSearchParams(
        'page=2&limit=50&q=%20context%20&articleId=article-1&status=PUBLISHED',
      ),
    )
    expect(params).toEqual({
      page: 2,
      limit: 50,
      q: 'context',
      articleId: 'article-1',
      status: 'PUBLISHED',
    })
    expect(quizListRequestParams(params)).toEqual(params)
    expect(
      adminQuizListParamsFromSearchParams(
        new URLSearchParams('status=REVIEW&page=0&limit=101'),
      ),
    ).toEqual({ page: 1, limit: 20 })
  })

  it('keeps answer-bearing admin detail keys outside public quiz caches', () => {
    expect(adminQuizQueryKeys.detail('quiz-1')).toEqual([
      '/adminQuizzes',
      'detail-with-answer-key',
      'quiz-1',
    ])
    expect(adminQuizQueryKeys.detail('quiz-1')).not.toContain('/quizzes')
  })
})

describe('ordering conflicts and lifecycle API actions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('turns duplicate-order 409 responses into actionable feedback', () => {
    const conflict = new ApiError({
      status: 409,
      code: 'CONFLICT',
      message: 'Display order already exists.',
    })

    expect(quizOrderingErrorMessage(conflict, 'question')).toBe(
      'Display order already exists. Choose a display order not used by another question.',
    )
  })

  it('calls the publish, archive, and restore-draft endpoints', async () => {
    clientMocks.post.mockResolvedValue({ id: 'quiz-1' })

    await adminQuizzesApi.publish('quiz/1')
    await adminQuizzesApi.archive('quiz/1')
    await adminQuizzesApi.restoreDraft('quiz/1')

    expect(clientMocks.post.mock.calls).toEqual([
      ['/admin/quizzes/quiz%2F1/publish'],
      ['/admin/quizzes/quiz%2F1/archive'],
      ['/admin/quizzes/quiz%2F1/restore-draft'],
    ])
  })
})

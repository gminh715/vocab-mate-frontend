import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { analyticsQueryKeys } from '@/hooks/Analytics/useAnalytics'
import {
  reviewQueryKeys,
  useAbandonReviewSessionMutation,
  useSkipReviewItemMutation,
  useSubmitReviewAnswerMutation,
} from '@/hooks/Review/useReviews'
import { vocabularyQueryKeys } from '@/hooks/Vocabulary/useVocabularies'
import type {
  ReviewSessionItem,
  ReviewSessionState,
} from '@/types/Review/review'

const { answer, skip, abandon } = vi.hoisted(() => ({
  answer: vi.fn(),
  skip: vi.fn(),
  abandon: vi.fn(),
}))

vi.mock('@/api/Review/ReviewsApi', () => ({
  reviewsApi: {
    answer,
    skip,
    abandon,
  },
}))

const firstItem: ReviewSessionItem = {
  id: 'item-1',
  userVocabularyId: 'vocabulary-1',
  attemptNumber: 1,
  question: {
    id: 'question-1',
    questionType: 'SELECT_MEANING',
    prompt: 'Choose the meaning.',
    blankSentence: null,
    points: 1,
    displayOrder: 1,
    options: [{ id: 'option-1', text: 'meaning', displayOrder: 1 }],
  },
}

const nextItem: ReviewSessionItem = {
  ...firstItem,
  id: 'item-2',
  userVocabularyId: 'vocabulary-2',
  question: { ...firstItem.question, id: 'question-2' },
}

const initialState: ReviewSessionState = {
  session: {
    id: 'session-1',
    planSummary: null,
    status: 'IN_PROGRESS',
    startedAt: '2026-08-03T01:00:00.000Z',
    completedAt: null,
  },
  progress: {
    answeredCount: 0,
    totalQuestions: 2,
    remainingCount: 2,
    progressPercent: 0,
  },
  nextItem: firstItem,
}

const advancedProgress = {
  answeredCount: 1,
  totalQuestions: 2,
  remainingCount: 1,
  progressPercent: 50,
}

const createHarness = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(reviewQueryKeys.session('session-1'), initialState)
  queryClient.setQueryData(reviewQueryKeys.active(), initialState)
  queryClient.setQueryData(reviewQueryKeys.today(), { dueVocabularyCount: 2 })
  queryClient.setQueryData(vocabularyQueryKeys.all, { cached: true })
  queryClient.setQueryData(analyticsQueryKeys.all, { cached: true })

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('review mutations', () => {
  beforeEach(() => {
    answer.mockReset()
    skip.mockReset()
    abandon.mockReset()
  })

  it('atomically replaces session and active cache from an answer transition', async () => {
    answer.mockResolvedValue({
      answerId: 'answer-1',
      isCorrect: true,
      correctAnswer: 'meaning',
      explanation: 'Explanation',
      earnedPoints: 1,
      inferredReviewScore: 4,
      willReturnLater: false,
      sessionCompleted: false,
      progress: advancedProgress,
      nextQuestion: nextItem,
    })
    const { queryClient, wrapper } = createHarness()
    const { result } = renderHook(
      () => useSubmitReviewAnswerMutation('session-1'),
      { wrapper },
    )

    await act(() =>
      result.current.mutateAsync({
        reviewSessionItemId: 'item-1',
        reviewQuestionId: 'question-1',
        selectedOptionId: 'option-1',
      }),
    )

    expect(
      queryClient.getQueryData<ReviewSessionState>(
        reviewQueryKeys.session('session-1'),
      ),
    ).toMatchObject({ progress: advancedProgress, nextItem })
    expect(
      queryClient.getQueryData<ReviewSessionState>(reviewQueryKeys.active()),
    ).toMatchObject({ progress: advancedProgress, nextItem })
    expect(queryClient.getQueryState(reviewQueryKeys.today())?.isInvalidated).toBe(
      true,
    )
    expect(queryClient.getQueryState(vocabularyQueryKeys.all)?.isInvalidated).toBe(
      true,
    )
    expect(queryClient.getQueryState(analyticsQueryKeys.all)?.isInvalidated).toBe(
      true,
    )
  })

  it('marks a completed skip in session cache and clears active and placeholder summary caches', async () => {
    skip.mockResolvedValue({
      inferredReviewScore: 0,
      sessionCompleted: true,
      progress: {
        answeredCount: 2,
        totalQuestions: 2,
        remainingCount: 0,
        progressPercent: 100,
      },
      completionSummary: {
        score: 1,
        totalPoints: 2,
        accuracy: 0.5,
        correctCount: 1,
        completedAt: '2026-08-03T02:00:00.000Z',
      },
    })
    const { queryClient, wrapper } = createHarness()
    queryClient.setQueryData(reviewQueryKeys.summary('session-1'), {
      stale: true,
    })
    const { result } = renderHook(
      () => useSkipReviewItemMutation('session-1'),
      { wrapper },
    )

    await act(() =>
      result.current.mutateAsync({
        reviewSessionItemId: 'item-1',
        reviewQuestionId: 'question-1',
      }),
    )

    expect(
      queryClient.getQueryData<ReviewSessionState>(
        reviewQueryKeys.session('session-1'),
      ),
    ).toMatchObject({
      session: {
        status: 'COMPLETED',
        completedAt: '2026-08-03T02:00:00.000Z',
      },
      progress: { progressPercent: 100 },
    })
    expect(queryClient.getQueryData(reviewQueryKeys.active())).toBeUndefined()
    expect(
      queryClient.getQueryData(reviewQueryKeys.summary('session-1')),
    ).toBeUndefined()
  })

  it('keeps newer cached progress when a stale transition resolves later', async () => {
    answer.mockResolvedValue({
      answerId: 'stale-answer',
      isCorrect: true,
      correctAnswer: 'meaning',
      explanation: 'Explanation',
      earnedPoints: 1,
      inferredReviewScore: 4,
      willReturnLater: false,
      sessionCompleted: false,
      progress: advancedProgress,
      nextQuestion: nextItem,
    })
    const { queryClient, wrapper } = createHarness()
    const newestState: ReviewSessionState = {
      ...initialState,
      progress: {
        answeredCount: 2,
        totalQuestions: 3,
        remainingCount: 1,
        progressPercent: 66.67,
      },
      nextItem: { ...nextItem, id: 'item-3' },
    }
    queryClient.setQueryData(reviewQueryKeys.session('session-1'), newestState)
    queryClient.setQueryData(reviewQueryKeys.active(), newestState)
    const { result } = renderHook(
      () => useSubmitReviewAnswerMutation('session-1'),
      { wrapper },
    )

    await act(() =>
      result.current.mutateAsync({
        reviewSessionItemId: 'item-1',
        reviewQuestionId: 'question-1',
        selectedOptionId: 'option-1',
      }),
    )

    expect(
      queryClient.getQueryData<ReviewSessionState>(
        reviewQueryKeys.session('session-1'),
      ),
    ).toMatchObject(newestState)
    expect(
      queryClient.getQueryData<ReviewSessionState>(reviewQueryKeys.active()),
    ).toMatchObject(newestState)
  })

  it('persists answer coaching in both review caches', async () => {
    const agentFeedback = {
      source: 'AI' as const,
      action: 'REQUEUE_WITH_NEW_TYPE' as const,
      skillDimension: 'RECALL' as const,
      errorType: 'LOW_RECALL' as const,
      retestAfterItems: 2,
    }
    answer.mockResolvedValue({
      answerId: 'answer-1',
      isCorrect: false,
      correctAnswer: 'meaning',
      explanation: 'Explanation',
      earnedPoints: 0,
      inferredReviewScore: 0,
      willReturnLater: true,
      sessionCompleted: false,
      progress: advancedProgress,
      nextQuestion: nextItem,
      agentFeedback,
    })
    const { queryClient, wrapper } = createHarness()
    const { result } = renderHook(
      () => useSubmitReviewAnswerMutation('session-1'),
      { wrapper },
    )

    await act(() =>
      result.current.mutateAsync({
        reviewSessionItemId: 'item-1',
        reviewQuestionId: 'question-1',
        selectedOptionId: 'option-1',
      }),
    )

    expect(
      queryClient.getQueryData<ReviewSessionState>(
        reviewQueryKeys.session('session-1'),
      )?.agentFeedback,
    ).toEqual(agentFeedback)
    expect(
      queryClient.getQueryData<ReviewSessionState>(reviewQueryKeys.active())
        ?.agentFeedback,
    ).toEqual(agentFeedback)
  })

  it('abandons the durable session and clears the active-session cache', async () => {
    abandon.mockResolvedValue({ id: 'session-1', status: 'ABANDONED' })
    const { queryClient, wrapper } = createHarness()
    const { result } = renderHook(
      () => useAbandonReviewSessionMutation('session-1'),
      { wrapper },
    )

    await act(() => result.current.mutateAsync())

    expect(
      queryClient.getQueryData<ReviewSessionState>(
        reviewQueryKeys.session('session-1'),
      )?.session.status,
    ).toBe('ABANDONED')
    expect(queryClient.getQueryData(reviewQueryKeys.active())).toBeUndefined()
  })
})

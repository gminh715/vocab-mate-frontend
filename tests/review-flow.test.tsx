import { ThemeProvider } from '@mui/material/styles'
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from '@tanstack/react-query'
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import {
  RouterProvider,
  createMemoryRouter,
  type InitialEntry,
} from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reviewsApi } from '@/api/Review/ReviewsApi'
import {
  reviewQueryKeys,
  useSkipReviewItemMutation,
  useSubmitReviewAnswerMutation,
} from '@/hooks/Review/useReviews'
import { ReviewPage } from '@/pages/Review/ReviewPage'
import { ReviewSummaryPage } from '@/pages/Review/ReviewSummaryPage'
import { appTheme } from '@/theme'
import type {
  CompletedReviewResult,
  ReviewSessionState,
  SkippedReviewItem,
  SubmittedReviewAnswer,
} from '@/types/Review/review'

const sessionId = 'session-1'

const firstItem = {
  id: 'item-1',
  userVocabularyId: 'vocabulary-1',
  attemptNumber: 1,
  question: {
    id: 'question-1',
    questionType: 'SELECT_MEANING' as const,
    prompt: 'What does “resilient” mean here?',
    blankSentence: null,
    points: 1,
    displayOrder: 1,
    options: [
      { id: 'option-1', text: 'Able to recover quickly', displayOrder: 1 },
      { id: 'option-2', text: 'Easy to break', displayOrder: 2 },
    ],
  },
}

const secondItem = {
  ...firstItem,
  id: 'item-2',
  userVocabularyId: 'vocabulary-2',
  question: {
    ...firstItem.question,
    id: 'question-2',
    prompt: 'What does “scarce” mean here?',
  },
}

const initialState: ReviewSessionState = {
  session: {
    id: sessionId,
    planSummary: null,
    status: 'IN_PROGRESS',
    startedAt: '2026-08-09T02:00:00.000Z',
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

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
}

const createQueryClient = () => new QueryClient(queryClientConfig)

const queryWrapper = (queryClient: QueryClient) =>
  function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

const renderRoute = (
  initialEntry: InitialEntry,
  routes: Parameters<typeof createMemoryRouter>[0],
) => {
  const queryClient = createQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] })

  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  )

  return { queryClient, router }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Review PR1 state consistency', () => {
  it('patches answer progress and the next question into both review caches', async () => {
    const queryClient = createQueryClient()
    queryClient.setQueryData(reviewQueryKeys.session(sessionId), initialState)
    queryClient.setQueryData(reviewQueryKeys.active(), initialState)
    const transition: SubmittedReviewAnswer = {
      answerId: 'answer-1',
      isCorrect: true,
      correctAnswer: 'Able to recover quickly',
      explanation: 'Resilient means able to recover quickly.',
      earnedPoints: 1,
      inferredReviewScore: 5,
      willReturnLater: false,
      sessionCompleted: false,
      progress: advancedProgress,
      nextQuestion: secondItem,
    }
    vi.spyOn(reviewsApi, 'answer').mockResolvedValue(transition)
    const { result } = renderHook(
      () => useSubmitReviewAnswerMutation(sessionId),
      { wrapper: queryWrapper(queryClient) },
    )

    await act(async () => {
      await result.current.mutateAsync({
        reviewSessionItemId: firstItem.id,
        reviewQuestionId: firstItem.question.id,
        selectedOptionId: 'option-1',
      })
    })

    for (const key of [
      reviewQueryKeys.session(sessionId),
      reviewQueryKeys.active(),
    ]) {
      expect(queryClient.getQueryData<ReviewSessionState>(key)).toMatchObject({
        progress: advancedProgress,
        nextItem: secondItem,
      })
    }
  })

  it('does not let a stale skip transition regress cached progress', async () => {
    const queryClient = createQueryClient()
    const advancedState: ReviewSessionState = {
      ...initialState,
      progress: advancedProgress,
      nextItem: secondItem,
    }
    queryClient.setQueryData(reviewQueryKeys.session(sessionId), advancedState)
    queryClient.setQueryData(reviewQueryKeys.active(), advancedState)
    const staleTransition: SkippedReviewItem = {
      inferredReviewScore: 0,
      sessionCompleted: false,
      progress: initialState.progress,
      nextQuestion: firstItem,
    }
    vi.spyOn(reviewsApi, 'skip').mockResolvedValue(staleTransition)
    const { result } = renderHook(() => useSkipReviewItemMutation(sessionId), {
      wrapper: queryWrapper(queryClient),
    })

    await act(async () => {
      await result.current.mutateAsync({
        reviewSessionItemId: secondItem.id,
        reviewQuestionId: secondItem.question.id,
      })
    })

    expect(
      queryClient.getQueryData<ReviewSessionState>(
        reviewQueryKeys.session(sessionId),
      ),
    ).toMatchObject({ progress: advancedProgress, nextItem: secondItem })
    expect(
      queryClient.getQueryData<ReviewSessionState>(reviewQueryKeys.active()),
    ).toMatchObject({ progress: advancedProgress, nextItem: secondItem })
  })

  it('loads the persisted summary even when navigation metrics are available', async () => {
    let resolveSummary: (summary: CompletedReviewResult) => void = () =>
      undefined
    const summaryPromise = new Promise<CompletedReviewResult>((resolve) => {
      resolveSummary = resolve
    })
    const summarySpy = vi
      .spyOn(reviewsApi, 'summary')
      .mockReturnValue(summaryPromise)
    renderRoute(
      {
        pathname: `/review/${sessionId}/summary`,
        state: {
          result: {
            score: 2,
            totalPoints: 2,
            accuracy: 1,
            correctCount: 2,
            completedAt: '2026-08-09T02:10:00.000Z',
          },
        },
      },
      [
        {
          path: '/review/:sessionId/summary',
          element: <ReviewSummaryPage />,
        },
      ],
    )

    expect(
      await screen.findByText(
        'Showing temporary results while the saved review summary loads…',
      ),
    ).toBeInTheDocument()
    expect(summarySpy).toHaveBeenCalledWith(sessionId)

    resolveSummary({
      result: {
        score: 1,
        totalPoints: 2,
        accuracy: 0.5,
        correctCount: 1,
        completedAt: '2026-08-09T02:10:00.000Z',
      },
      answers: [
        {
          reviewQuestionId: 'question-1',
          questionType: 'SELECT_MEANING',
          prompt: firstItem.question.prompt,
          selectedOption: firstItem.question.options[1],
          userAnswerText: null,
          correctAnswer: 'Able to recover quickly',
          explanation: 'Resilient means able to recover quickly.',
          isCorrect: false,
          points: 1,
          earnedPoints: 0,
          answeredAt: '2026-08-09T02:05:00.000Z',
        },
      ],
    })

    expect(await screen.findByText('Words to revisit')).toBeInTheDocument()
    expect(screen.getByText('Able to recover quickly')).toBeInTheDocument()
    expect(
      screen.queryByText(
        'Showing temporary results while the saved review summary loads…',
      ),
    ).not.toBeInTheDocument()
  })

  it('uses Save and exit without abandoning the resumable session', async () => {
    vi.spyOn(reviewsApi, 'session').mockResolvedValue(initialState)
    const abandonSpy = vi.spyOn(reviewsApi, 'abandon')
    const user = userEvent.setup()
    const { router } = renderRoute(`/review/${sessionId}`, [
      { path: '/review/:sessionId', element: <ReviewPage /> },
      { path: '/', element: <div>Home page</div> },
    ])

    await user.click(await screen.findByRole('link', { name: 'Save and exit' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(abandonSpy).not.toHaveBeenCalled()
  })

  it('requires confirmation before End session abandons it', async () => {
    vi.spyOn(reviewsApi, 'session').mockResolvedValue(initialState)
    const abandonSpy = vi
      .spyOn(reviewsApi, 'abandon')
      .mockResolvedValue({ id: sessionId, status: 'ABANDONED' })
    const user = userEvent.setup()
    const { router } = renderRoute(`/review/${sessionId}`, [
      { path: '/review/:sessionId', element: <ReviewPage /> },
      { path: '/', element: <div>Home page</div> },
    ])

    await user.click(await screen.findByRole('button', { name: 'End session' }))
    const dialog = await screen.findByRole('dialog', {
      name: 'End this review session?',
    })
    expect(abandonSpy).not.toHaveBeenCalled()

    await user.click(
      within(dialog).getByRole('button', { name: 'End session' }),
    )

    await waitFor(() => expect(abandonSpy).toHaveBeenCalledWith(sessionId))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})

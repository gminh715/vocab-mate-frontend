import { ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tutorApi } from '@/api/Tutor/TutorApi'
import { TutorDashboardCard } from '@/components/Tutor/TutorDashboardCard'
import { AuthContext } from '@/contexts/AuthContext'
import i18n from '@/i18n/i18n'
import { TutorHistoryDetailPage } from '@/pages/Tutor/TutorHistoryDetailPage'
import { TutorHistoryPage } from '@/pages/Tutor/TutorHistoryPage'
import { TutorSessionPage } from '@/pages/Tutor/TutorSessionPage'
import { appTheme } from '@/theme'
import type { CurrentUser } from '@/types/Auth/auth'
import type {
  TodayStatusData,
  TutorHistoryData,
  TutorSessionDetailData,
  TutorSessionWithItemData,
} from '@/types/Tutor/tutor'

const mockCurrentUser: CurrentUser = {
  id: 'user-1',
  email: 'learner@example.com',
  role: 'USER',
  status: 'ACTIVE',
  displayName: 'Minh',
  avatarUrl: null,
  currentCefrLevel: 'B1',
  learningGoal: 'C1',
  preferredLanguage: 'vi',
  dailyStudyMinutes: 10,
}

const mockSessionSummary = {
  id: 'session-123',
  userId: 'user-1',
  studyDate: '2026-08-30',
  status: 'ACTIVE' as const,
  targetDurationMinutes: 10,
  targetActivityCount: 13,
  newWordTarget: 3,
  startedAt: '2026-08-30T10:00:00.000Z',
  completedAt: null,
  createdAt: '2026-08-30T10:00:00.000Z',
  updatedAt: '2026-08-30T10:00:00.000Z',
}

const mockPendingItem = {
  id: 'item-1',
  sessionId: 'session-123',
  userVocabularyId: 'vocab-1',
  position: 1,
  status: 'PENDING' as const,
  questionType: 'MULTIPLE_CHOICE' as const,
  isNewWord: true,
  questionPayload: {
    questionPromptVi: 'Chọn nghĩa đúng nhất của từ "ephemeral":',
    wordDisplay: 'ephemeral',
    meaningVi: 'phù du, chóng tàn',
    options: [
      { id: 'A', text: 'Kéo dài vĩnh viễn' },
      { id: 'B', text: 'Chóng tàn, phù du' },
      { id: 'C', text: 'Khổng lồ' },
      { id: 'D', text: 'Bí ẩn' },
    ],
  },
  hintUsed: false,
  generatedAt: '2026-08-30T10:00:00.000Z',
}

const mockAnsweredItem = {
  ...mockPendingItem,
  status: 'ANSWERED' as const,
  userAnswer: 'B',
  isCorrect: true,
  responseTimeMs: 2500,
  fsrsRating: 3,
  feedbackVi: 'Bạn đã chọn đúng đáp án B.',
  correctAnswer: 'B',
  explanationVi: 'Ephemeral có nghĩa là tồn tại trong thời gian rất ngắn.',
  answeredAt: '2026-08-30T10:00:03.000Z',
}

const mockPendingItem2 = {
  id: 'item-2',
  sessionId: 'session-123',
  userVocabularyId: 'vocab-2',
  position: 2,
  status: 'PENDING' as const,
  questionType: 'MULTIPLE_CHOICE' as const,
  isNewWord: false,
  questionPayload: {
    questionPromptVi: 'Chọn nghĩa đúng nhất của từ "ubiquitous":',
    wordDisplay: 'ubiquitous',
    meaningVi: 'phổ biến khắp nơi',
    options: [
      { id: 'A', text: 'Có mặt ở khắp mọi nơi' },
      { id: 'B', text: 'Hiếm khi xảy ra' },
      { id: 'C', text: 'Tạm thời' },
      { id: 'D', text: 'Nguy hiểm' },
    ],
  },
  hintUsed: false,
  generatedAt: '2026-08-30T10:00:05.000Z',
}

const mockAnsweredItem2 = {
  ...mockPendingItem2,
  status: 'ANSWERED' as const,
  userAnswer: 'A',
  isCorrect: true,
  responseTimeMs: 1800,
  fsrsRating: 3,
  feedbackVi: 'Bạn đã chọn đúng đáp án A.',
  correctAnswer: 'A',
  explanationVi: 'Ubiquitous nghĩa là có mặt khắp nơi.',
  answeredAt: '2026-08-30T10:00:08.000Z',
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithProviders = (ui: React.ReactElement, initialEntry = '/') =>
  render(
    <ThemeProvider theme={appTheme}>
      <QueryClientProvider client={createQueryClient()}>
        <AuthContext.Provider
          value={{ currentUser: mockCurrentUser, isInitializing: false }}
        >
          <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>,
  )

describe('Tutor UI Features', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('vi')
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
    vi.restoreAllMocks()
  })

  it('renders TutorDashboardCard with readiness status and due count', async () => {
    const todayStatus: TodayStatusData = {
      canStart: true,
      canResume: false,
      isCompletedToday: false,
      isAbandoned: false,
      dueCount: 8,
      session: null,
    }

    vi.spyOn(tutorApi, 'getTodayStatus').mockResolvedValueOnce(todayStatus)

    renderWithProviders(<TutorDashboardCard />)

    expect(
      await screen.findByText(/Luyện tập từ vựng hôm nay/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/8 từ cần ôn tập/i)).toBeInTheDocument()
    expect(screen.getByText(/Bắt đầu học ngay/i)).toBeInTheDocument()
  })

  it('runs multiple choice question flow with hint and submission feedback', async () => {
    const user = userEvent.setup()

    const sessionWithItem: TutorSessionWithItemData = {
      session: mockSessionSummary,
      currentItem: mockPendingItem,
      summary: null,
    }

    vi.spyOn(tutorApi, 'startOrResumeSession').mockResolvedValueOnce(
      sessionWithItem,
    )
    vi.spyOn(tutorApi, 'getSession').mockResolvedValue(sessionWithItem)

    vi.spyOn(tutorApi, 'submitAnswer').mockResolvedValueOnce({
      item: mockAnsweredItem,
      sessionStatus: 'ACTIVE',
      isSessionCompleted: false,
    })

    renderWithProviders(<TutorSessionPage />, '/tutor/session')

    // 1. Check question rendered
    expect(
      await screen.findByText(/Chọn nghĩa đúng nhất của từ "ephemeral":/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Câu 1 \/ 13/i)).toBeInTheDocument()
    expect(screen.getByText(/Từ mới/i)).toBeInTheDocument()

    // 2. Open hint
    const hintButton = screen.getByRole('button', { name: /Gợi ý/i })
    await user.click(hintButton)
    expect(await screen.findByText(/phù du, chóng tàn/i)).toBeInTheDocument()

    // 3. Select option B
    const optionB = screen.getByRole('radio', { name: /Lựa chọn B/i })
    await user.click(optionB)

    // 4. Submit answer
    const submitBtn = screen.getByRole('button', { name: /Kiểm tra/i })
    await user.click(submitBtn)

    // 5. Verify feedback card
    expect(
      await screen.findByText(/Chính xác! Rất xuất sắc/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Ephemeral có nghĩa là tồn tại trong thời gian rất ngắn/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Câu tiếp theo/i }),
    ).toBeInTheDocument()
  })

  it('advances seamlessly to the next question when clicking next without exiting', async () => {
    const user = userEvent.setup()

    const sessionWithItem1: TutorSessionWithItemData = {
      session: mockSessionSummary,
      currentItem: mockPendingItem,
      summary: null,
    }

    const sessionWithItem2: TutorSessionWithItemData = {
      session: mockSessionSummary,
      currentItem: mockPendingItem2,
      summary: null,
    }

    vi.spyOn(tutorApi, 'startOrResumeSession')
      .mockResolvedValueOnce(sessionWithItem1)
      .mockResolvedValue(sessionWithItem2)
    // First getSession returns item 1, subsequent getSession (triggered by invalidateQueries) returns item 2
    vi.spyOn(tutorApi, 'getSession')
      .mockResolvedValueOnce(sessionWithItem1)
      .mockResolvedValue(sessionWithItem2)

    vi.spyOn(tutorApi, 'submitAnswer')
      .mockResolvedValueOnce({
        item: mockAnsweredItem,
        sessionStatus: 'ACTIVE',
        isSessionCompleted: false,
      })
      .mockResolvedValueOnce({
        item: mockAnsweredItem2,
        sessionStatus: 'ACTIVE',
        isSessionCompleted: false,
      })

    renderWithProviders(<TutorSessionPage />, '/tutor/session')

    // 1. First question is shown
    expect(
      await screen.findByText(/Chọn nghĩa đúng nhất của từ "ephemeral":/i),
    ).toBeInTheDocument()

    // 2. Select option B & submit question 1
    const optionB = screen.getByRole('radio', { name: /Lựa chọn B/i })
    await user.click(optionB)
    const submitBtn = screen.getByRole('button', { name: /Kiểm tra/i })
    await user.click(submitBtn)

    // 3. Feedback card for question 1 is shown
    const nextBtn = await screen.findByRole('button', {
      name: /Câu tiếp theo/i,
    })
    expect(nextBtn).toBeInTheDocument()

    // 4. Click "Câu tiếp theo" -> Advances directly to question 2
    await user.click(nextBtn)

    // 5. Verify question 2 is now shown with fresh, clean state
    expect(
      await screen.findByText(/Chọn nghĩa đúng nhất của từ "ubiquitous":/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Câu 2 \/ 13/i)).toBeInTheDocument()

    // 6. Select option A & submit question 2
    const optionA = screen.getByRole('radio', { name: /Lựa chọn A/i })
    await user.click(optionA)
    const submitBtn2 = screen.getByRole('button', { name: /Kiểm tra/i })
    await user.click(submitBtn2)

    // 7. Feedback card for question 2 is displayed
    expect(
      await screen.findByText(/Ubiquitous nghĩa là có mặt khắp nơi/i),
    ).toBeInTheDocument()
  })

  it('renders session summary view when session completes', async () => {
    const completedSession = {
      ...mockSessionSummary,
      status: 'COMPLETED' as const,
      completedAt: '2026-08-30T10:10:00.000Z',
    }

    const summaryStats = {
      durationSeconds: 320,
      plannedActivities: 13,
      completedActivities: 13,
      correctCount: 11,
      incorrectCount: 2,
      newWordsStudied: 3,
      reviewWordsStudied: 10,
      ratingDistribution: { again: 2, hard: 1, good: 8, easy: 2 },
      relearningWords: ['ephemeral', 'ubiquitous'],
      nextDueCount: 5,
    }

    vi.spyOn(tutorApi, 'startOrResumeSession').mockResolvedValueOnce({
      session: completedSession,
      currentItem: null,
      summary: summaryStats,
    })

    renderWithProviders(<TutorSessionPage />, '/tutor/session')

    expect(
      await screen.findByText(/Chúc mừng! Bạn đã hoàn thành phiên học/i),
    ).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument() // 11/13 ~ 85%
    expect(screen.getByText('5m 20s')).toBeInTheDocument()
    expect(screen.getByText('ephemeral')).toBeInTheDocument()
    expect(screen.getByText('ubiquitous')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Về trang chủ/i }),
    ).toBeInTheDocument()
  })

  it('renders history list and navigates to session details', async () => {
    const historyData: TutorHistoryData = {
      items: [
        {
          id: 'session-123',
          userId: 'user-1',
          studyDate: '2026-08-30',
          status: 'COMPLETED',
          targetDurationMinutes: 10,
          targetActivityCount: 13,
          newWordTarget: 3,
          startedAt: '2026-08-30T10:00:00.000Z',
          completedAt: '2026-08-30T10:10:00.000Z',
          createdAt: '2026-08-30T10:00:00.000Z',
          updatedAt: '2026-08-30T10:10:00.000Z',
        },
      ],
      nextCursor: null,
      hasMore: false,
    }

    vi.spyOn(tutorApi, 'getHistory').mockResolvedValueOnce(historyData)

    renderWithProviders(<TutorHistoryPage />, '/tutor/history')

    expect(
      await screen.findByText(/Ngày 2026-08-30/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/13 hoạt động/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Xem chi tiết/i }),
    ).toBeInTheDocument()
  })

  it('renders history detail page with question items and explanations', async () => {
    const detailData: TutorSessionDetailData = {
      session: {
        ...mockSessionSummary,
        status: 'COMPLETED',
      },
      items: [mockAnsweredItem],
      summary: {
        durationSeconds: 180,
        plannedActivities: 13,
        completedActivities: 1,
        correctCount: 1,
        incorrectCount: 0,
        newWordsStudied: 1,
        reviewWordsStudied: 0,
        ratingDistribution: { again: 0, hard: 0, good: 1, easy: 0 },
        relearningWords: [],
        nextDueCount: 0,
      },
    }

    vi.spyOn(tutorApi, 'getSessionDetail').mockResolvedValueOnce(detailData)

    renderWithProviders(
      <Routes>
        <Route
          path="/tutor/history/:sessionId"
          element={<TutorHistoryDetailPage />}
        />
      </Routes>,
      '/tutor/history/session-123',
    )

    expect(
      await screen.findByText(/Chi tiết phiên học/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Hoạt động 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Trắc nghiệm/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Ephemeral có nghĩa là tồn tại trong thời gian rất ngắn/i),
    ).toBeInTheDocument()
  })
})

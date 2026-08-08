import "@testing-library/jest-dom/vitest";
import { ThemeProvider } from "@mui/material/styles";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CompletedReviewResult,
  ReviewAgentFeedback,
  ReviewSessionItem,
  ReviewSessionState,
  SubmittedReviewAnswer,
} from "@/types/Review/review";

const {
  queryState,
  mutationState,
  startSession,
  startReset,
  activeQueryHook,
  submitAnswer,
  skipItem,
  abandonSession,
  abandonReset,
  summaryQueryHook,
} = vi.hoisted(() => ({
  queryState: {
    data: undefined as ReviewSessionState | undefined,
    isPending: false,
    isError: false,
    error: null as unknown,
    refetch: vi.fn(),
    summary: {
      data: undefined as CompletedReviewResult | undefined,
      isPending: false,
      isError: false,
      error: null as unknown,
      refetch: vi.fn(),
    },
    active: {
      data: undefined as ReviewSessionState | undefined,
      isPending: false,
      isError: false,
      error: null as unknown,
    },
  },
  mutationState: { answerPending: false, startPending: false },
  startSession: vi.fn(),
  startReset: vi.fn(),
  activeQueryHook: vi.fn(),
  submitAnswer: vi.fn(),
  skipItem: vi.fn(),
  abandonSession: vi.fn(),
  abandonReset: vi.fn(),
  summaryQueryHook: vi.fn(),
}));

vi.mock("@/hooks/Review/useReviews", () => ({
  useActiveReviewSessionQuery: (refetchInterval: number | false) => {
    activeQueryHook(refetchInterval)
    return queryState.active
  },
  useReviewSessionQuery: () => queryState,
  useSubmitReviewAnswerMutation: () => ({
    mutateAsync: submitAnswer,
    isPending: mutationState.answerPending,
  }),
  useSkipReviewItemMutation: () => ({
    mutateAsync: skipItem,
    isPending: false,
  }),
  useAbandonReviewSessionMutation: () => ({
    mutateAsync: abandonSession,
    reset: abandonReset,
    isPending: false,
  }),
  useReviewSummaryQuery: (sessionId: string) => {
    summaryQueryHook(sessionId)
    return queryState.summary
  },
  useStartReviewSessionMutation: () => ({
    mutate: startSession,
    reset: startReset,
    isPending: mutationState.startPending,
    isError: false,
    error: null,
  }),
}));

import { ReviewPage } from "@/pages/Review/ReviewPage";
import { ReviewSummaryPage } from "@/pages/Review/ReviewSummaryPage";
import { ApiError } from "@/config/apiClient";
import { appTheme } from "@/theme";

const firstItem: ReviewSessionItem = {
  id: "item-1",
  userVocabularyId: "vocabulary-1",
  attemptNumber: 1,
  question: {
    id: "question-1",
    questionType: "SELECT_MEANING",
    prompt: "Choose the saved meaning of “impact”.",
    blankSentence: null,
    points: 1,
    displayOrder: 1,
    options: [
      { id: "option-1", text: "tác động", displayOrder: 1 },
      { id: "option-2", text: "trang trí", displayOrder: 2 },
    ],
  },
};

const retryItem: ReviewSessionItem = {
  id: "item-1",
  userVocabularyId: "vocabulary-1",
  attemptNumber: 2,
  question: {
    id: "question-2",
    questionType: "FILL_BLANK",
    prompt: "Complete the original sentence.",
    blankSentence: "The policy had a lasting ___.",
    points: 1,
    displayOrder: 1,
    options: [],
  },
};

const sessionState = (
  nextItem: ReviewSessionItem = firstItem,
): ReviewSessionState => ({
  session: {
    id: "session-1",
    sessionType: "DAILY_REVIEW",
    quizId: null,
    articleId: null,
    collectionId: null,
    planSummary: 'Review recall first, then reinforce meaning in context.',
    status: "IN_PROGRESS",
    startedAt: "2026-08-03T01:00:00.000Z",
    completedAt: null,
  },
  progress: {
    answeredCount: 0,
    totalQuestions: 2,
    remainingCount: 2,
    progressPercent: 0,
  },
  nextItem,
});

const coachingFeedback: ReviewAgentFeedback = {
  source: "AI",
  action: "TEACH_AND_REQUEUE",
  skillDimension: "CONTEXT",
  errorType: "CONFUSABLE_WORD",
  microLesson: {
    title: "Impact means a strong effect",
    explanation:
      "Use impact when one event produces a noticeable change in another.",
    example: "The new policy had a lasting impact on local schools.",
  },
  retestAfterItems: 3,
};

const incorrectResponse: SubmittedReviewAnswer = {
  answerId: "answer-1",
  isCorrect: false,
  correctAnswer: "tác động",
  explanation: "This meaning fits how the word was used in the saved sentence.",
  earnedPoints: 0,
  inferredReviewScore: 0,
  willReturnLater: true,
  sessionCompleted: false,
  progress: {
    answeredCount: 1,
    totalQuestions: 2,
    remainingCount: 1,
    progressPercent: 50,
  },
  nextQuestion: retryItem,
  agentFeedback: coachingFeedback,
};

const renderReview = () =>
  render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={["/review/session-1"]}>
        <Routes>
          <Route path="/review/:sessionId" element={<ReviewPage />} />
          <Route
            path="/review/:sessionId/summary"
            element={<h1>Session Summary</h1>}
          />
          <Route path="/" element={<h1>Home</h1>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );

const expectNoSelfRatingControls = () => {
  for (const label of ["Again", "Hard", "Good", "Easy"]) {
    expect(
      screen.queryByRole("button", { name: label }),
    ).not.toBeInTheDocument();
  }
};

describe("ReviewPage", () => {
  beforeEach(() => {
    queryState.data = sessionState();
    queryState.isPending = false;
    queryState.isError = false;
    queryState.error = null;
    mutationState.answerPending = false;
    mutationState.startPending = false;
    startSession.mockReset();
    startReset.mockReset();
    activeQueryHook.mockReset();
    queryState.active.data = undefined;
    queryState.active.isPending = false;
    queryState.active.isError = false;
    queryState.active.error = null;
    submitAnswer.mockReset();
    skipItem.mockReset();
    abandonSession.mockReset();
    abandonReset.mockReset();
    summaryQueryHook.mockReset();
    queryState.refetch.mockReset();
    queryState.summary.data = undefined;
    queryState.summary.isPending = false;
    queryState.summary.isError = false;
    queryState.summary.error = null;
    queryState.summary.refetch.mockReset();
  });

  it("recovers a session persisted while the first start request is still pending", async () => {
    mutationState.startPending = true;
    const { rerender } = renderReviewStarter();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Preparing your review…",
    );
    expect(activeQueryHook).toHaveBeenCalledWith(1_000);

    queryState.active.data = sessionState();
    rerender();

    expect(
      await screen.findByRole("heading", { name: "A Focused Practice Set" }),
    ).toBeInTheDocument();
  });

  it("renders the current session plan before the question", () => {
    renderReview();

    expect(
      screen.getByRole("heading", { name: "A Focused Practice Set" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Review recall first, then reinforce meaning in context.",
      ),
    ).toBeInTheDocument();
  });

  it("uses a localized fallback plan for a legacy session", () => {
    queryState.data = {
      ...sessionState(),
      session: { ...sessionState().session, planSummary: null },
    };
    renderReview();

    expect(
      screen.getByText(
        "Daily review · 2 questions selected from your saved vocabulary.",
      ),
    ).toBeInTheDocument();
  });

  it("restores the server-provided active item and reveals progressive hints", () => {
    renderReview();

    expect(
      screen.getByRole("heading", {
        name: "Choose the saved meaning of “impact”.",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    expect(screen.getByText(/original sentence/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Another Hint" }));
    expect(screen.getByText(/most specific meaning/i)).toBeInTheDocument();
  });

  it("shows corrective feedback and advances using the next item in the answer response", async () => {
    submitAnswer.mockResolvedValue(incorrectResponse);
    renderReview();

    fireEvent.click(screen.getByRole("button", { name: "trang trí" }));
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(
      await screen.findByText("Correct answer: tác động"),
    ).toBeInTheDocument();
    expect(screen.getByText("Impact means a strong effect")).toBeInTheDocument();
    expect(screen.getByText(/return after 3 more questions/i)).toBeInTheDocument();
    expect(screen.getByText("Focus: Meaning in context")).toBeInTheDocument();
    expect(
      screen.getByText("Pattern: A similar word caused confusion"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/inferred|again, hard|easy/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("AI", { exact: true })).not.toBeInTheDocument();
    expect(screen.queryByText("RULE", { exact: true })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Complete the original sentence." }),
    ).toBeInTheDocument();
    expect(queryState.refetch).not.toHaveBeenCalled();
  });

  it("never asks the learner to self-rate during the end-to-end review interaction", async () => {
    submitAnswer.mockResolvedValue(incorrectResponse);
    renderReview();

    expectNoSelfRatingControls();
    fireEvent.click(screen.getByRole("button", { name: /trang/i }));
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(
      await screen.findByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
    expectNoSelfRatingControls();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      screen.getByRole("heading", { name: "Complete the original sentence." }),
    ).toBeInTheDocument();
    expectNoSelfRatingControls();
  });

  it("briefly confirms a correct answer and advances automatically", async () => {
    submitAnswer.mockResolvedValue({
      ...incorrectResponse,
      isCorrect: true,
      earnedPoints: 1,
      inferredReviewScore: 4,
      willReturnLater: false,
      agentFeedback: undefined,
    });
    renderReview();

    fireEvent.click(screen.getByRole("button", { name: "tác động" }));
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(await screen.findByText("Nice work.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole(
        "heading",
        { name: "Complete the original sentence." },
        { timeout: 1_500 },
      ),
    ).toBeInTheDocument();
  });

  it("does not leave an abandoned session in an endless restore state", () => {
    queryState.data = {
      ...sessionState(),
      session: { ...sessionState().session, status: "ABANDONED" },
      nextItem: undefined,
    };

    renderReview();

    expect(
      screen.getByText("This review session has ended and cannot be resumed."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back Home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByText("Restoring your reviewâ€¦")).not.toBeInTheDocument();
  });

  it("restores persisted coaching with an accessible announcement", () => {
    queryState.data = {
      ...sessionState(),
      agentFeedback: coachingFeedback,
    };
    renderReview();

    const announcement = screen.getByRole("status", {
      name: "What to Notice",
    });
    expect(announcement).toHaveTextContent("Impact means a strong effect");
    expect(announcement).toHaveAttribute("aria-live", "polite");
    expect(screen.queryByText("AI", { exact: true })).not.toBeInTheDocument();
  });

  it("moves focus to each new question heading", async () => {
    submitAnswer.mockResolvedValue(incorrectResponse);
    renderReview();

    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: /Choose the saved meaning/i,
        }),
      ).toHaveFocus(),
    );
    fireEvent.click(screen.getByRole("button", { name: /trang/i }));
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Complete the original sentence." }),
      ).toHaveFocus(),
    );
  });

  it("supports keyboard selection for answer choices", async () => {
    const user = userEvent.setup();
    renderReview();
    const option = screen.getByRole("button", { name: /trang/i });

    option.focus();
    await user.keyboard("{Enter}");

    expect(option).toHaveAttribute("aria-pressed", "true");
  });

  it("wraps long coaching text on a mobile-width viewport", () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 360,
    });
    queryState.data = {
      ...sessionState(),
      agentFeedback: {
        ...coachingFeedback,
        microLesson: {
          ...coachingFeedback.microLesson,
          explanation:
            "AnExceptionallyLongGeneratedExplanationWithoutNaturalBreaksStillNeedsToRemainInsideTheMobileLearningCard",
        },
      },
    };
    renderReview();

    const explanation = screen.getByText(/AnExceptionallyLongGenerated/);
    expect(window.getComputedStyle(explanation).overflowWrap).toBe("anywhere");
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalWidth,
    });
  });

  it("offers recovery when optional coaching exceeds its wait limit", async () => {
    vi.useFakeTimers();
    try {
      mutationState.answerPending = true;
      renderReview();
      expect(screen.getByText(/answer is saved first/i)).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000);
      });

      expect(
        screen.getByRole("button", { name: "Continue from Saved Progress" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Save and exit" }),
      ).toHaveAttribute("href", "/");
    } finally {
      vi.useRealTimers();
    }
  });

  it("submits fill-in text and hint count without a client attempt number", async () => {
    queryState.data = sessionState(retryItem);
    submitAnswer.mockResolvedValue(incorrectResponse);
    renderReview();

    fireEvent.click(screen.getByRole("button", { name: "Hint" }));
    fireEvent.change(screen.getByLabelText("Your answer"), {
      target: { value: "impact" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));

    await waitFor(() => expect(submitAnswer).toHaveBeenCalledTimes(1));
    expect(submitAnswer.mock.calls[0]?.[0]).toMatchObject({
      reviewSessionItemId: "item-1",
      quizQuestionId: "question-2",
      userAnswerText: "impact",
      hintsUsed: 1,
    });
    expect(submitAnswer.mock.calls[0]?.[0]).not.toHaveProperty("attemptNumber");
    expect(submitAnswer.mock.calls[0]?.[0]).not.toHaveProperty(
      "selectedOptionId",
    );
  });

  it("prevents a rapid double submission", () => {
    submitAnswer.mockReturnValue(new Promise(() => undefined));
    renderReview();

    fireEvent.click(screen.getByRole("button", { name: "tác động" }));
    const submit = screen.getByRole("button", { name: "Check Answer" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    expect(submitAnswer).toHaveBeenCalledTimes(1);
  });

  it("skips through the response-provided next item", async () => {
    skipItem.mockResolvedValue({
      inferredReviewScore: 0,
      sessionCompleted: false,
      progress: incorrectResponse.progress,
      nextQuestion: retryItem,
    });
    renderReview();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(
      await screen.findByRole("heading", {
        name: "Complete the original sentence.",
      }),
    ).toBeInTheDocument();
    expect(skipItem).toHaveBeenCalledWith({
      reviewSessionItemId: "item-1",
      quizQuestionId: "question-1",
    });
  });

  it("saves an in-progress session for resume without abandoning it", () => {
    renderReview();

    fireEvent.click(screen.getByRole("link", { name: "Save and exit" }));

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(abandonSession).not.toHaveBeenCalled();
  });

  it("confirms before ending and abandons the session", async () => {
    abandonSession.mockResolvedValue({ id: "session-1", status: "ABANDONED" });
    renderReview();

    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    expect(
      screen.getByRole("dialog", { name: "End this review session?" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Save and exit instead/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "End session" }),
    );

    await waitFor(() => expect(abandonSession).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("refetches after a stale conflict and offers the latest question", async () => {
    submitAnswer.mockRejectedValue(
      new ApiError({
        status: 409,
        code: "CONFLICT",
        message: "Stale item",
      }),
    );
    queryState.refetch.mockImplementation(async () => {
      queryState.data = sessionState(retryItem);
      return { data: queryState.data };
    });
    renderReview();

    fireEvent.click(screen.getByRole("button", { name: /tác động/i }));
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(
      await screen.findByRole("button", { name: "Use latest question" }),
    ).toBeInTheDocument();
    expect(queryState.refetch).toHaveBeenCalledTimes(1);
    fireEvent.click(
      screen.getByRole("button", { name: "Use latest question" }),
    );
    expect(
      screen.getByRole("heading", { name: "Complete the original sentence." }),
    ).toBeInTheDocument();
  });

  it("does not offer stale cached question data when conflict recovery refetch fails", async () => {
    submitAnswer.mockRejectedValue(
      new ApiError({
        status: 409,
        code: "CONFLICT",
        message: "Stale item",
      }),
    );
    queryState.refetch.mockResolvedValue({
      data: queryState.data,
      isError: true,
    });
    renderReview();

    fireEvent.click(screen.getByRole("button", { name: /trang/i }));
    fireEvent.click(screen.getByRole("button", { name: "Check Answer" }));

    expect(
      await screen.findByRole("button", { name: "Refresh" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Use latest question" }),
    ).not.toBeInTheDocument();
  });
});

const persistedSummary: CompletedReviewResult = {
  result: {
    score: 1,
    totalPoints: 2,
    accuracy: 0.5,
    correctCount: 1,
    completedAt: "2026-08-03T02:00:00.000Z",
  },
  answers: [
    {
      quizQuestionId: "question-1",
      questionType: "SELECT_MEANING",
      prompt: "Choose the saved meaning.",
      selectedOption: null,
      userAnswerText: null,
      correctAnswer: "tÃ¡c Ä‘á»™ng",
      explanation: "The saved contextual meaning.",
      isCorrect: false,
      points: 1,
      earnedPoints: 0,
      answeredAt: "2026-08-03T01:30:00.000Z",
    },
  ],
};

const renderSummary = (state?: unknown) =>
  render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter
        initialEntries={[{ pathname: "/review/session-1/summary", state }]}
      >
        <Routes>
          <Route
            path="/review/:sessionId/summary"
            element={<ReviewSummaryPage />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );

const renderReviewStarter = () => {
  const element = () => (
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={["/review"]}>
        <Routes>
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/review/:sessionId" element={<ReviewPage />} />
          <Route path="/" element={<h1>Home</h1>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
  const view = render(element());

  return { rerender: () => view.rerender(element()) };
};

describe("ReviewSummaryPage", () => {
  beforeEach(() => {
    summaryQueryHook.mockReset();
    queryState.summary.data = undefined;
    queryState.summary.isPending = false;
    queryState.summary.isError = false;
    queryState.summary.error = null;
    queryState.summary.refetch.mockReset();
  });

  it("always requests persisted summary and prefers it over navigation state", () => {
    queryState.summary.data = persistedSummary;
    renderSummary({
      result: {
        ...persistedSummary.result,
        accuracy: 1,
        correctCount: 2,
      },
    });

    expect(summaryQueryHook).toHaveBeenCalledWith("session-1");
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Words to revisit")).toBeInTheDocument();
  });

  it("uses navigation state only as a loading placeholder", () => {
    queryState.summary.isPending = true;
    renderSummary({ result: persistedSummary.result });

    expect(summaryQueryHook).toHaveBeenCalledWith("session-1");
    expect(screen.getByRole("status")).toHaveTextContent(/temporary results/i);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});

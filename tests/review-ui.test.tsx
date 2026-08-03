import "@testing-library/jest-dom/vitest";
import { ThemeProvider } from "@mui/material/styles";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ReviewSessionItem,
  ReviewSessionState,
  SubmittedReviewAnswer,
} from "@/types/Review/review";

const { queryState, submitAnswer, skipItem } = vi.hoisted(() => ({
  queryState: {
    data: undefined as ReviewSessionState | undefined,
    isPending: false,
    isError: false,
    error: null as unknown,
    refetch: vi.fn(),
  },
  submitAnswer: vi.fn(),
  skipItem: vi.fn(),
}));

vi.mock("@/hooks/Review/useReviews", () => ({
  useReviewSessionQuery: () => queryState,
  useSubmitReviewAnswerMutation: () => ({
    mutateAsync: submitAnswer,
    isPending: false,
  }),
  useSkipReviewItemMutation: () => ({
    mutateAsync: skipItem,
    isPending: false,
  }),
  useStartReviewSessionMutation: () => ({
    mutate: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

import { ReviewPage } from "@/pages/Review/ReviewPage";
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
    submitAnswer.mockReset();
    skipItem.mockReset();
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
    expect(screen.getByText(/again near the end/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/inferred|again, hard|easy/i),
    ).not.toBeInTheDocument();

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
});

import { apiClient } from '@/config/apiClient'
import type {
  AdminQuizDetailData,
  AdminQuizListData,
  AdminQuizListParams,
  CreateQuizRequest,
  OptionMutationData,
  QuestionMutationData,
  QuestionDetailData,
  QuestionOptionRequest,
  QuizMutationData,
  QuizPublishData,
  QuizQuestionRequest,
  QuizStatusTransitionData,
  UpdateQuestionOptionRequest,
  UpdateQuizQuestionRequest,
  UpdateQuizRequest,
} from '@/types/Admin/adminQuizzes'

const quizzesPath = '/admin/quizzes'
const quizPath = (quizId: string) =>
  `${quizzesPath}/${encodeURIComponent(quizId)}`
const questionPath = (quizId: string, questionId?: string) =>
  `${quizPath(quizId)}/questions${
    questionId ? `/${encodeURIComponent(questionId)}` : ''
  }`
const optionPath = (
  quizId: string,
  questionId: string,
  optionId?: string,
) =>
  `${questionPath(quizId, questionId)}/options${
    optionId ? `/${encodeURIComponent(optionId)}` : ''
  }`

export const quizListRequestParams = (params: AdminQuizListParams) => ({
  page: params.page,
  limit: params.limit,
  ...(params.q ? { q: params.q } : {}),
  ...(params.articleId ? { articleId: params.articleId } : {}),
  ...(params.status ? { status: params.status } : {}),
})

export const adminQuizzesApi = {
  list: (params: AdminQuizListParams): Promise<AdminQuizListData> =>
    apiClient.get<AdminQuizListData>(quizzesPath, {
      params: quizListRequestParams(params),
    }),
  detail: (quizId: string): Promise<AdminQuizDetailData> =>
    apiClient.get<AdminQuizDetailData>(quizPath(quizId)),
  create: (request: CreateQuizRequest): Promise<QuizMutationData> =>
    apiClient.post<QuizMutationData>(quizzesPath, request),
  update: (
    quizId: string,
    request: UpdateQuizRequest,
  ): Promise<QuizMutationData> =>
    apiClient.patch<QuizMutationData>(quizPath(quizId), request),
  delete: (quizId: string): Promise<void> =>
    apiClient.deleteNoContent(quizPath(quizId)),
  createQuestion: (
    quizId: string,
    request: QuizQuestionRequest,
  ): Promise<QuestionMutationData> =>
    apiClient.post<QuestionMutationData>(questionPath(quizId), request),
  questionDetail: (
    quizId: string,
    questionId: string,
  ): Promise<QuestionDetailData> =>
    apiClient.get<QuestionDetailData>(questionPath(quizId, questionId)),
  updateQuestion: (
    quizId: string,
    questionId: string,
    request: UpdateQuizQuestionRequest,
  ): Promise<QuestionMutationData> =>
    apiClient.patch<QuestionMutationData>(
      questionPath(quizId, questionId),
      request,
    ),
  deleteQuestion: (quizId: string, questionId: string): Promise<void> =>
    apiClient.deleteNoContent(questionPath(quizId, questionId)),
  createOption: (
    quizId: string,
    questionId: string,
    request: QuestionOptionRequest,
  ): Promise<OptionMutationData> =>
    apiClient.post<OptionMutationData>(
      optionPath(quizId, questionId),
      request,
    ),
  updateOption: (
    quizId: string,
    questionId: string,
    optionId: string,
    request: UpdateQuestionOptionRequest,
  ): Promise<OptionMutationData> =>
    apiClient.patch<OptionMutationData>(
      optionPath(quizId, questionId, optionId),
      request,
    ),
  deleteOption: (
    quizId: string,
    questionId: string,
    optionId: string,
  ): Promise<void> =>
    apiClient.deleteNoContent(optionPath(quizId, questionId, optionId)),
  publish: (quizId: string): Promise<QuizPublishData> =>
    apiClient.post<QuizPublishData>(`${quizPath(quizId)}/publish`),
  archive: (quizId: string): Promise<QuizStatusTransitionData> =>
    apiClient.post<QuizStatusTransitionData>(
      `${quizPath(quizId)}/archive`,
    ),
  restoreDraft: (quizId: string): Promise<QuizStatusTransitionData> =>
    apiClient.post<QuizStatusTransitionData>(
      `${quizPath(quizId)}/restore-draft`,
    ),
}

import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { adminQuizzesApi } from '@/api/Admin/AdminQuizzesApi'
import type {
  AdminQuizListParams,
  CreateQuizRequest,
  QuestionOptionRequest,
  QuizQuestionRequest,
  UpdateQuestionOptionRequest,
  UpdateQuizQuestionRequest,
  UpdateQuizRequest,
} from '@/types/Admin/adminQuizzes'

// Answer-bearing admin records intentionally never share public quiz keys.
export const adminQuizQueryKeys = {
  all: ['/adminQuizzes'] as const,
  lists: () => [...adminQuizQueryKeys.all, 'list'] as const,
  list: (params: AdminQuizListParams) =>
    [...adminQuizQueryKeys.lists(), params] as const,
  details: () => [...adminQuizQueryKeys.all, 'detail-with-answer-key'] as const,
  detail: (quizId: string) =>
    [...adminQuizQueryKeys.details(), quizId] as const,
}

export const useAdminQuizListQuery = (params: AdminQuizListParams) =>
  useQuery({
    queryKey: adminQuizQueryKeys.list(params),
    queryFn: () => adminQuizzesApi.list(params),
    placeholderData: keepPreviousData,
    retry: false,
  })

export const adminQuizDetailQueryOptions = (quizId: string) =>
  queryOptions({
    queryKey: adminQuizQueryKeys.detail(quizId),
    queryFn: () => adminQuizzesApi.detail(quizId),
    enabled: Boolean(quizId),
    retry: false,
  })

export const useAdminQuizDetailQuery = (quizId: string) =>
  useQuery(adminQuizDetailQueryOptions(quizId))

const useQuizInvalidation = (quizId?: string) => {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: adminQuizQueryKeys.lists() })
    if (quizId) {
      void queryClient.invalidateQueries({
        queryKey: adminQuizQueryKeys.detail(quizId),
      })
    }
  }
}

export const useCreateAdminQuizMutation = () => {
  const invalidate = useQuizInvalidation()
  return useMutation({
    mutationFn: (request: CreateQuizRequest) =>
      adminQuizzesApi.create(request),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useUpdateAdminQuizMutation = (quizId: string) => {
  const invalidate = useQuizInvalidation(quizId)
  return useMutation({
    mutationFn: (request: UpdateQuizRequest) =>
      adminQuizzesApi.update(quizId, request),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useDeleteAdminQuizMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminQuizzesApi.delete,
    onSuccess: (_, quizId) => {
      queryClient.removeQueries({ queryKey: adminQuizQueryKeys.detail(quizId) })
      void queryClient.invalidateQueries({ queryKey: adminQuizQueryKeys.lists() })
    },
    retry: false,
  })
}

export const useCreateQuizQuestionMutation = (quizId: string) => {
  const invalidate = useQuizInvalidation(quizId)
  return useMutation({
    mutationFn: (request: QuizQuestionRequest) =>
      adminQuizzesApi.createQuestion(quizId, request),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useUpdateQuizQuestionMutation = (
  quizId: string,
  questionId: string,
) => {
  const invalidate = useQuizInvalidation(quizId)
  return useMutation({
    mutationFn: (request: UpdateQuizQuestionRequest) =>
      adminQuizzesApi.updateQuestion(quizId, questionId, request),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useDeleteQuizQuestionMutation = (quizId: string) => {
  const invalidate = useQuizInvalidation(quizId)
  return useMutation({
    mutationFn: (questionId: string) =>
      adminQuizzesApi.deleteQuestion(quizId, questionId),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useCreateQuestionOptionMutation = (
  quizId: string,
  questionId: string,
) => {
  const invalidate = useQuizInvalidation(quizId)
  return useMutation({
    mutationFn: (request: QuestionOptionRequest) =>
      adminQuizzesApi.createOption(quizId, questionId, request),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useUpdateQuestionOptionMutation = (
  quizId: string,
  questionId: string,
  optionId: string,
) => {
  const invalidate = useQuizInvalidation(quizId)
  return useMutation({
    mutationFn: (request: UpdateQuestionOptionRequest) =>
      adminQuizzesApi.updateOption(quizId, questionId, optionId, request),
    onSuccess: invalidate,
    retry: false,
  })
}

export const useDeleteQuestionOptionMutation = (
  quizId: string,
  questionId: string,
) => {
  const invalidate = useQuizInvalidation(quizId)
  return useMutation({
    mutationFn: (optionId: string) =>
      adminQuizzesApi.deleteOption(quizId, questionId, optionId),
    onSuccess: invalidate,
    retry: false,
  })
}

const useLifecycleMutation = (
  quizId: string,
  action: 'publish' | 'archive' | 'restoreDraft',
) => {
  const invalidate = useQuizInvalidation(quizId)
  return useMutation({
    mutationFn: () => adminQuizzesApi[action](quizId),
    onSuccess: invalidate,
    retry: false,
  })
}

export const usePublishAdminQuizMutation = (quizId: string) =>
  useLifecycleMutation(quizId, 'publish')
export const useArchiveAdminQuizMutation = (quizId: string) =>
  useLifecycleMutation(quizId, 'archive')
export const useRestoreAdminQuizMutation = (quizId: string) =>
  useLifecycleMutation(quizId, 'restoreDraft')

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tutorApi } from '@/api/Tutor/TutorApi'
import type {
  SubmitAnswerRequest,
  TutorHistoryQuery,
} from '@/types/Tutor/tutor'

export const tutorQueryKeys = {
  all: ['tutor'] as const,
  todayStatus: () => [...tutorQueryKeys.all, 'today'] as const,
  activeSession: () => [...tutorQueryKeys.all, 'activeSession'] as const,
  sessions: () => [...tutorQueryKeys.all, 'session'] as const,
  session: (sessionId: string) =>
    [...tutorQueryKeys.sessions(), sessionId] as const,
  sessionDetails: () => [...tutorQueryKeys.all, 'sessionDetail'] as const,
  sessionDetail: (sessionId: string) =>
    [...tutorQueryKeys.sessionDetails(), sessionId] as const,
  histories: () => [...tutorQueryKeys.all, 'history'] as const,
  history: (query?: TutorHistoryQuery) =>
    [...tutorQueryKeys.histories(), query] as const,
}

export const useTodayStatusQuery = (enabled = true) =>
  useQuery({
    queryKey: tutorQueryKeys.todayStatus(),
    queryFn: () => tutorApi.getTodayStatus(),
    enabled,
  })

export const useActiveTutorSessionQuery = (enabled = true) =>
  useQuery({
    queryKey: tutorQueryKeys.activeSession(),
    queryFn: () => tutorApi.startOrResumeSession(),
    enabled,
    staleTime: 0,
  })

export const useTutorSessionQuery = (sessionId: string, enabled = true) =>
  useQuery({
    queryKey: tutorQueryKeys.session(sessionId),
    queryFn: () => tutorApi.getSession(sessionId),
    enabled: Boolean(sessionId) && enabled,
  })

export const useTutorSessionDetailQuery = (
  sessionId: string,
  enabled = true,
) =>
  useQuery({
    queryKey: tutorQueryKeys.sessionDetail(sessionId),
    queryFn: () => tutorApi.getSessionDetail(sessionId),
    enabled: Boolean(sessionId) && enabled,
  })

export const useTutorHistoryQuery = (
  query?: TutorHistoryQuery,
  enabled = true,
) =>
  useQuery({
    queryKey: tutorQueryKeys.history(query),
    queryFn: () => tutorApi.getHistory(query),
    enabled,
  })

export const useStartOrResumeSessionMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => tutorApi.startOrResumeSession(),
    onSuccess: (data) => {
      queryClient.setQueryData(tutorQueryKeys.activeSession(), data)
      queryClient.setQueryData(tutorQueryKeys.session(data.session.id), data)
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.todayStatus(),
      })
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.activeSession(),
      })
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.session(data.session.id),
      })
    },
    retry: false,
  })
}

export const useSubmitAnswerMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      itemId,
      request,
    }: {
      sessionId: string
      itemId: string
      request: SubmitAnswerRequest
    }) => tutorApi.submitAnswer(sessionId, itemId, request),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.todayStatus(),
      })
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.sessionDetail(variables.sessionId),
      })
    },
    retry: false,
  })
}

export const useAbandonSessionMutation = (sessionId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => tutorApi.abandonSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.todayStatus(),
      })
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.activeSession(),
      })
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.session(sessionId),
      })
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.sessionDetail(sessionId),
      })
    },
    retry: false,
  })
}

import { apiClient } from '@/config/apiClient'
import type {
  SubmitAnswerRequest,
  SubmitAnswerResponseData,
  TodayStatusData,
  TutorHistoryData,
  TutorHistoryQuery,
  TutorSessionDetailData,
  TutorSessionWithItemData,
} from '@/types/Tutor/tutor'

const tutorSessionsPath = '/tutor-sessions'

export const tutorApi = {
  getTodayStatus: (): Promise<TodayStatusData> =>
    apiClient.get<TodayStatusData>(`${tutorSessionsPath}/today`),

  startOrResumeSession: (): Promise<TutorSessionWithItemData> =>
    apiClient.post<TutorSessionWithItemData>(tutorSessionsPath),

  getSession: (sessionId: string): Promise<TutorSessionWithItemData> =>
    apiClient.get<TutorSessionWithItemData>(
      `${tutorSessionsPath}/${encodeURIComponent(sessionId)}`,
    ),

  getSessionDetail: (sessionId: string): Promise<TutorSessionDetailData> =>
    apiClient.get<TutorSessionDetailData>(
      `${tutorSessionsPath}/${encodeURIComponent(sessionId)}/detail`,
    ),

  submitAnswer: (
    sessionId: string,
    itemId: string,
    request: SubmitAnswerRequest,
  ): Promise<SubmitAnswerResponseData> =>
    apiClient.post<SubmitAnswerResponseData>(
      `${tutorSessionsPath}/${encodeURIComponent(
        sessionId,
      )}/items/${encodeURIComponent(itemId)}/answers`,
      request,
    ),

  abandonSession: (sessionId: string): Promise<TutorSessionWithItemData> =>
    apiClient.post<TutorSessionWithItemData>(
      `${tutorSessionsPath}/${encodeURIComponent(sessionId)}/abandon`,
    ),

  getHistory: (query?: TutorHistoryQuery): Promise<TutorHistoryData> =>
    apiClient.get<TutorHistoryData>(`${tutorSessionsPath}/history`, {
      params: query,
    }),
}

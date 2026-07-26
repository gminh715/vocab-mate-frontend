import { apiClient } from '@/config/apiClient'
import type {
  GetVocabulariesQueryParams,
  LearningStatus,
  SaveVocabularyData,
  SaveVocabularyRequest,
  VocabularyDetailData,
  VocabularyListData,
} from '@/types/Vocabulary/vocabulary'

const vocabulariesPath = '/vocabularies'

export const vocabulariesApi = {
  findAll: (params: GetVocabulariesQueryParams): Promise<VocabularyListData> =>
    apiClient.get<VocabularyListData>(vocabulariesPath, { params }),

  getDue: (params?: {
    limit?: number
    collectionId?: string
  }): Promise<VocabularyListData> =>
    apiClient.get<VocabularyListData>(vocabulariesPath, {
      params: { ...params, dueOnly: true },
    }),

  findOne: (userVocabularyId: string): Promise<VocabularyDetailData> =>
    apiClient.get<VocabularyDetailData>(
      `${vocabulariesPath}/${encodeURIComponent(userVocabularyId)}`,
    ),

  updateNote: (
    userVocabularyId: string,
    personalNote: string | null,
  ): Promise<VocabularyDetailData> =>
    apiClient.patch<VocabularyDetailData>(
      `${vocabulariesPath}/${encodeURIComponent(userVocabularyId)}`,
      { personalNote },
    ),

  save: (request: SaveVocabularyRequest): Promise<SaveVocabularyData> =>
    apiClient.post<SaveVocabularyData>(vocabulariesPath, request),

  updateStatus: (
    userVocabularyId: string,
    learningStatus: LearningStatus,
  ): Promise<VocabularyDetailData> =>
    apiClient.patch<VocabularyDetailData>(
      `${vocabulariesPath}/${encodeURIComponent(userVocabularyId)}/status`,
      { learningStatus },
    ),

  remove: (userVocabularyId: string): Promise<void> =>
    apiClient.deleteNoContent(
      `${vocabulariesPath}/${encodeURIComponent(userVocabularyId)}`,
    ),
}


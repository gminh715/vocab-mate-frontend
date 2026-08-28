import { apiClient } from '@/config/apiClient'
import type {
  GetVocabulariesQueryParams,
  SaveVocabularyData,
  SaveVocabularyRequest,
  VocabularyDetailData,
  VocabularyListData,
} from '@/types/Vocabulary/vocabulary'

const vocabulariesPath = '/vocabularies'

export const vocabulariesApi = {
  findAll: (params: GetVocabulariesQueryParams): Promise<VocabularyListData> =>
    apiClient.get<VocabularyListData>(vocabulariesPath, { params }),

  findOne: (userVocabularyId: string): Promise<VocabularyDetailData> =>
    apiClient.get<VocabularyDetailData>(
      `${vocabulariesPath}/${encodeURIComponent(userVocabularyId)}`,
    ),

  save: (request: SaveVocabularyRequest): Promise<SaveVocabularyData> =>
    apiClient.post<SaveVocabularyData>(vocabulariesPath, request),

  remove: (userVocabularyId: string): Promise<void> =>
    apiClient.deleteNoContent(
      `${vocabulariesPath}/${encodeURIComponent(userVocabularyId)}`,
    ),
}


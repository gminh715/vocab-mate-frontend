import { apiClient } from '../config/apiClient'
import type {
  SaveVocabularyData,
  SaveVocabularyRequest,
} from '../types/vocabulary'

const vocabulariesPath = '/vocabularies'

export const vocabulariesApi = {
  save: (request: SaveVocabularyRequest): Promise<SaveVocabularyData> =>
    apiClient.post<SaveVocabularyData>(vocabulariesPath, request),
}

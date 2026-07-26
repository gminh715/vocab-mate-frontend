import { apiClient } from '@/config/apiClient'
import type {
  CollectionListData,
  CollectionListItem,
  GetCollectionsQueryParams,
} from '@/types/Vocabulary/vocabulary'

const collectionsPath = '/collections'

export interface CreateCollectionRequest {
  name: string
  description?: string
}

export interface CreateCollectionResponse {
  collection: CollectionListItem
}

export interface AddCollectionItemsResponse {
  addedCount: number
  skippedCount: number
}

export const collectionsApi = {
  findAll: (
    params?: GetCollectionsQueryParams,
  ): Promise<CollectionListData> =>
    apiClient.get<CollectionListData>(collectionsPath, { params }),

  create: (
    request: CreateCollectionRequest,
  ): Promise<CreateCollectionResponse> =>
    apiClient.post<CreateCollectionResponse>(collectionsPath, request),

  addItems: (
    collectionId: string,
    userVocabularyIds: string[],
  ): Promise<AddCollectionItemsResponse> =>
    apiClient.post<AddCollectionItemsResponse>(
      `${collectionsPath}/${encodeURIComponent(collectionId)}/items`,
      { userVocabularyIds },
    ),

  removeItem: (
    collectionId: string,
    userVocabularyId: string,
  ): Promise<void> =>
    apiClient.deleteNoContent(
      `${collectionsPath}/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(userVocabularyId)}`,
    ),
}


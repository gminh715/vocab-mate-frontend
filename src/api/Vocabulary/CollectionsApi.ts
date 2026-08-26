import { apiClient } from '@/config/apiClient'
import type {
  CollectionDetailData,
  CollectionItemsListData,
  CollectionListData,
  GetCollectionItemsQueryParams,
  GetCollectionsQueryParams,
  VocabularyCollection,
} from '@/types/Vocabulary/vocabulary'

const collectionsPath = '/collections'

export interface CreateCollectionRequest {
  name: string
}

export interface CollectionMutationResponse {
  collection: VocabularyCollection
}

export type CreateCollectionResponse = CollectionMutationResponse

export interface UpdateCollectionRequest {
  name: string
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

  findOne: (collectionId: string): Promise<CollectionDetailData> =>
    apiClient.get<CollectionDetailData>(
      `${collectionsPath}/${encodeURIComponent(collectionId)}`,
    ),

  update: (
    collectionId: string,
    request: UpdateCollectionRequest,
  ): Promise<CollectionMutationResponse> =>
    apiClient.patch<CollectionMutationResponse>(
      `${collectionsPath}/${encodeURIComponent(collectionId)}`,
      request,
    ),

  remove: (collectionId: string): Promise<void> =>
    apiClient.deleteNoContent(
      `${collectionsPath}/${encodeURIComponent(collectionId)}`,
    ),

  addItems: (
    collectionId: string,
    userVocabularyIds: string[],
  ): Promise<AddCollectionItemsResponse> =>
    apiClient.post<AddCollectionItemsResponse>(
      `${collectionsPath}/${encodeURIComponent(collectionId)}/items`,
      { userVocabularyIds },
    ),

  findItems: (
    collectionId: string,
    params: GetCollectionItemsQueryParams,
  ): Promise<CollectionItemsListData> =>
    apiClient.get<CollectionItemsListData>(
      `${collectionsPath}/${encodeURIComponent(collectionId)}/items`,
      { params },
    ),

  removeItem: (
    collectionId: string,
    userVocabularyId: string,
  ): Promise<void> =>
    apiClient.deleteNoContent(
      `${collectionsPath}/${encodeURIComponent(collectionId)}/items/${encodeURIComponent(userVocabularyId)}`,
    ),
}

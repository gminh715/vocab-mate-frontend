import type { CefrLevel } from '@/types/Auth/auth'
import type { PaginationMeta } from '@/types/Admin/adminUsers'

export const VOCABULARY_SORTS = ['newest', 'oldest'] as const

export type VocabularySort = (typeof VOCABULARY_SORTS)[number]

export interface SaveVocabularyRequest {
  articleSentenceTermId: string
  collectionIds?: string[]
}

export interface VocabularyCollectionSummary {
  id: string
  name: string
  addedAt: string
}

export interface VocabularySnapshot {
  id: string
  articleSentenceTermId: string
  savedWordDisplay: string
  savedLemma: string
  savedPartOfSpeech: string
  savedIpa: string | null
  savedCefrLevel: CefrLevel
  savedMeaningVi: string
  definitionEn: string | null
  savedAt: string
  createdAt: string
}

export interface VocabularyListItem extends VocabularySnapshot {
  collections: VocabularyCollectionSummary[]
}

export interface VocabularyListData {
  items: VocabularyListItem[]
  meta: PaginationMeta
}

export interface GetVocabulariesQueryParams {
  page: number
  limit: number
  q?: string
  cefrLevel?: CefrLevel
  collectionId?: string
  sort: VocabularySort
}

export interface VocabularyDetail extends VocabularySnapshot {
  savedExamples: unknown[]
}

export interface VocabularySourceArticle {
  id: string
  slug: string
  title: string
  thumbnailUrl: string | null
  sourceName: string | null
  sourceUrl: string | null
}

export interface VocabularyDetailData {
  vocabulary: VocabularyDetail
  collections: VocabularyCollectionSummary[]
  sourceArticle: VocabularySourceArticle
}

export interface SaveVocabularyData {
  vocabulary: VocabularyDetail
  collections: VocabularyCollectionSummary[]
}

export interface VocabularyCollection {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface CollectionListItem extends VocabularyCollection {
  vocabularyCount: number
}

export interface CollectionListData {
  items: CollectionListItem[]
  meta: PaginationMeta
}

export interface GetCollectionsQueryParams {
  page?: number
  limit?: number
  q?: string
}

export interface CollectionDetailData {
  collection: VocabularyCollection
  vocabularyCount: number
}

export interface GetCollectionItemsQueryParams {
  page: number
  limit: number
  q?: string
  sort: VocabularySort
}

export interface CollectionVocabularyItem extends VocabularySnapshot {
  addedAt: string
}

export interface CollectionItemsListData {
  items: CollectionVocabularyItem[]
  meta: PaginationMeta
}


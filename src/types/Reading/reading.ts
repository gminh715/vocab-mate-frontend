import type { PublicArticleMetadata } from '@/types/Article/articles'
import type { ArticleStatus } from '@/types/Admin/adminArticles'
import type { PublicCategory } from '@/types/Admin/adminCategories'
import type { PaginationMeta } from '@/types/Admin/adminUsers'
import type { CefrLevel } from '@/types/Auth/auth'

export const READING_STATUSES = ['READING', 'COMPLETED'] as const

export type ReadingStatus = (typeof READING_STATUSES)[number]

export const READING_HISTORY_SORTS = ['newest', 'oldest'] as const

export type ReadingHistorySort =
  (typeof READING_HISTORY_SORTS)[number]

export interface ReaderArticle extends PublicArticleMetadata {
  category: PublicCategory
}

export interface ReaderProgress {
  articleId: string
  status: ReadingStatus
  progressPercent: number
  completedAt: string | null
}

export interface ReaderArticleData {
  article: ReaderArticle
  contentHtml: string
  highlightedTermIds: string[]
  progress: ReaderProgress
}

export interface UpdateReadingProgressInput {
  progressPercent?: number
}

export interface ReadingProgressData {
  progress: ReaderProgress
}

export interface ReadingHistoryParams {
  page: number
  limit: number
  status?: ReadingStatus
  sort: ReadingHistorySort
}

export interface ReadingHistoryArticle {
  id: string
  title: string
  slug: string
  summary: string
  thumbnailUrl: string | null
  cefrLevel: CefrLevel
  status: ArticleStatus
  publishedAt: string | null
  category: PublicCategory
}

export interface ReadingHistoryItem extends ReaderProgress {
  firstOpenedAt: string
  lastReadAt: string
  article: ReadingHistoryArticle
}

export interface ReadingHistoryData {
  items: ReadingHistoryItem[]
  meta: PaginationMeta
}

export interface ContextualTerm {
  id: string
  value: string
  lemma: string
  partOfSpeech: string
  ipa: string | null
  cefrLevel: CefrLevel
  contextualMeaningVi: string | null
  definitionEn: string | null
  contextualExplanation: string | null
  synonyms: string[]
  antonyms: string[]
  collocations: string[]
  relatedTerms: string[]
  examples: Array<{
    sentence: string
    translationVi: string
  }>
  explanationStatus: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'
}

export interface ContextualParentSentence {
  id: string
  sentenceOrder: number
  sentenceText: string
  translationVi: string | null
}

export interface ContextualTermSaveState {
  isSaved: boolean
  userVocabularyId: string | null
}

export interface ContextualTermLookupData {
  term: ContextualTerm
  parentSentence: ContextualParentSentence
  saveState: ContextualTermSaveState
}

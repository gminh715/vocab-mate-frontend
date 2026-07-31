import type { PublicArticleMetadata } from '@/types/Article/articles'
import type { ArticleStatus } from '@/types/Admin/adminArticles'
import type { PublicCategory } from '@/types/Admin/adminCategories'
import type { PaginationMeta } from '@/types/Admin/adminUsers'
import type { LexicalUnitType } from '@/types/Admin/adminArticleContent'
import type { CefrLevel } from '@/types/Auth/auth'
import type { LearningStatus } from '@/types/Vocabulary/vocabulary'

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
  lastBlockKey: string | null
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
  lastBlockKey?: string
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
  wordDisplay: string
  lemma: string
  unitType: LexicalUnitType
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
  vocabularyTopic: string | null
  examples: Array<{
    sentence: string
    translationVi: string
  }>
  skill: string | null
  explanationStatus: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED'
  explanationGeneratedAt: string | null
}

export interface ContextualParentSentence {
  id: string
  sentenceOrder: number
  sentenceText: string
  translationVi: string | null
  explanationVi: string | null
  referenceExplanation: string | null
  skill: string | null
}

export interface ContextualTermSaveState {
  isSaved: boolean
  userVocabularyId: string | null
  learningStatus: LearningStatus | null
}

export interface ContextualTermLookupData {
  term: ContextualTerm
  parentSentence: ContextualParentSentence
  saveState: ContextualTermSaveState
}

import type { PaginationMeta } from '@/types/Admin/adminUsers'
import type {
  AiGenerationStatus,
  ArticleStatus,
} from '@/types/Admin/adminArticles'
import type { CefrLevel } from '@/types/Auth/auth'
import type { PublicCategory } from '@/types/Admin/adminCategories'

export const LEXICAL_UNIT_TYPES = ['WORD', 'PHRASE'] as const
export const TERM_ORIGINS = ['MANUAL', 'AI'] as const
export const TERM_REVIEW_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
] as const
export type LexicalUnitType = (typeof LEXICAL_UNIT_TYPES)[number]
export type TermOrigin = (typeof TERM_ORIGINS)[number]
export type TermReviewStatus =
  (typeof TERM_REVIEW_STATUSES)[number]

export interface ArticleSentence {
  id: string
  articleId: string
  contentVersion: number
  sentenceOrder: number
  sentenceText: string
  translationVi: string | null
  explanationVi: string | null
  referenceExplanation: string | null
  skill: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ArticleTermExample {
  sentence: string
  translationVi: string
}

export interface ArticleSentenceTerm {
  id: string
  sentenceId: string
  value: string
  wordDisplay: string
  lemma: string
  normalizedLemma: string
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
  examples: ArticleTermExample[]
  skill: string | null
  origin: TermOrigin
  reviewStatus: TermReviewStatus
  selectionReason: string | null
  explanationStatus: AiGenerationStatus
  explanationError: string | null
  explanationGeneratedAt: string | null
  isLookupEnabled: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ArticleSentenceListParams {
  page: number
  limit: number
  isActive?: boolean
}

export interface ArticleSentenceListData {
  items: ArticleSentence[]
  meta: PaginationMeta
  contentVersion: number
}

export interface ArticleSentenceDetail {
  sentence: ArticleSentence
  terms: ArticleSentenceTerm[]
}

export interface UpdateArticleSentenceRequest {
  translationVi?: string
  explanationVi?: string
  referenceExplanation?: string
  skill?: string
  isActive?: boolean
}

export interface ArticleSentenceMutationData {
  sentence: ArticleSentence
}

export interface ParseArticleContentRequest {
  force?: boolean
}

export interface ParseArticleContentData {
  contentVersion: number
  sentenceCount: number
  contentHtml: string
}

export interface ArticleTermListParams {
  page: number
  limit: number
  sentenceId?: string
  cefrLevel?: CefrLevel
  unitType?: LexicalUnitType
  origin?: TermOrigin
  reviewStatus?: TermReviewStatus
  explanationStatus?: AiGenerationStatus
  isActive?: boolean
  q?: string
}

export interface ArticleTermListItem extends ArticleSentenceTerm {
  sentenceOrder: number
  hasDefinitionEn: boolean
  hasContextualExplanation: boolean
  hasExamples: boolean
}

export interface ArticleTermListData {
  items: ArticleTermListItem[]
  meta: PaginationMeta
  contentVersion: number
}

export interface ArticleTermDetail {
  term: ArticleSentenceTerm
  sentence: ArticleSentence
}

export interface CreateArticleTermRequest {
  value: string
  wordDisplay: string
  lemma: string
  normalizedLemma: string
  unitType: LexicalUnitType
  partOfSpeech: string
  ipa?: string
  cefrLevel: CefrLevel
  contextualMeaningVi: string
  definitionEn?: string
  contextualExplanation?: string
  synonyms?: string[]
  antonyms?: string[]
  collocations?: string[]
  relatedTerms?: string[]
  vocabularyTopic?: string
  examples?: ArticleTermExample[]
  skill?: string
  isLookupEnabled?: boolean
  isActive?: boolean
}

export type UpdateArticleTermRequest = Partial<CreateArticleTermRequest>

export interface ArticleTermCreateData {
  term: ArticleSentenceTerm
  updatedContentHtml: string
}

export interface ArticleTermUpdateData {
  term: ArticleSentenceTerm
  contentHtmlChanged: boolean
}

export interface ArticleAnalysisData {
  articleId: string
  contentVersion: number
  aiAnalysisStatus: 'READY'
  category: PublicCategory
  cefrLevel: CefrLevel
  candidateCount: number
}

export interface PublicationValidationIssue {
  code: string
  message: string
  entityId?: string
}

export interface ArticlePreviewMetadata {
  id: string
  title: string
  slug: string
  summary: string
  sourceName: string | null
  sourceUrl: string | null
  authorName: string | null
  thumbnailUrl: string | null
  cefrLevel: CefrLevel
  status: ArticleStatus
  contentVersion: number
  publishedAt: string | null
  category: PublicCategory
}

export interface ArticlePreviewTerm extends ArticleSentenceTerm {
  isHighlighted: boolean
}

export interface ArticlePreviewData {
  article: ArticlePreviewMetadata
  contentHtml: string
  terms: ArticlePreviewTerm[]
  validationWarnings: PublicationValidationIssue[]
}

export interface ArticlePublishData {
  id: string
  status: 'PUBLISHED'
  publishedAt: string
}

export interface ArticleArchiveData {
  id: string
  status: 'ARCHIVED'
  archivedAt: string
}

export interface ArticleRestoreDraftData {
  id: string
  status: 'DRAFT'
}

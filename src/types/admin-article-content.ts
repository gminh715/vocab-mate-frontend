import type { PaginationMeta } from './admin-users'
import type { ArticleStatus } from './admin-articles'
import type { CefrLevel } from './auth'
import type { PublicCategory } from './admin-categories'

export const LEXICAL_UNIT_TYPES = ['WORD', 'PHRASE'] as const
export type LexicalUnitType = (typeof LEXICAL_UNIT_TYPES)[number]

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
  contextualMeaningVi: string
  definitionEn: string | null
  contextualExplanation: string | null
  synonyms: string[]
  antonyms: string[]
  collocations: string[]
  relatedTerms: string[]
  vocabularyTopic: string | null
  examples: ArticleTermExample[]
  skill: string | null
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

import type { CefrLevel } from './auth'

export const LEARNING_STATUSES = [
  'NEW',
  'LEARNING',
  'REVIEWING',
  'MASTERED',
  'IGNORED',
] as const

export type LearningStatus = (typeof LEARNING_STATUSES)[number]

export interface SaveVocabularyRequest {
  articleSentenceTermId: string
  personalNote?: string
  collectionIds?: string[]
}

export interface VocabularyCollectionSummary {
  id: string
  name: string
  description: string | null
  addedAt: string
}

export interface VocabularySnapshot {
  id: string
  articleSentenceTermId: string
  learningStatus: LearningStatus
  personalNote: string | null
  savedWordDisplay: string
  savedLemma: string
  savedPartOfSpeech: string
  savedIpa: string | null
  savedCefrLevel: CefrLevel
  savedMeaningVi: string
  savedAt: string
  nextReviewAt: string | null
}

export interface VocabularyDetail extends VocabularySnapshot {
  savedContextSentence: string
  savedContextTranslationVi: string
  savedExplanation: string | null
  savedExamples: unknown[]
  lastReviewedAt: string | null
  reviewIntervalDays: number | null
}

export interface SaveVocabularyData {
  vocabulary: VocabularyDetail
  collections: VocabularyCollectionSummary[]
}

import type { CefrLevel } from '@/types/Auth/auth'

export type PlacementBand = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'

export interface PlacementVocabularyEntry {
  word: string
  wordClass: string
  level: CefrLevel
  meaningVi: string
}

export interface PlacementQuestionOption {
  id: string
  meaningVi: string
}

export interface PlacementQuestion {
  id: string
  word: string
  wordClass: string
  level: CefrLevel
  band: PlacementBand
  options: PlacementQuestionOption[]
  correctOptionId: string
}

export interface PlacementBandScore {
  correct: number
  total: number
}

export type PlacementScores = Record<PlacementBand, PlacementBandScore>

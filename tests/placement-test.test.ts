import { describe, expect, it } from 'vitest'
import { parsePlacementCsv } from '@/api/Placement/PlacementApi'
import type { CefrLevel } from '@/types/Auth/auth'
import type { PlacementVocabularyEntry } from '@/types/Placement/placement'
import {
  createPlacementQuestions,
  placementLevelFromScores,
  scorePlacementTest,
} from '@/utils/Placement/placementTest'

const entriesFor = (
  prefix: string,
  level: CefrLevel,
  count: number,
): PlacementVocabularyEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    word: `${prefix}-${index}`,
    wordClass: 'noun',
    level,
    meaningVi: `nghĩa ${prefix} ${index}`,
  }))

const vocabulary = [
  ...entriesFor('basic', 'A1', 25),
  ...entriesFor('intermediate', 'B1', 20),
  ...entriesFor('advanced', 'C1', 12),
]

describe('placement test generation', () => {
  it('parses the UTF-8 CSV contract', () => {
    expect(
      parsePlacementCsv(
        '\uFEFFword,class,level,meaning_vi\nhello,exclamation,a1,xin chào\n',
      ),
    ).toEqual([
      {
        word: 'hello',
        wordClass: 'exclamation',
        level: 'A1',
        meaningVi: 'xin chào',
      },
    ])
  })

  it('creates 15 basic, 10 intermediate, and 5 advanced questions', () => {
    const questions = createPlacementQuestions(vocabulary, () => 0.42)

    expect(questions).toHaveLength(30)
    expect(questions.filter(({ band }) => band === 'BASIC')).toHaveLength(15)
    expect(questions.filter(({ band }) => band === 'INTERMEDIATE')).toHaveLength(10)
    expect(questions.filter(({ band }) => band === 'ADVANCED')).toHaveLength(5)
    expect(questions.every(({ options }) => options.length === 4)).toBe(true)
    expect(new Set(questions.map(({ word }) => word)).size).toBe(30)
  })

  it('scores answers without exposing feedback between questions', () => {
    const questions = createPlacementQuestions(vocabulary, () => 0.31)
    const answers = Object.fromEntries(
      questions.map((question) => [question.id, question.correctOptionId]),
    )
    const scores = scorePlacementTest(questions, answers)

    expect(scores).toEqual({
      BASIC: { correct: 15, total: 15 },
      INTERMEDIATE: { correct: 10, total: 10 },
      ADVANCED: { correct: 5, total: 5 },
    })
    expect(placementLevelFromScores(scores)).toBe('C2')
  })

  it.each([
    [{ BASIC: { correct: 5, total: 15 }, INTERMEDIATE: { correct: 10, total: 10 }, ADVANCED: { correct: 5, total: 5 } }, 'A1'],
    [{ BASIC: { correct: 8, total: 15 }, INTERMEDIATE: { correct: 10, total: 10 }, ADVANCED: { correct: 5, total: 5 } }, 'A2'],
    [{ BASIC: { correct: 12, total: 15 }, INTERMEDIATE: { correct: 4, total: 10 }, ADVANCED: { correct: 5, total: 5 } }, 'B1'],
    [{ BASIC: { correct: 12, total: 15 }, INTERMEDIATE: { correct: 6, total: 10 }, ADVANCED: { correct: 5, total: 5 } }, 'B2'],
    [{ BASIC: { correct: 12, total: 15 }, INTERMEDIATE: { correct: 8, total: 10 }, ADVANCED: { correct: 3, total: 5 } }, 'C1'],
  ] as const)('derives %s as %s', (scores, expected) => {
    expect(placementLevelFromScores(scores)).toBe(expected)
  })
})

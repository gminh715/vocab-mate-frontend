import type { CefrLevel } from '@/types/Auth/auth'
import type {
  PlacementBand,
  PlacementQuestion,
  PlacementScores,
  PlacementVocabularyEntry,
} from '@/types/Placement/placement'

const BAND_CONFIG: ReadonlyArray<{
  band: PlacementBand
  levels: readonly CefrLevel[]
  count: number
}> = [
  { band: 'BASIC', levels: ['A1', 'A2'], count: 10 },
  { band: 'INTERMEDIATE', levels: ['B1', 'B2'], count: 12 },
  { band: 'ADVANCED', levels: ['C1', 'C2'], count: 8 },
]

const shuffled = <T>(values: readonly T[], random: () => number): T[] => {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    const current = result[index]
    result[index] = result[target]
    result[target] = current
  }
  return result
}

const uniqueWords = (
  entries: readonly PlacementVocabularyEntry[],
): PlacementVocabularyEntry[] => {
  const seen = new Set<string>()
  return entries.filter(({ word }) => {
    const key = word.toLocaleLowerCase('en')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const createPlacementQuestions = (
  entries: readonly PlacementVocabularyEntry[],
  random: () => number = Math.random,
): PlacementQuestion[] => {
  const questions: PlacementQuestion[] = []
  const selectedWords = new Set<string>()

  for (const { band, levels, count } of BAND_CONFIG) {
    const pool = uniqueWords(
      entries.filter(
        ({ word, level }) =>
          levels.includes(level) &&
          !selectedWords.has(word.toLocaleLowerCase('en')),
      ),
    )
    if (pool.length < count || new Set(pool.map(({ meaningVi }) => meaningVi)).size < 4) {
      throw new Error(`Not enough ${band.toLowerCase()} vocabulary for placement.`)
    }

    const selected = shuffled(pool, random).slice(0, count)
    for (const entry of selected) {
      selectedWords.add(entry.word.toLocaleLowerCase('en'))
      const distractors = shuffled(
        pool.filter(
          ({ word, meaningVi }) =>
            word !== entry.word && meaningVi !== entry.meaningVi,
        ),
        random,
      )
        .filter(
          ({ meaningVi }, index, candidates) =>
            candidates.findIndex((candidate) => candidate.meaningVi === meaningVi) === index,
        )
        .slice(0, 3)

      if (distractors.length < 3) {
        throw new Error(`Not enough answer options for ${entry.word}.`)
      }

      const questionIndex = questions.length
      const optionMeanings = shuffled(
        [entry.meaningVi, ...distractors.map(({ meaningVi }) => meaningVi)],
        random,
      )
      const options = optionMeanings.map((meaningVi, optionIndex) => ({
        id: `placement-${questionIndex}-option-${optionIndex}`,
        meaningVi,
      }))
      const correctOption = options.find(
        ({ meaningVi }) => meaningVi === entry.meaningVi,
      )
      if (!correctOption) throw new Error('Correct placement option is missing.')

      questions.push({
        id: `placement-${questionIndex}`,
        word: entry.word,
        wordClass: entry.wordClass,
        level: entry.level,
        band,
        options,
        correctOptionId: correctOption.id,
      })
    }
  }

  return questions
}

export const scorePlacementTest = (
  questions: readonly PlacementQuestion[],
  answers: Readonly<Record<string, string>>,
): PlacementScores => {
  const scores: PlacementScores = {
    BASIC: { correct: 0, total: 0 },
    INTERMEDIATE: { correct: 0, total: 0 },
    ADVANCED: { correct: 0, total: 0 },
  }

  for (const question of questions) {
    scores[question.band].total += 1
    if (answers[question.id] === question.correctOptionId) {
      scores[question.band].correct += 1
    }
  }
  return scores
}

const accuracy = ({ correct, total }: { correct: number; total: number }) =>
  total === 0 ? 0 : correct / total

export const placementLevelFromScores = (
  scores: PlacementScores,
): CefrLevel => {
  const basic = accuracy(scores.BASIC)
  if (basic < 0.4) return 'A1'
  if (basic < 0.75) return 'A2'

  const intermediate = accuracy(scores.INTERMEDIATE)
  if (intermediate < 0.5) return 'B1'
  if (intermediate < 0.8) return 'B2'

  return accuracy(scores.ADVANCED) < 0.8 ? 'C1' : 'C2'
}

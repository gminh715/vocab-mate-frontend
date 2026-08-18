import type { CefrLevel } from '@/types/Auth/auth'
import type { PlacementVocabularyEntry } from '@/types/Placement/placement'

const DATASET_PATH = `${import.meta.env.BASE_URL}assets/oxford-5000-vi.csv`

const parseCsvLine = (line: string): string[] => {
  const fields: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      fields.push(field)
      field = ''
    } else {
      field += character
    }
  }

  fields.push(field)
  return fields
}

const isCefrLevel = (value: string): value is CefrLevel =>
  ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(value)

export const parsePlacementCsv = (
  csv: string,
): PlacementVocabularyEntry[] => {
  const [headerLine, ...lines] = csv
    .replace(/^\uFEFF/u, '')
    .trim()
    .split(/\r?\n/u)

  if (headerLine !== 'word,class,level,meaning_vi') {
    throw new Error('Placement vocabulary has an unexpected format.')
  }

  return lines.flatMap((line) => {
    const [word, wordClass, rawLevel, meaningVi] = parseCsvLine(line)
    const level = rawLevel?.toUpperCase() ?? ''
    if (!word || !wordClass || !meaningVi || !isCefrLevel(level)) return []
    return [{ word, wordClass, level, meaningVi }]
  })
}

export const placementApi = {
  async vocabulary(): Promise<PlacementVocabularyEntry[]> {
    const response = await fetch(DATASET_PATH, {
      headers: { Accept: 'text/csv' },
    })
    if (!response.ok) {
      throw new Error('Placement vocabulary could not be loaded.')
    }
    return parsePlacementCsv(await response.text())
  },
}

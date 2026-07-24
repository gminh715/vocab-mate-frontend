import { z } from 'zod'
import type { SaveVocabularyRequest } from '../types/vocabulary'

export const saveVocabularyFormSchema = z.object({
  personalNote: z
    .string()
    .trim()
    .max(2_000, 'Personal note must be 2,000 characters or fewer.'),
})

export type SaveVocabularyFormValues = z.input<
  typeof saveVocabularyFormSchema
>

export type SaveVocabularyFormOutput = z.output<
  typeof saveVocabularyFormSchema
>

export const toSaveVocabularyRequest = (
  articleSentenceTermId: string,
  values: SaveVocabularyFormOutput,
): SaveVocabularyRequest => ({
  articleSentenceTermId,
  ...(values.personalNote
    ? { personalNote: values.personalNote }
    : {}),
})

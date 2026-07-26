import { z } from 'zod'
import type { SaveVocabularyRequest } from '@/types/Vocabulary/vocabulary'

export const saveVocabularyFormSchema = z.object({
  personalNote: z
    .string()
    .trim()
    .max(2_000, 'Personal note must be 2,000 characters or fewer.'),
  collectionIds: z
    .array(z.string().uuid('Invalid collection identifier.'))
    .min(1, 'Please select at least one collection.'),
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
  collectionIds: values.collectionIds,
  ...(values.personalNote
    ? { personalNote: values.personalNote }
    : {}),
})
export const updatePersonalNoteFormSchema = z.object({
  personalNote: z
    .string()
    .trim()
    .max(2_000, 'Personal note must be 2,000 characters or fewer.')
    .optional()
    .or(z.literal('')),
})

export type UpdatePersonalNoteFormValues = z.input<
  typeof updatePersonalNoteFormSchema
>

export type UpdatePersonalNoteFormOutput = z.output<
  typeof updatePersonalNoteFormSchema
>

export const toUpdatePersonalNoteRequest = (
  values: UpdatePersonalNoteFormOutput,
): string | null => {
  const trimmed = values.personalNote?.trim()
  return trimmed || null
}

import { z } from 'zod'
import type { SaveVocabularyRequest } from '@/types/Vocabulary/vocabulary'

export const collectionNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'nameRequired')
    .max(100, 'nameTooLong'),
})

export type CollectionNameFormValues = z.input<typeof collectionNameSchema>
export type CollectionNameFormOutput = z.output<typeof collectionNameSchema>

export const saveVocabularyFormSchema = z.object({
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
})

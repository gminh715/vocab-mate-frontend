import { z } from 'zod'
import type {
  CreateArticleTermRequest,
  UpdateArticleSentenceRequest,
  UpdateArticleTermRequest,
} from '@/types/Admin/adminArticleContent'
import { CEFR_LEVELS } from '@/types/Auth/auth'

const optionalMetadata = (maximum: number, message: string) =>
  z.string().trim().max(maximum, message)

export const sentenceFormSchema = z.object({
  translationVi: optionalMetadata(
    20_000,
    'Translation must be 20,000 characters or fewer.',
  ),
  isActive: z.boolean(),
})

export type SentenceFormValues = z.input<typeof sentenceFormSchema>
export type SentenceFormOutput = z.output<typeof sentenceFormSchema>

export const toUpdateArticleSentenceRequest = (
  values: SentenceFormOutput,
): UpdateArticleSentenceRequest => ({
  ...(values.translationVi
    ? { translationVi: values.translationVi }
    : {}),
  isActive: values.isActive,
})

const termString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label.toLowerCase()}.`)
    .max(500, `${label} must be 500 characters or fewer.`)

const optionalTermString = (label: string, maximum = 500) =>
  z
    .string()
    .trim()
    .max(maximum, `${label} must be ${maximum.toLocaleString()} characters or fewer.`)

const termArray = z
  .array(
    z
      .string()
      .trim()
      .min(1, 'Remove empty values.')
      .max(500, 'Each value must be 500 characters or fewer.'),
  )
  .max(100, 'Use no more than 100 values.')

const termExampleSchema = z.object({
  sentence: z
    .string()
    .trim()
    .min(1, 'Enter an example sentence.')
    .max(2_000, 'Example sentence must be 2,000 characters or fewer.'),
  translationVi: z
    .string()
    .trim()
    .min(1, 'Enter the Vietnamese translation.')
    .max(2_000, 'Translation must be 2,000 characters or fewer.'),
})

export const articleTermFormSchema = z.object({
  value: termString('Term value'),
  lemma: termString('Lemma'),
  partOfSpeech: termString('Part of speech'),
  ipa: optionalTermString('IPA'),
  cefrLevel: z.enum(CEFR_LEVELS),
  contextualMeaningVi: z
    .string()
    .trim()
    .min(1, 'Enter the contextual Vietnamese meaning.')
    .max(20_000, 'Contextual meaning must be 20,000 characters or fewer.'),
  definitionEn: optionalTermString('English definition', 20_000),
  contextualExplanation: optionalTermString(
    'Contextual explanation',
    20_000,
  ),
  synonyms: termArray,
  antonyms: termArray,
  collocations: termArray,
  relatedTerms: termArray,
  examples: z
    .array(termExampleSchema)
    .max(50, 'Use no more than 50 examples.'),
  isLookupEnabled: z.boolean(),
  isActive: z.boolean(),
})

export type ArticleTermFormValues = z.input<typeof articleTermFormSchema>
export type ArticleTermFormOutput = z.output<typeof articleTermFormSchema>

const toTermRequest = (
  values: ArticleTermFormOutput,
): CreateArticleTermRequest => ({
  value: values.value,
  lemma: values.lemma,
  partOfSpeech: values.partOfSpeech,
  ...(values.ipa ? { ipa: values.ipa } : {}),
  cefrLevel: values.cefrLevel,
  contextualMeaningVi: values.contextualMeaningVi,
  ...(values.definitionEn ? { definitionEn: values.definitionEn } : {}),
  ...(values.contextualExplanation
    ? { contextualExplanation: values.contextualExplanation }
    : {}),
  synonyms: values.synonyms,
  antonyms: values.antonyms,
  collocations: values.collocations,
  relatedTerms: values.relatedTerms,
  examples: values.examples,
  isLookupEnabled: values.isLookupEnabled,
  isActive: values.isActive,
})

export const toCreateArticleTermRequest = (
  values: ArticleTermFormOutput,
): CreateArticleTermRequest => toTermRequest(values)

export const toUpdateArticleTermRequest = (
  values: ArticleTermFormOutput,
  initialValues: ArticleTermFormOutput,
): UpdateArticleTermRequest => {
  const sameStrings = (left: string[], right: string[]) =>
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  const sameExamples =
    values.examples.length === initialValues.examples.length &&
    values.examples.every(
      (example, index) =>
        example.sentence === initialValues.examples[index]?.sentence &&
        example.translationVi ===
          initialValues.examples[index]?.translationVi,
    )

  return {
    ...(values.value !== initialValues.value
      ? { value: values.value }
      : {}),
    ...(values.lemma !== initialValues.lemma
      ? { lemma: values.lemma }
      : {}),
    ...(values.partOfSpeech !== initialValues.partOfSpeech
      ? { partOfSpeech: values.partOfSpeech }
      : {}),
    ...(values.ipa !== initialValues.ipa && values.ipa
      ? { ipa: values.ipa }
      : {}),
    ...(values.cefrLevel !== initialValues.cefrLevel
      ? { cefrLevel: values.cefrLevel }
      : {}),
    ...(values.contextualMeaningVi !== initialValues.contextualMeaningVi
      ? { contextualMeaningVi: values.contextualMeaningVi }
      : {}),
    ...(values.definitionEn !== initialValues.definitionEn &&
    values.definitionEn
      ? { definitionEn: values.definitionEn }
      : {}),
    ...(values.contextualExplanation !==
      initialValues.contextualExplanation &&
    values.contextualExplanation
      ? { contextualExplanation: values.contextualExplanation }
      : {}),
    ...(!sameStrings(values.synonyms, initialValues.synonyms)
      ? { synonyms: values.synonyms }
      : {}),
    ...(!sameStrings(values.antonyms, initialValues.antonyms)
      ? { antonyms: values.antonyms }
      : {}),
    ...(!sameStrings(values.collocations, initialValues.collocations)
      ? { collocations: values.collocations }
      : {}),
    ...(!sameStrings(values.relatedTerms, initialValues.relatedTerms)
      ? { relatedTerms: values.relatedTerms }
      : {}),
    ...(!sameExamples ? { examples: values.examples } : {}),
    ...(values.isLookupEnabled !== initialValues.isLookupEnabled
      ? { isLookupEnabled: values.isLookupEnabled }
      : {}),
    ...(values.isActive !== initialValues.isActive
      ? { isActive: values.isActive }
      : {}),
  }
}

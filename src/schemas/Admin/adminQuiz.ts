import { z } from 'zod'
import type {
  CreateQuizRequest,
  QuestionOptionRequest,
  QuizQuestionRequest,
  QuestionType,
  UpdateQuizRequest,
} from '@/types/Admin/adminQuizzes'
import { QUESTION_TYPES } from '@/types/Admin/adminQuizzes'

const optionalTrimmed = (maximum: number) =>
  z.string().trim().max(maximum)

export const quizMetadataSchema = z.object({
  articleId: z.string().uuid('Choose an article.'),
  title: z.string().trim().min(1, 'Enter a title.').max(300),
  description: optionalTrimmed(2_000),
})

export type QuizMetadataValues = z.input<typeof quizMetadataSchema>

export const questionFormSchema = z
  .object({
    articleVocabularyId: z.string().uuid('Choose a contextual term.'),
    questionType: z.enum(QUESTION_TYPES),
    prompt: z.string().trim().min(1, 'Enter the question prompt.'),
    blankSentence: z.string(),
    correctAnswerText: z.string(),
    answerExplanation: z.string(),
    isCaseSensitive: z.boolean(),
    points: z.coerce.number().int().min(1),
    displayOrder: z.coerce.number().int().min(1),
    isActive: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.questionType !== 'FILL_BLANK') return
    if (!value.blankSentence.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['blankSentence'],
        message: 'Enter the sentence containing the blank.',
      })
    }
    if (!value.correctAnswerText.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['correctAnswerText'],
        message: 'Enter the correct answer.',
      })
    }
  })

export type QuestionFormValues = z.input<typeof questionFormSchema>
export type QuestionFormOutput = z.output<typeof questionFormSchema>

export const optionFormSchema = z.object({
  optionText: z.string().trim().min(1, 'Enter option text.'),
  isCorrect: z.boolean(),
  explanation: z.string(),
  displayOrder: z.coerce.number().int().min(1),
})

export type OptionFormValues = z.input<typeof optionFormSchema>
export type OptionFormOutput = z.output<typeof optionFormSchema>

export const toCreateQuizRequest = (
  values: QuizMetadataValues,
): CreateQuizRequest => {
  const parsed = quizMetadataSchema.parse(values)
  return {
    articleId: parsed.articleId,
    title: parsed.title,
    ...(parsed.description ? { description: parsed.description } : {}),
  }
}

export const toUpdateQuizRequest = (
  title: string,
  description: string,
): UpdateQuizRequest => ({
  title: title.trim(),
  description: description.trim(),
})

export const toQuestionRequest = (
  values: QuestionFormOutput,
): QuizQuestionRequest => {
  const shared = {
    articleVocabularyId: values.articleVocabularyId,
    questionType: values.questionType,
    prompt: values.prompt.trim(),
    answerExplanation: values.answerExplanation.trim() || null,
    points: values.points,
    displayOrder: values.displayOrder,
    isActive: values.isActive,
  }

  if (values.questionType === 'FILL_BLANK') {
    return {
      ...shared,
      blankSentence: values.blankSentence.trim(),
      correctAnswerText: values.correctAnswerText.trim(),
      isCaseSensitive: values.isCaseSensitive,
    }
  }

  return {
    ...shared,
    blankSentence: null,
    correctAnswerText: null,
    isCaseSensitive: false,
  }
}

export const toOptionRequest = (
  values: OptionFormOutput,
): QuestionOptionRequest => ({
  optionText: values.optionText.trim(),
  isCorrect: values.isCorrect,
  explanation: values.explanation.trim() || null,
  displayOrder: values.displayOrder,
})

export const isOptionQuestion = (type: QuestionType): boolean =>
  type !== 'FILL_BLANK'

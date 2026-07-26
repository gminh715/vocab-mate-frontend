import { z } from 'zod'
import type {
  CreateArticleRequest,
  UpdateArticleRequest,
} from '@/types/Admin/adminArticles'
import { CEFR_LEVELS } from '@/types/Auth/auth'

const optionalHttpUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(2_048, `${label} must be 2,048 characters or fewer.`)
    .refine(
      (value) =>
        value === '' ||
        (() => {
          try {
            const url = new URL(value)
            return url.protocol === 'http:' || url.protocol === 'https:'
          } catch {
            return false
          }
        })(),
      `Enter a complete http:// or https:// URL.`,
    )

export const articleFormSchema = z.object({
  categoryId: z.string().uuid('Choose a valid category.'),
  title: z
    .string()
    .trim()
    .min(1, 'Enter an article title.')
    .max(300, 'Title must be 300 characters or fewer.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Enter an article slug.')
    .max(200, 'Slug must be 200 characters or fewer.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and single hyphens only.',
    ),
  summary: z
    .string()
    .trim()
    .min(1, 'Enter an article summary.')
    .max(2_000, 'Summary must be 2,000 characters or fewer.'),
  cefrLevel: z.enum(CEFR_LEVELS, {
    error: 'Choose a CEFR level.',
  }),
  sourceName: z
    .string()
    .trim()
    .max(300, 'Source name must be 300 characters or fewer.'),
  sourceUrl: optionalHttpUrl('Source URL'),
  authorName: z
    .string()
    .trim()
    .max(300, 'Author must be 300 characters or fewer.'),
  thumbnailUrl: optionalHttpUrl('Thumbnail URL'),
  contentHtml: z
    .string()
    .min(1, 'Enter article content.')
    .max(1_000_000, 'Article HTML is too large.'),
})

export type ArticleFormValues = z.input<typeof articleFormSchema>
export type ArticleFormOutput = z.output<typeof articleFormSchema>

const optionalFields = (
  values: ArticleFormOutput,
): Pick<
  CreateArticleRequest,
  'sourceName' | 'sourceUrl' | 'authorName' | 'thumbnailUrl'
> => ({
  ...(values.sourceName ? { sourceName: values.sourceName } : {}),
  ...(values.sourceUrl ? { sourceUrl: values.sourceUrl } : {}),
  ...(values.authorName ? { authorName: values.authorName } : {}),
  ...(values.thumbnailUrl ? { thumbnailUrl: values.thumbnailUrl } : {}),
})

export const toCreateArticleRequest = (
  values: ArticleFormOutput,
): CreateArticleRequest => ({
  categoryId: values.categoryId,
  title: values.title,
  slug: values.slug,
  summary: values.summary,
  contentHtml: values.contentHtml,
  cefrLevel: values.cefrLevel,
  ...optionalFields(values),
})

export const toUpdateArticleRequest = (
  values: ArticleFormOutput,
  initialValues: ArticleFormOutput,
): UpdateArticleRequest => {
  return {
    ...(values.categoryId !== initialValues.categoryId
      ? { categoryId: values.categoryId }
      : {}),
    ...(values.title !== initialValues.title
      ? { title: values.title }
      : {}),
    ...(values.slug !== initialValues.slug
      ? { slug: values.slug }
      : {}),
    ...(values.summary !== initialValues.summary
      ? { summary: values.summary }
      : {}),
    ...(values.contentHtml !== initialValues.contentHtml
      ? { contentHtml: values.contentHtml }
      : {}),
    ...(values.cefrLevel !== initialValues.cefrLevel
      ? { cefrLevel: values.cefrLevel }
      : {}),
    ...(values.sourceName !== initialValues.sourceName
      ? { sourceName: values.sourceName }
      : {}),
    ...(values.sourceUrl !== initialValues.sourceUrl && values.sourceUrl
      ? { sourceUrl: values.sourceUrl }
      : {}),
    ...(values.authorName !== initialValues.authorName
      ? { authorName: values.authorName }
      : {}),
    ...(values.thumbnailUrl !== initialValues.thumbnailUrl &&
    values.thumbnailUrl
      ? { thumbnailUrl: values.thumbnailUrl }
      : {}),
  }
}

export const hasArticleContentChanged = (
  initialContentHtml: string,
  currentContentHtml: string,
): boolean => initialContentHtml !== currentContentHtml

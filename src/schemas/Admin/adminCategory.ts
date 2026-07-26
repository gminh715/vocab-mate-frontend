import { z } from 'zod'
import type {
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/types/Admin/adminCategories'

const maximumPostgresInteger = 2_147_483_647

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a category name.')
    .max(100, 'Name must be 100 characters or fewer.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Enter a category slug.')
    .max(200, 'Slug must be 200 characters or fewer.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and single hyphens only.',
    ),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer.'),
  isActive: z.boolean(),
  displayOrder: z
    .number({ error: 'Enter a display order.' })
    .int('Display order must be a whole number.')
    .min(0, 'Display order cannot be negative.')
    .max(
      maximumPostgresInteger,
      'Display order is larger than the supported maximum.',
    ),
})

export type CategoryFormValues = z.input<typeof categoryFormSchema>
export type CategoryFormOutput = z.output<typeof categoryFormSchema>

export const toCreateCategoryRequest = (
  values: CategoryFormOutput,
): CreateCategoryRequest => ({
  name: values.name,
  slug: values.slug,
  ...(values.description ? { description: values.description } : {}),
  isActive: values.isActive,
  displayOrder: values.displayOrder,
})

export const toUpdateCategoryRequest = (
  values: CategoryFormOutput,
): UpdateCategoryRequest => ({
  name: values.name,
  slug: values.slug,
  description: values.description,
  displayOrder: values.displayOrder,
})

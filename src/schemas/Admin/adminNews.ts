import { z } from 'zod'
import { GUARDIAN_ORDER_OPTIONS } from '@/types/Admin/adminNews'

const optionalDate = z
  .string()
  .refine(
    (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
    'Use a valid date.',
  )

export const adminNewsSearchSchema = z
  .object({
    q: z.string().trim().max(200, 'Search is too long.'),
    section: z.string().trim().max(100, 'Section is too long.'),
    fromDate: optionalDate,
    toDate: optionalDate,
    orderBy: z.enum(GUARDIAN_ORDER_OPTIONS),
  })
  .refine((values) => Boolean(values.q || values.section), {
    message: 'Enter a search phrase or Guardian section.',
    path: ['q'],
  })
  .refine(
    (values) =>
      !values.fromDate ||
      !values.toDate ||
      values.fromDate <= values.toDate,
    {
      message: 'The end date must be on or after the start date.',
      path: ['toDate'],
    },
  )

export type AdminNewsSearchFormValues = z.input<
  typeof adminNewsSearchSchema
>
export type AdminNewsSearchFormOutput = z.output<
  typeof adminNewsSearchSchema
>

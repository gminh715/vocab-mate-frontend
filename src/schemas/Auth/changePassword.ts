import { z } from 'zod'
import type { ChangePasswordRequest } from '@/types/Auth/auth'

const newPasswordSchema = z
  .string()
  .min(8, 'New password must be at least 8 characters.')
  .max(72, 'New password must be 72 characters or fewer.')
  .regex(/[a-z]/, 'New password must include a lowercase letter.')
  .regex(/[A-Z]/, 'New password must include an uppercase letter.')
  .regex(/\d/, 'New password must include a number.')
  .regex(
    /[^A-Za-z0-9]/,
    'New password must include a special character.',
  )

export const changePasswordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Enter your current password.')
      .max(72, 'Current password must be 72 characters or fewer.'),
    newPassword: newPasswordSchema,
    confirmNewPassword: z
      .string()
      .min(1, 'Confirm your new password.'),
  })
  .superRefine(
    (
      { confirmNewPassword, currentPassword, newPassword },
      context,
    ) => {
      if (newPassword === currentPassword) {
        context.addIssue({
          code: 'custom',
          path: ['newPassword'],
          message:
            'New password must be different from your current password.',
        })
      }

      if (confirmNewPassword !== newPassword) {
        context.addIssue({
          code: 'custom',
          path: ['confirmNewPassword'],
          message: 'New passwords do not match.',
        })
      }
    },
  )

export type ChangePasswordFormValues = z.input<
  typeof changePasswordFormSchema
>
export type ChangePasswordFormOutput = z.output<
  typeof changePasswordFormSchema
>

export const toChangePasswordRequest = ({
  confirmNewPassword,
  ...request
}: ChangePasswordFormOutput): ChangePasswordRequest => {
  void confirmNewPassword
  return request
}

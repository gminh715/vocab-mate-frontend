import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address.')
  .max(320, 'Email must be 320 characters or fewer.')

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Enter your password.')
    .max(72, 'Password must be 72 characters or fewer.'),
})

export const registerSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be 72 characters or fewer.')
    .regex(/[a-z]/, 'Password must include a lowercase letter.')
    .regex(/[A-Z]/, 'Password must include an uppercase letter.')
    .regex(/\d/, 'Password must include a number.')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must include a special character.',
    ),
  displayName: z
    .string()
    .trim()
    .min(1, 'Enter your display name.')
    .max(100, 'Display name must be 100 characters or fewer.'),
  preferredLanguage: z
    .string()
    .trim()
    .min(2, 'Language must be at least 2 characters.')
    .max(20, 'Language must be 20 characters or fewer.')
    .optional(),
})

export const registrationFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine(({ confirmPassword, password }) => confirmPassword === password, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  })

export type LoginFormValues = z.input<typeof loginSchema>
export type LoginRequest = z.output<typeof loginSchema>
export type RegisterFormValues = z.input<typeof registerSchema>
export type RegisterRequest = z.output<typeof registerSchema>
export type RegistrationFormValues = z.input<typeof registrationFormSchema>
export type RegistrationFormOutput = z.output<
  typeof registrationFormSchema
>

export const toRegisterRequest = ({
  confirmPassword,
  ...values
}: z.output<typeof registrationFormSchema>): RegisterRequest => {
  void confirmPassword
  return values
}

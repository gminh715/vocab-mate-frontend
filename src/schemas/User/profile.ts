import { z } from 'zod'
import {
  CEFR_LEVELS,
  type CefrLevel,
  type UpdateMyProfileRequest,
  type UserProfile,
} from '@/types/Auth/auth'

export const PREFERRED_LANGUAGES = ['vi', 'en'] as const

const optionalTrimmedValue = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === ''
    ? undefined
    : value

const cefrRank = (level: CefrLevel): number =>
  CEFR_LEVELS.indexOf(level)

export const profileFormSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, 'Enter your display name.')
      .max(100, 'Display name must be 100 characters or fewer.'),
    avatarUrl: z.preprocess(
      optionalTrimmedValue,
      z
        .string()
        .trim()
        .url('Enter a valid avatar URL, including https://.')
        .optional(),
    ),
    currentCefrLevel: z.enum(CEFR_LEVELS, {
      error: 'Choose a valid CEFR level.',
    }),
    learningGoal: z.preprocess(
      optionalTrimmedValue,
      z
        .enum(CEFR_LEVELS, {
          error: 'Choose a valid learning goal.',
        })
        .optional(),
    ),
    preferredLanguage: z.enum(PREFERRED_LANGUAGES, {
      error: 'Choose a supported language.',
    }),
  })
  .superRefine(({ currentCefrLevel, learningGoal }, context) => {
    if (
      learningGoal &&
      cefrRank(learningGoal) <= cefrRank(currentCefrLevel)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['learningGoal'],
        message:
          'Learning goal must be higher than your current CEFR level.',
      })
    }
  })

export type ProfileFormValues = z.input<typeof profileFormSchema>
export type ProfileFormOutput = z.output<typeof profileFormSchema>

export const profileToFormValues = (
  profile: UserProfile,
): ProfileFormValues => ({
  displayName: profile.displayName,
  avatarUrl: profile.avatarUrl ?? '',
  currentCefrLevel: profile.currentCefrLevel,
  learningGoal: profile.learningGoal ?? '',
  preferredLanguage:
    profile.preferredLanguage === 'en' ? 'en' : 'vi',
})

export const toUpdateMyProfileRequest = (
  values: ProfileFormOutput,
  current: UserProfile,
): UpdateMyProfileRequest => {
  const request: UpdateMyProfileRequest = {}

  if (values.displayName !== current.displayName) {
    request.displayName = values.displayName
  }
  if (values.avatarUrl && values.avatarUrl !== current.avatarUrl) {
    request.avatarUrl = values.avatarUrl
  }
  if (values.currentCefrLevel !== current.currentCefrLevel) {
    request.currentCefrLevel = values.currentCefrLevel
  }
  if (values.learningGoal && values.learningGoal !== current.learningGoal) {
    request.learningGoal = values.learningGoal
  }
  if (values.preferredLanguage !== current.preferredLanguage) {
    request.preferredLanguage = values.preferredLanguage
  }

  return request
}

export const validAvatarPreviewUrl = (value: string): string | undefined => {
  const result = z.string().trim().url().safeParse(value)
  return result.success ? result.data : undefined
}

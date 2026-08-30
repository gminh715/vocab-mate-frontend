import { z } from 'zod'
import {
  CEFR_LEVELS,
  type CefrLevel,
  type CurrentUser,
  type UpdateMyProfileRequest,
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
        .optional()
        .nullable(),
    ),
    currentCefrLevel: z.preprocess(
      optionalTrimmedValue,
      z
        .enum(CEFR_LEVELS, {
          error: 'Choose a valid CEFR level.',
        })
        .optional()
        .nullable(),
    ),
    learningGoal: z.preprocess(
      optionalTrimmedValue,
      z
        .enum(CEFR_LEVELS, {
          error: 'Choose a valid learning goal.',
        })
        .optional()
        .nullable(),
    ),
    preferredLanguage: z.enum(PREFERRED_LANGUAGES, {
      error: 'Choose a supported language.',
    }),
    dailyStudyMinutes: z
      .union([
        z.literal(5),
        z.literal(10),
        z.literal(15),
        z.literal(20),
      ])
      .default(10),
  })
  .superRefine(({ currentCefrLevel, learningGoal }, context) => {
    if (
      currentCefrLevel &&
      learningGoal &&
      cefrRank(learningGoal) < cefrRank(currentCefrLevel)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['learningGoal'],
        message:
          'Learning goal cannot be lower than your current CEFR level.',
      })
    }
  })

export type ProfileFormValues = z.input<typeof profileFormSchema>
export type ProfileFormOutput = z.output<typeof profileFormSchema>

export const profileToFormValues = (
  profile: CurrentUser,
): ProfileFormValues => ({
  displayName: profile.displayName,
  avatarUrl: profile.avatarUrl ?? '',
  currentCefrLevel: profile.currentCefrLevel ?? '',
  learningGoal: profile.learningGoal ?? '',
  preferredLanguage:
    profile.preferredLanguage === 'en' ? 'en' : 'vi',
  dailyStudyMinutes: ([5, 10, 15, 20] as const).includes(profile.dailyStudyMinutes as 5 | 10 | 15 | 20)
    ? (profile.dailyStudyMinutes as 5 | 10 | 15 | 20)
    : 10,
})

export const toUpdateMyProfileRequest = (
  values: ProfileFormOutput,
  current: CurrentUser,
): UpdateMyProfileRequest => {
  const request: UpdateMyProfileRequest = {}

  if (values.displayName !== current.displayName) {
    request.displayName = values.displayName
  }
  const nextAvatar = values.avatarUrl ?? null
  if (nextAvatar !== current.avatarUrl) {
    request.avatarUrl = nextAvatar ?? undefined
  }
  const nextCefr = values.currentCefrLevel ?? null
  if (nextCefr !== current.currentCefrLevel) {
    request.currentCefrLevel = nextCefr
  }
  const nextGoal = values.learningGoal ?? null
  if (nextGoal !== current.learningGoal) {
    request.learningGoal = nextGoal
  }
  if (values.preferredLanguage !== current.preferredLanguage) {
    request.preferredLanguage = values.preferredLanguage
  }
  if (values.dailyStudyMinutes !== current.dailyStudyMinutes) {
    request.dailyStudyMinutes = values.dailyStudyMinutes
  }

  return request
}

export const validAvatarPreviewUrl = (value: string): string | undefined => {
  const result = z.string().trim().url().safeParse(value)
  return result.success ? result.data : undefined
}

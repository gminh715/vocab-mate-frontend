import {
  QUIZ_STATUSES,
  type AdminQuizListParams,
  type QuizStatus,
} from '@/types/Admin/adminQuizzes'

const boundedInteger = (
  value: string | null,
  fallback: number,
  maximum = Number.POSITIVE_INFINITY,
): number => {
  const parsed = Number(value)
  return value &&
    Number.isInteger(parsed) &&
    parsed >= 1 &&
    parsed <= maximum
    ? parsed
    : fallback
}

export const adminQuizListParamsFromSearchParams = (
  searchParams: URLSearchParams,
): AdminQuizListParams => {
  const q = searchParams.get('q')?.trim()
  const articleId = searchParams.get('articleId')?.trim()
  const rawStatus = searchParams.get('status')
  const status = QUIZ_STATUSES.includes(rawStatus as QuizStatus)
    ? (rawStatus as QuizStatus)
    : undefined

  return {
    page: boundedInteger(searchParams.get('page'), 1),
    limit: boundedInteger(searchParams.get('limit'), 20, 100),
    ...(q ? { q } : {}),
    ...(articleId ? { articleId } : {}),
    ...(status ? { status } : {}),
  }
}

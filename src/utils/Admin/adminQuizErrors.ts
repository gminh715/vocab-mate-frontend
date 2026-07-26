import { normalizeApiError } from '@/config/apiClient'

export const quizOrderingErrorMessage = (
  error: unknown,
  entity: 'question' | 'option',
): string => {
  const apiError = normalizeApiError(error)
  const message = apiError.details?.[0] ?? apiError.message

  return apiError.status === 409
    ? `${message} Choose a display order not used by another ${entity}.`
    : message
}

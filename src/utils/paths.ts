import type { Location } from 'react-router-dom'
import type { CurrentUser, UserRole } from '@/types/Auth/auth'
import type { ReviewGoal } from '@/types/Review/review'

export const routePaths = {
  home: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  articles: '/articles',
  articleDetail: '/articles/:slug',
  reader: '/read/:slug',
  readingHistory: '/reading-history',
  reviewHistory: '/review-history',
  profileSettings: '/settings/profile',
  securitySettings: '/settings/security',
  vocabularies: '/vocabularies',
  vocabularyDetail: '/vocabularies/:userVocabularyId',
  review: '/review',
  reviewSession: '/review/:sessionId',
  reviewSummary: '/review/:sessionId/summary',
  admin: '/admin',
  adminUsers: '/admin/users',
  adminUserDetail: '/admin/users/:userId',
  adminCategories: '/admin/categories',
  adminArticles: '/admin/articles',
  adminNews: '/admin/news',
  adminArticleNew: '/admin/articles/new',
  adminArticleEdit: '/admin/articles/:articleId/edit',
  adminArticleContent: '/admin/articles/:articleId/content',
  adminArticlePreview: '/admin/articles/:articleId/preview',
  adminAnalytics: '/admin/analytics',
  forbidden: '/forbidden',
} as const

export const defaultAuthenticatedPath = (role: UserRole): string =>
  role === 'ADMIN' ? routePaths.admin : routePaths.home

export const adminUserPath = (userId: string): string =>
  routePaths.adminUserDetail.replace(':userId', encodeURIComponent(userId))

export const adminArticleEditPath = (articleId: string): string =>
  routePaths.adminArticleEdit.replace(
    ':articleId',
    encodeURIComponent(articleId),
  )

export const adminArticleContentPath = (articleId: string): string =>
  routePaths.adminArticleContent.replace(
    ':articleId',
    encodeURIComponent(articleId),
  )

export const adminArticlePreviewPath = (articleId: string): string =>
  routePaths.adminArticlePreview.replace(
    ':articleId',
    encodeURIComponent(articleId),
  )

export const articlePath = (slug: string): string => readerPath(slug)

export const readerPath = (slug: string): string =>
  routePaths.reader.replace(':slug', encodeURIComponent(slug))

export const vocabularyDetailPath = (userVocabularyId: string): string =>
  routePaths.vocabularyDetail.replace(
    ':userVocabularyId',
    encodeURIComponent(userVocabularyId),
  )

export const reviewSessionPath = (sessionId: string): string =>
  routePaths.reviewSession.replace(':sessionId', encodeURIComponent(sessionId))

export const reviewSummaryPath = (sessionId: string): string =>
  routePaths.reviewSummary.replace(':sessionId', encodeURIComponent(sessionId))

export const reviewStartPath = (reviewGoal?: ReviewGoal): string =>
  reviewGoal
    ? `${routePaths.review}?${new URLSearchParams({ reviewGoal }).toString()}`
    : routePaths.review

export interface AuthRedirectState {
  from?: string
}

export const requestedPath = (location: Location): string =>
  `${location.pathname}${location.search}${location.hash}`

const isSafeInternalPath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.includes('\\')

export const postAuthPath = (
  role: UserRole,
  state: unknown,
): string => {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    isSafeInternalPath(state.from)
  ) {
    return state.from
  }

  return defaultAuthenticatedPath(role)
}

export const postLoginPath = (
  user: CurrentUser,
  state: unknown,
): string =>
  user.role === 'USER' && user.profile.dailyStudyMinutes === null
    ? routePaths.onboarding
    : postAuthPath(user.role, state)

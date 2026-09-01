import type { Location } from 'react-router-dom'
import type { CurrentUser, UserRole } from '@/types/Auth/auth'

export const routePaths = {
  home: '/',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  articles: '/articles',
  articleDetail: '/articles/:slug',
  reader: '/read/:slug',
  readingHistory: '/reading-history',
  profileSettings: '/settings/profile',
  securitySettings: '/settings/security',
  vocabularies: '/vocabularies',
  tutor: '/tutor',
  tutorSession: '/tutor/session',
  tutorHistoryDetail: '/tutor/history/:sessionId',
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

export const tutorHistoryDetailPath = (sessionId: string): string =>
  routePaths.tutorHistoryDetail.replace(
    ':sessionId',
    encodeURIComponent(sessionId),
  )

export interface AuthRedirectState {
  from?: string
}

export const requestedPath = (location: Location): string =>
  `${location.pathname}${location.search}${location.hash}`

export const postAuthPath = (
  role: UserRole,
  _state?: unknown,
): string => {
  return defaultAuthenticatedPath(role)
}

export const postLoginPath = (
  user: CurrentUser,
  _state?: unknown,
): string =>
  user.role === 'USER' && user.learningGoal === null
    ? routePaths.onboarding
    : defaultAuthenticatedPath(user.role)

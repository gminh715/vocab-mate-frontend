import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import {
  GuestRoute,
  ProtectedRoute,
  RoleRoute,
} from '@/components/Auth/AuthRouteGuards'
import { routePaths } from '@/utils/paths'

const AuthenticatedLayout = lazy(() =>
  import('@/components/Layout/AuthenticatedLayout').then(
    ({ AuthenticatedLayout: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminLayout = lazy(() =>
  import('@/components/Admin/AdminLayout').then(
    ({ AdminLayout: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminPage = lazy(() =>
  import('@/pages/Admin/AdminPage').then(({ AdminPage: Component }) => ({
    default: Component,
  })),
)

const AdminUsersPage = lazy(() =>
  import('@/pages/Admin/AdminUsersPage').then(
    ({ AdminUsersPage: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminUserDetailPage = lazy(() =>
  import('@/pages/Admin/AdminUserDetailPage').then(
    ({ AdminUserDetailPage: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminCategoriesPage = lazy(() =>
  import('@/pages/Admin/AdminCategoriesPage').then(
    ({ AdminCategoriesPage: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminArticlesPage = lazy(() =>
  import('@/pages/Admin/AdminArticlesPage').then(
    ({ AdminArticlesPage: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminArticleCreatePage = lazy(() =>
  import('@/pages/Admin/AdminArticleFormPage').then(
    ({ AdminArticleCreatePage: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminArticleEditPage = lazy(() =>
  import('@/pages/Admin/AdminArticleFormPage').then(
    ({ AdminArticleEditPage: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminArticleContentPage = lazy(() =>
  import('@/pages/Admin/AdminArticleContentPage').then(
    ({ AdminArticleContentPage: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminArticlePreviewPage = lazy(() =>
  import('@/pages/Admin/AdminArticlePreviewPage').then(
    ({ AdminArticlePreviewPage: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminQuizzesPage = lazy(() =>
  import('@/pages/Admin/AdminQuizzesPage').then(
    ({ AdminQuizzesPage: Component }) => ({ default: Component }),
  ),
)

const AdminQuizCreatePage = lazy(() =>
  import('@/pages/Admin/AdminQuizCreatePage').then(
    ({ AdminQuizCreatePage: Component }) => ({ default: Component }),
  ),
)

const AdminQuizBuilderPage = lazy(() =>
  import('@/pages/Admin/AdminQuizBuilderPage').then(
    ({ AdminQuizBuilderPage: Component }) => ({ default: Component }),
  ),
)

const AdminAnalyticsPage = lazy(() =>
  import('@/pages/Admin/AdminAnalyticsPage').then(
    ({ AdminAnalyticsPage: Component }) => ({ default: Component }),
  ),
)

const AdminNotFoundPage = lazy(() =>
  import('@/pages/Admin/AdminNotFoundPage').then(
    ({ AdminNotFoundPage: Component }) => ({
      default: Component,
    }),
  ),
)

const ForbiddenPage = lazy(() =>
  import('@/pages/Error/ForbiddenPage').then(({ ForbiddenPage: Component }) => ({
    default: Component,
  })),
)

const HomePage = lazy(() =>
  import('@/pages/Home/HomePage').then(({ HomePage: Component }) => ({
    default: Component,
  })),
)

const ArticlesPage = lazy(() =>
  import('@/pages/Article/ArticlesPage').then(({ ArticlesPage: Component }) => ({
    default: Component,
  })),
)

const ArticleDetailPage = lazy(() =>
  import('@/pages/Article/ArticleDetailPage').then(
    ({ ArticleDetailPage: Component }) => ({
      default: Component,
    }),
  ),
)

const ArticleReaderPage = lazy(() =>
  import('@/pages/Article/ArticleReaderPage').then(
    ({ ArticleReaderPage: Component }) => ({
      default: Component,
    }),
  ),
)

const ReadingHistoryPage = lazy(() =>
  import('@/pages/User/ReadingHistoryPage').then(
    ({ ReadingHistoryPage: Component }) => ({
      default: Component,
    }),
  ),
)

const AdminNewsPage = lazy(() =>
  import('@/pages/Admin/AdminNewsPage').then(
    ({ AdminNewsPage: Component }) => ({
      default: Component,
    }),
  ),
)

const ProfileSettingsPage = lazy(() =>
  import('@/pages/User/ProfileSettingsPage').then(
    ({ ProfileSettingsPage: Component }) => ({
      default: Component,
    }),
  ),
)

const SecuritySettingsPage = lazy(() =>
  import('@/pages/User/SecuritySettingsPage').then(
    ({ SecuritySettingsPage: Component }) => ({
      default: Component,
    }),
  ),
)

const SavedVocabularyPage = lazy(() =>
  import('@/pages/Vocabulary/SavedVocabularyPage').then(
    ({ SavedVocabularyPage: Component }) => ({
      default: Component,
    }),
  ),
)

const VocabularyDetailPage = lazy(() =>
  import('@/pages/Vocabulary/VocabularyDetailPage').then(
    ({ VocabularyDetailPage: Component }) => ({
      default: Component,
    }),
  ),
)

const LoginPage = lazy(() =>
  import('@/pages/Auth/LoginPage').then(({ LoginPage: Component }) => ({
    default: Component,
  })),
)

const RegisterPage = lazy(() =>
  import('@/pages/Auth/RegisterPage').then(({ RegisterPage: Component }) => ({
    default: Component,
  })),
)

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path={routePaths.login} element={<LoginPage />} />
        <Route path={routePaths.register} element={<RegisterPage />} />
      </Route>

      <Route element={<AuthenticatedLayout />}>
        <Route path={routePaths.articles} element={<ArticlesPage />} />
        <Route
          path={routePaths.articleDetail}
          element={<ArticleDetailPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path={routePaths.home} element={<HomePage />} />
          <Route
            path={routePaths.reader}
            element={<ArticleReaderPage />}
          />
          <Route
            path={routePaths.readingHistory}
            element={<ReadingHistoryPage />}
          />
          <Route
            path={routePaths.profileSettings}
            element={<ProfileSettingsPage />}
          />
          <Route
            path={routePaths.securitySettings}
            element={<SecuritySettingsPage />}
          />
          <Route
            path={routePaths.vocabularies}
            element={<SavedVocabularyPage />}
          />
          <Route
            path={routePaths.vocabularyDetail}
            element={<VocabularyDetailPage />}
          />
          <Route
            path={routePaths.forbidden}
            element={<ForbiddenPage />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
          <Route path={routePaths.admin} element={<AdminLayout />}>
            <Route index element={<AdminPage />} />
            <Route
              path={routePaths.adminUsers}
              element={<AdminUsersPage />}
            />
            <Route
              path={routePaths.adminUserDetail}
              element={<AdminUserDetailPage />}
            />
            <Route
              path={routePaths.adminCategories}
              element={<AdminCategoriesPage />}
            />
            <Route
              path={routePaths.adminArticles}
              element={<AdminArticlesPage />}
            />
            <Route
              path={routePaths.adminNews}
              element={<AdminNewsPage />}
            />
            <Route
              path={routePaths.adminArticleNew}
              element={<AdminArticleCreatePage />}
            />
            <Route
              path={routePaths.adminArticleEdit}
              element={<AdminArticleEditPage />}
            />
            <Route
              path={routePaths.adminArticleContent}
              element={<AdminArticleContentPage />}
            />
            <Route
              path={routePaths.adminArticlePreview}
              element={<AdminArticlePreviewPage />}
            />
            <Route
              path={routePaths.adminQuizzes}
              element={<AdminQuizzesPage />}
            />
            <Route
              path={routePaths.adminQuizNew}
              element={<AdminQuizCreatePage />}
            />
            <Route
              path={routePaths.adminQuizEdit}
              element={<AdminQuizBuilderPage />}
            />
            <Route
              path={routePaths.adminAnalytics}
              element={<AdminAnalyticsPage />}
            />
            <Route path="*" element={<AdminNotFoundPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to={routePaths.home} replace />}
        />
      </Route>
    </Routes>
  )
}


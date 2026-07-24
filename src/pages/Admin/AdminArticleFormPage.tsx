import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { AdminArticleForm } from '../../components/AdminArticleForm'
import { ArticleClassification } from '../../components/ArticleChips'
import { normalizeApiError } from '../../config/apiClient'
import {
  useAdminArticleDetailQuery,
  useCreateAdminArticleMutation,
  useUpdateAdminArticleMutation,
} from '../../hooks/useAdminArticles'
import { useAdminCategoryOptionsQuery } from '../../hooks/useAdminCategories'
import type { ArticleFormOutput } from '../../schemas/admin-article'
import type {
  AdminArticle,
  CreateArticleRequest,
  UpdateArticleRequest,
} from '../../types/admin-articles'
import {
  adminArticleContentPath,
  adminArticleEditPath,
  adminArticlePreviewPath,
  routePaths,
} from '../../utils/paths'

const errorMessage = (error: unknown): string => {
  const apiError = normalizeApiError(error)
  return apiError.details?.[0] ?? apiError.message
}

const articleToFormValues = (
  article: AdminArticle,
): ArticleFormOutput => ({
  categoryId: article.categoryId,
  title: article.title,
  slug: article.slug,
  summary: article.summary,
  cefrLevel: article.cefrLevel,
  sourceName: article.sourceName ?? '',
  sourceUrl: article.sourceUrl ?? '',
  authorName: article.authorName ?? '',
  thumbnailUrl: article.thumbnailUrl ?? '',
  contentHtml: article.contentHtml,
})

interface NavigationState {
  feedback?: string
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <Stack spacing={1} sx={{ maxWidth: 820 }}>
      <Typography
        sx={{
          color: 'primary.main',
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </Typography>
      <Typography
        variant="h1"
        sx={{ fontSize: { xs: 34, md: 46 }, textWrap: 'balance' }}
      >
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Stack>
  )
}

function CategoriesError({
  onRetry,
  error,
}: {
  onRetry: () => void
  error: unknown
}) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      Categories could not be loaded. {errorMessage(error)}
    </Alert>
  )
}

export function AdminArticleCreatePage() {
  const navigate = useNavigate()
  const categoriesQuery = useAdminCategoryOptionsQuery(true)
  const createMutation = useCreateAdminArticleMutation()

  const submit = async (request: CreateArticleRequest) => {
    const result = await createMutation.mutateAsync(request)
    navigate(adminArticleEditPath(result.article.id), {
      replace: true,
      state: { feedback: 'Draft article created.' } satisfies NavigationState,
    })
  }

  return (
    <Stack spacing={3.5}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' } }}
      >
        <PageHeading
          eyebrow="New draft"
          title="New article"
          description="Add the source metadata and HTML. Sentence parsing and term management happen in the next content workflow."
        />
        <Button
          component={RouterLink}
          to={routePaths.adminArticles}
          color="inherit"
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          Back to articles
        </Button>
      </Stack>

      {categoriesQuery.isPending ? (
        <Paper
          variant="outlined"
          sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">
              Loading categories…
            </Typography>
          </Stack>
        </Paper>
      ) : categoriesQuery.isError ? (
        <CategoriesError
          error={categoriesQuery.error}
          onRetry={() => categoriesQuery.refetch()}
        />
      ) : categoriesQuery.data.length === 0 ? (
        <Alert
          severity="warning"
          action={
            <Button
              component={RouterLink}
              to={routePaths.adminCategories}
              color="inherit"
            >
              Manage categories
            </Button>
          }
        >
          Create or activate a category before creating an article.
        </Alert>
      ) : (
        <AdminArticleForm
          mode="create"
          categories={categoriesQuery.data}
          isPending={createMutation.isPending}
          serverError={
            createMutation.isError
              ? errorMessage(createMutation.error)
              : null
          }
          onCancel={() => navigate(routePaths.adminArticles)}
          onSubmit={submit}
        />
      )}
    </Stack>
  )
}

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <Box>
      <Typography
        color="text.secondary"
        sx={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          mt: 0.5,
          fontSize: 22,
          fontWeight: 750,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

export function AdminArticleEditPage() {
  const { articleId = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const detailQuery = useAdminArticleDetailQuery(articleId)
  const categoriesQuery = useAdminCategoryOptionsQuery(true)
  const updateMutation = useUpdateAdminArticleMutation(articleId)
  const navigationState = location.state as NavigationState | null
  const [feedback, setFeedback] = useState(
    navigationState?.feedback ?? null,
  )

  const categories = useMemo(() => {
    const items = categoriesQuery.data ?? []
    const currentCategory = detailQuery.data?.article.category

    if (
      !currentCategory ||
      items.some((category) => category.id === currentCategory.id)
    ) {
      return items
    }

    return [currentCategory, ...items]
  }, [categoriesQuery.data, detailQuery.data?.article.category])

  if (detailQuery.isPending || categoriesQuery.isPending) {
    return (
      <Stack spacing={3.5}>
        <PageHeading
          eyebrow="Article editor"
          title="Edit article"
          description="Loading article metadata and content."
        />
        <Paper
          variant="outlined"
          sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}
        >
          <Stack role="status" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={32} />
            <Typography color="text.secondary">Loading article…</Typography>
          </Stack>
        </Paper>
      </Stack>
    )
  }

  if (detailQuery.isError) {
    return (
      <Stack spacing={3.5}>
        <PageHeading
          eyebrow="Article editor"
          title="Edit article"
          description="Update article metadata and source HTML."
        />
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => detailQuery.refetch()}>
              Try again
            </Button>
          }
        >
          {errorMessage(detailQuery.error)}
        </Alert>
        <Button
          component={RouterLink}
          to={routePaths.adminArticles}
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to articles
        </Button>
      </Stack>
    )
  }

  if (categoriesQuery.isError) {
    return (
      <Stack spacing={3.5}>
        <PageHeading
          eyebrow="Article editor"
          title="Edit article"
          description="Update article metadata and source HTML."
        />
        <CategoriesError
          error={categoriesQuery.error}
          onRetry={() => categoriesQuery.refetch()}
        />
      </Stack>
    )
  }

  const { article, sentenceCount, termCount, quizCount } =
    detailQuery.data
  const initialValues = articleToFormValues(article)

  if (article.status === 'ARCHIVED') {
    return (
      <Stack spacing={2.5}>
        <PageHeading
          eyebrow="Archived article"
          title="Edit article"
          description={`${article.title} is archived and cannot be edited. Restore the article to draft in the lifecycle workflow before changing it.`}
        />
        <ArticleClassification
          status={article.status}
          cefrLevel={article.cefrLevel}
        />
        <Button
          component={RouterLink}
          to={routePaths.adminArticles}
          variant="outlined"
          sx={{ alignSelf: 'flex-start' }}
        >
          Back to articles
        </Button>
      </Stack>
    )
  }

  const submit = async (request: UpdateArticleRequest) => {
    const result = await updateMutation.mutateAsync(request)
    setFeedback(
      result.contentChanged
        ? 'Article saved. Content changed, so parse it again before publication.'
        : 'Article details updated.',
    )
  }

  return (
    <Stack spacing={3.5}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { lg: 'flex-end' } }}
      >
        <PageHeading
          eyebrow="Article editor"
          title="Edit article"
          description={`Update metadata and source HTML for “${article.title}” without changing backend-owned sentence or term markers.`}
        />
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            component={RouterLink}
            to={adminArticleContentPath(article.id)}
            variant="outlined"
          >
            Manage content
          </Button>
          <Button
            component={RouterLink}
            to={adminArticlePreviewPath(article.id)}
            variant="outlined"
          >
            Preview
          </Button>
          <Button
            component={RouterLink}
            to={routePaths.adminArticles}
            color="inherit"
          >
            Back to articles
          </Button>
        </Stack>
      </Stack>

      {feedback ? (
        <Alert severity="success" onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      ) : null}

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderLeft: 4,
          borderLeftColor: 'primary.main',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          sx={{ alignItems: { md: 'center' } }}
        >
          <ArticleClassification
            status={article.status}
            cefrLevel={article.cefrLevel}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                sm: 'repeat(4, minmax(100px, 1fr))',
              },
              gap: { xs: 2, sm: 4 },
              flex: 1,
            }}
          >
            <SummaryItem
              label="Content version"
              value={`v${article.contentVersion}`}
            />
            <SummaryItem label="Sentences" value={sentenceCount} />
            <SummaryItem label="Terms" value={termCount} />
            <SummaryItem label="Quizzes" value={quizCount} />
          </Box>
        </Stack>
      </Paper>

      <AdminArticleForm
        mode="edit"
        categories={categories}
        initialValues={initialValues}
        isPending={updateMutation.isPending}
        serverError={
          updateMutation.isError ? errorMessage(updateMutation.error) : null
        }
        onCancel={() => navigate(routePaths.adminArticles)}
        onSubmit={submit}
      />
    </Stack>
  )
}
